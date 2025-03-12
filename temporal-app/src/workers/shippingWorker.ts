import { NativeConnection, Worker } from '@temporalio/worker';
import * as shippingActivities from '../activities/shippingActivities';
import * as dbActivities from '../activities/databaseActivities';
import * as notificationActivities from '../activities/notificationActivities';
import { getDataConverter } from '../utils/dataConverter';

async function run() {
  // Connect to Temporal server
  const connection = await NativeConnection.connect({
    address: 'localhost:7233',
  });

  // Create a Worker
  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: 'shipping-task-queue',
    workflowsPath: require.resolve('../workflows/shippingWorkflow'), // We'll create this next
    activities: {
      ...shippingActivities,
      ...dbActivities,
      ...notificationActivities,
    },
    dataConverter: getDataConverter(),
  });

  console.log('Shipping worker started, handling shipping-related tasks...');

  // Start the Worker
  await worker.run();
}

run().catch((err) => {
  console.error('Shipping worker error:', err);
  process.exit(1);
});