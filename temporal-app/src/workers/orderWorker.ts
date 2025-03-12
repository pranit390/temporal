import { NativeConnection, Worker } from '@temporalio/worker';
import * as paymentActivities from '../activities/paymentActivities';
import * as inventoryActivities from '../activities/inventoryActivities';
import * as shippingActivities from '../activities/shippingActivities';
import * as notificationActivities from '../activities/notificationActivities';
import * as fileActivities from '../activities/fileActivities';
import * as databaseActivities from '../activities/databaseActivities';
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
    taskQueue: 'ecommerce-task-queue',
    workflowsPath: require.resolve('../workflows/orderProcessingWorkflow'),
    activities: {
      ...paymentActivities,
      ...inventoryActivities,
      ...shippingActivities,
      ...notificationActivities,
      ...fileActivities,
      ...databaseActivities,
    },
    dataConverter: getDataConverter(),
  });

  // Start the Worker
  await worker.run();
}

run().catch((err) => {
  console.error('Worker error:', err);
  process.exit(1);
});