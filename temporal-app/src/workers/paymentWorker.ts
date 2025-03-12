import { NativeConnection, Worker } from '@temporalio/worker';
import * as paymentActivities from '../activities/paymentActivities';
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
    taskQueue: 'payment-task-queue',
    workflowsPath: require.resolve('../workflows/paymentRetryWorkflow'),
    activities: {
      ...paymentActivities,
      ...dbActivities,
      ...notificationActivities,
    },
    dataConverter: getDataConverter(),
  });

  console.log('Payment worker started, handling payment-related tasks...');

  // Start the Worker
  await worker.run();
}

run().catch((err) => {
  console.error('Payment worker error:', err);
  process.exit(1);
});