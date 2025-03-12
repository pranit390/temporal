import { Connection, Client } from '@temporalio/client';
import { inventoryCheckWorkflow } from '../workflows/inventoryCheckWorkflow'; // Make sure this import matches
import { getDataConverter } from '../utils/dataConverter';

async function run() {
  const connection = await Connection.connect({
    address: 'localhost:7233',
  });

  const client = new Client({
    connection,
    namespace: 'default',
    dataConverter: getDataConverter(),
  });

  const productIds = ['prod-001', 'prod-002', 'prod-003', 'prod-004', 'prod-005'];
  const lowStockThreshold = 10;
  const adminEmail = 'admin@example.com';

  console.log(`Starting scheduled inventory check workflow for ${productIds.length} products`);

  // Make sure the workflow type matches the exported function name
  const handle = await client.workflow.start(inventoryCheckWorkflow, {
    args: [productIds, lowStockThreshold, adminEmail],
    taskQueue: 'inventory-task-queue', // Make sure this matches your worker's task queue
    workflowId: `inventory-check-${Date.now()}`,
  });

  console.log(`Started workflow with ID: ${handle.workflowId}`);
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});