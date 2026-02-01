import type { ObjectId } from 'mongodb';

export interface Tenant {
  _id: ObjectId;
  name: string;
  slackTeamId?: string;
  whatsappBusinessId?: string;
  settings: {
    defaultModel: string;
    maxTokens: number;
    systemPrompt: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    toolCalls?: unknown[];
  };
}

export interface Conversation {
  _id: ObjectId;
  tenantId: ObjectId;
  channelType: 'slack' | 'whatsapp' | 'web';
  channelId: string;
  userId: string;
  messages: ConversationMessage[];
  status: 'active' | 'resolved' | 'escalated';
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeDoc {
  _id: ObjectId;
  tenantId: ObjectId;
  title: string;
  content: string;
  category: string;
  tags: string[];
  accessRoles: string[];
  source: 'manual' | 'notion' | 'confluence' | 'gdrive';
  sourceUrl?: string;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  _id: ObjectId;
  tenantId: ObjectId;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

export interface User {
  _id: ObjectId;
  tenantId: ObjectId;
  externalId: string;
  channelType: 'slack' | 'whatsapp' | 'web';
  name?: string;
  email?: string;
  roles: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolConfig {
  _id: ObjectId;
  tenantId: ObjectId;
  name: string;
  description: string;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
