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

    // Send cancellation signal
    await handle.signal('cancelOrder');
    console.log(`Cancellation signal sent to workflow ${workflowId}`);

    // Query the workflow status to confirm cancellation
    try {
      const status = await handle.query('getOrderStatus');
      console.log(`Order status after cancellation request: ${status}`);
    } catch (error) {
      console.log('Workflow may have already completed or terminated');
    }
  } catch (error) {
    console.error('Error cancelling order:', error);
  } finally {
    await connection.close();
  }
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});