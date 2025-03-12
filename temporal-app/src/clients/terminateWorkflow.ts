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
    // Get the workflow handle and terminate it
    const handle = client.workflow.getHandle(workflowId);
    await handle.terminate('Manually terminated');
    console.log(`Workflow ${workflowId} terminated successfully`);
  } catch (error) {
    console.error('Error terminating workflow:', error);
  } finally {
    await connection.close();
  }
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});