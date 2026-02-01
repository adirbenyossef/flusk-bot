import { ObjectId } from 'mongodb';
import { getDb } from './mongodb';
import { generateEmbedding } from './openrouter';
import type { KnowledgeDoc } from '@/db/schema';

export async function searchKnowledge(
  query: string,
  tenantId: string,
  userRoles: string[]
): Promise<KnowledgeDoc[]> {
  const db = await getDb();

  const results = await db
    .collection<KnowledgeDoc>('knowledge_docs')
    .find({
      tenantId: new ObjectId(tenantId),
      $text: { $search: query },
      $or: [
        { accessRoles: { $size: 0 } },
        { accessRoles: { $in: userRoles } },
      ],
    })
    .project({ score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(5)
    .toArray();

  return results;
}

export async function semanticSearch(
  query: string,
  tenantId: string,
  userRoles: string[] = []
): Promise<KnowledgeDoc[]> {
  const db = await getDb();

  const embedding = await generateEmbedding(query);

  const pipeline = [
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector: embedding,
        numCandidates: 100,
        limit: 10,
        filter: { tenantId: new ObjectId(tenantId) },
      },
    },
    {
      $match: {
        $or: [
          { accessRoles: { $size: 0 } },
          { accessRoles: { $in: userRoles } },
        ],
      },
    },
    {
      $limit: 5,
    },
  ];

  const results = await db
    .collection<KnowledgeDoc>('knowledge_docs')
    .aggregate(pipeline)
    .toArray();

  return results as KnowledgeDoc[];
}

export async function indexDocument(doc: KnowledgeDoc): Promise<void> {
  const db = await getDb();

  const embedding = await generateEmbedding(`${doc.title}\n\n${doc.content}`);

  await db.collection<KnowledgeDoc>('knowledge_docs').updateOne(
    { _id: doc._id },
    { $set: { embedding, updatedAt: new Date() } }
  );
}

export async function bulkIndexDocuments(tenantId: string): Promise<number> {
  const db = await getDb();

  const docs = await db
    .collection<KnowledgeDoc>('knowledge_docs')
    .find({
      tenantId: new ObjectId(tenantId),
      embedding: { $exists: false },
    })
    .toArray();

  let indexed = 0;
  for (const doc of docs) {
    try {
      await indexDocument(doc);
      indexed++;
    } catch (error) {
      console.error(`Failed to index document ${doc._id}:`, error);
    }
  }

  return indexed;
}
