import { MongoClient, Db, ObjectId } from 'mongodb';
import type {
  Tenant,
  Conversation,
  KnowledgeDoc,
  AuditLog,
  User,
  ConversationMessage,
} from '@/db/schema';

const uri = process.env.MONGODB_URI!;

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;

  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }

  db = client.db('agent-platform');

  // Create indexes
  await Promise.all([
    db.collection('knowledge_docs').createIndex(
      { content: 'text', title: 'text' },
      { weights: { title: 10, content: 5 } }
    ),
    db.collection('conversations').createIndex({ tenantId: 1, updatedAt: -1 }),
    db.collection('conversations').createIndex({ tenantId: 1, channelId: 1, userId: 1 }),
    db.collection('tenants').createIndex({ slackTeamId: 1 }, { sparse: true }),
    db.collection('tenants').createIndex({ whatsappBusinessId: 1 }, { sparse: true }),
    db.collection('users').createIndex({ tenantId: 1, externalId: 1, channelType: 1 }),
    db.collection('audit_logs').createIndex({ tenantId: 1, timestamp: -1 }),
  ]);

  return db;
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

// Tenant operations
export async function getTenantBySlackTeam(teamId: string): Promise<Tenant | null> {
  const database = await getDb();
  return database.collection<Tenant>('tenants').findOne({ slackTeamId: teamId });
}

export async function getTenantByWhatsAppBusinessId(businessId: string): Promise<Tenant | null> {
  const database = await getDb();
  return database.collection<Tenant>('tenants').findOne({ whatsappBusinessId: businessId });
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const database = await getDb();
  return database.collection<Tenant>('tenants').findOne({ _id: new ObjectId(id) });
}

export async function createTenant(tenant: Omit<Tenant, '_id'>): Promise<Tenant> {
  const database = await getDb();
  const result = await database.collection<Tenant>('tenants').insertOne(tenant as Tenant);
  return { ...tenant, _id: result.insertedId } as Tenant;
}

export async function updateTenantSettings(
  tenantId: string,
  settings: Partial<Tenant['settings']>
): Promise<void> {
  const database = await getDb();
  await database.collection<Tenant>('tenants').updateOne(
    { _id: new ObjectId(tenantId) },
    {
      $set: {
        ...Object.fromEntries(
          Object.entries(settings).map(([key, value]) => [`settings.${key}`, value])
        ),
        updatedAt: new Date(),
      },
    }
  );
}

// Conversation operations
export async function getOrCreateConversation(params: {
  tenantId: ObjectId;
  channelType: 'slack' | 'whatsapp' | 'web';
  channelId: string;
  userId: string;
}): Promise<Conversation> {
  const database = await getDb();
  const existing = await database.collection<Conversation>('conversations').findOne({
    tenantId: params.tenantId,
    channelId: params.channelId,
    userId: params.userId,
    status: 'active',
  });

  if (existing) return existing;

  const now = new Date();
  const conversation: Omit<Conversation, '_id'> = {
    tenantId: params.tenantId,
    channelType: params.channelType,
    channelId: params.channelId,
    userId: params.userId,
    messages: [],
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  const result = await database
    .collection<Conversation>('conversations')
    .insertOne(conversation as Conversation);
  return { ...conversation, _id: result.insertedId } as Conversation;
}

export async function saveMessages(
  conversationId: ObjectId,
  messages: Omit<ConversationMessage, 'timestamp'>[]
): Promise<void> {
  const database = await getDb();
  const timestampedMessages = messages.map((m) => ({
    ...m,
    timestamp: new Date(),
  }));

  await database.collection<Conversation>('conversations').updateOne(
    { _id: conversationId },
    {
      $push: { messages: { $each: timestampedMessages } },
      $set: { updatedAt: new Date() },
    }
  );
}

export async function getConversations(
  tenantId: string,
  options: { status?: string; limit?: number; offset?: number } = {}
): Promise<Conversation[]> {
  const database = await getDb();
  const query: Record<string, unknown> = { tenantId: new ObjectId(tenantId) };
  if (options.status) query.status = options.status;

  return database
    .collection<Conversation>('conversations')
    .find(query)
    .sort({ updatedAt: -1 })
    .skip(options.offset || 0)
    .limit(options.limit || 20)
    .toArray();
}

export async function getConversationStats(tenantId: string): Promise<{
  active: number;
  resolvedToday: number;
  total: number;
}> {
  const database = await getDb();
  const tenantObjId = new ObjectId(tenantId);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [active, resolvedToday, total] = await Promise.all([
    database.collection<Conversation>('conversations').countDocuments({
      tenantId: tenantObjId,
      status: 'active',
    }),
    database.collection<Conversation>('conversations').countDocuments({
      tenantId: tenantObjId,
      status: 'resolved',
      updatedAt: { $gte: todayStart },
    }),
    database.collection<Conversation>('conversations').countDocuments({
      tenantId: tenantObjId,
    }),
  ]);

  return { active, resolvedToday, total };
}

// Knowledge operations
export async function createKnowledgeDoc(doc: Omit<KnowledgeDoc, '_id'>): Promise<KnowledgeDoc> {
  const database = await getDb();
  const result = await database.collection<KnowledgeDoc>('knowledge_docs').insertOne(doc as KnowledgeDoc);
  return { ...doc, _id: result.insertedId } as KnowledgeDoc;
}

export async function getKnowledgeDocs(
  tenantId: string,
  options: { category?: string; limit?: number } = {}
): Promise<KnowledgeDoc[]> {
  const database = await getDb();
  const query: Record<string, unknown> = { tenantId: new ObjectId(tenantId) };
  if (options.category) query.category = options.category;

  return database
    .collection<KnowledgeDoc>('knowledge_docs')
    .find(query)
    .limit(options.limit || 50)
    .toArray();
}

export async function getKnowledgeDocCount(tenantId: string): Promise<number> {
  const database = await getDb();
  return database
    .collection<KnowledgeDoc>('knowledge_docs')
    .countDocuments({ tenantId: new ObjectId(tenantId) });
}

// Audit logging
export async function createAuditLog(log: Omit<AuditLog, '_id'>): Promise<void> {
  const database = await getDb();
  await database.collection<AuditLog>('audit_logs').insertOne(log as AuditLog);
}

// User operations
export async function getOrCreateUser(params: {
  tenantId: ObjectId;
  externalId: string;
  channelType: 'slack' | 'whatsapp' | 'web';
  name?: string;
}): Promise<User> {
  const database = await getDb();
  const existing = await database.collection<User>('users').findOne({
    tenantId: params.tenantId,
    externalId: params.externalId,
    channelType: params.channelType,
  });

  if (existing) return existing;

  const now = new Date();
  const user: Omit<User, '_id'> = {
    tenantId: params.tenantId,
    externalId: params.externalId,
    channelType: params.channelType,
    name: params.name,
    roles: [],
    createdAt: now,
    updatedAt: now,
  };

  const result = await database.collection<User>('users').insertOne(user as User);
  return { ...user, _id: result.insertedId } as User;
}

export { ObjectId };
