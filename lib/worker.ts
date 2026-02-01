import { getDb, closeDb } from './mongodb';
import { bulkIndexDocuments } from './knowledge';
import type { Tenant } from '@/db/schema';

async function runWorker() {
  console.log('Worker starting...');

  const db = await getDb();

  // Main worker loop
  while (true) {
    try {
      // Index documents without embeddings
      const tenants = await db.collection<Tenant>('tenants').find().toArray();

      for (const tenant of tenants) {
        const indexed = await bulkIndexDocuments(tenant._id.toString());
        if (indexed > 0) {
          console.log(`Indexed ${indexed} documents for tenant ${tenant.name}`);
        }
      }

      // Add other background tasks here:
      // - Clean up old conversations
      // - Generate usage reports
      // - Sync external knowledge sources

    } catch (error) {
      console.error('Worker error:', error);
    }

    // Wait before next iteration
    await new Promise((resolve) => setTimeout(resolve, 60000)); // 1 minute
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Worker shutting down...');
  await closeDb();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Worker interrupted...');
  await closeDb();
  process.exit(0);
});

// Start the worker
runWorker().catch((error) => {
  console.error('Worker failed to start:', error);
  process.exit(1);
});
