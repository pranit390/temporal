import { NativeConnection, Worker } from '@temporalio/worker';
import * as inventoryActivities from '../activities/inventoryActivities';
import * as notificationActivities from '../activities/notificationActivities';
import { getDataConverter } from '../utils/dataConverter';

async function run() {
  const connection = await NativeConnection.connect({
    address: 'localhost:7233',
  });

  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: 'inventory-task-queue',
    workflowsPath: require.resolve('../workflows/inventoryCheckWorkflow'), // Point to specific workflow file
    activities: {
      ...inventoryActivities,
      ...notificationActivities,
    },
    dataConverter: getDataConverter(),
  });

  console.log('Inventory worker started, handling inventory check tasks...');

  await worker.run();
}

run().catch((err) => {
  console.error('Inventory worker error:', err);
  process.exit(1);
});