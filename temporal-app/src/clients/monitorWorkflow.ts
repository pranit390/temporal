import { Connection, Client } from '@temporalio/client';
import { getDataConverter } from '../utils/dataConverter';

async function run() {
  // Get workflow ID from command line arguments
  const workflowId = process.argv[2];
  if (!workflowId) {
    console.error('Please provide a workflow ID as a command line argument');
    process.exit(1);
  }

  // Connect to Temporal server
  const connection = await Connection.connect({
    address: 'localhost:7233',
  });

  // Create a client
  const client = new Client({
    connection,
    namespace: 'default',
    dataConverter: getDataConverter(),
  });

  try {
    // Get the workflow handle
    const handle = client.workflow.getHandle(workflowId);

    // Query the workflow status
    const status = await handle.query('getOrderStatus');
    console.log(`Order status: ${status}`);

    // Query the order details
    const orderDetails = await handle.query('getOrderDetails');
    console.log('Order details:', orderDetails);

    // Get workflow execution history
    const description = await handle.describe();
    console.log('Workflow execution info:', {
      workflowId: description.workflowId,
      runId: description.runId,
      status: description.status.name,
      startTime: description.startTime,
      executionTime: description.executionTime,
    });
  } catch (error) {
    console.error('Error monitoring workflow:', error);
  } finally {
    await connection.close();
  }
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});