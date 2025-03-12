import { Connection, Client } from '@temporalio/client';
import { nanoid } from 'nanoid';
import { Order, OrderStatus, Address, PaymentInfo } from '../models/order';
import { getDataConverter } from '../utils/dataConverter';
import { orderProcessingWorkflow } from '../workflows/orderProcessingWorkflow';

// Sample data for testing
const sampleCustomerId = 'cust-001';
const sampleShippingAddress: Address = {
  street: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zipCode: '12345',
  country: 'USA',
};
const sampleBillingAddress: Address = {
  street: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zipCode: '12345',
  country: 'USA',
};
const samplePaymentInfo: PaymentInfo = {
  paymentMethod: 'CREDIT_CARD',
  cardNumber: '1234',
  status: 'PENDING',
};

async function run() {
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

  // Create a sample order
  const orderId = `order-${nanoid()}`;
  const order: Order = {
    orderId,
    customerId: sampleCustomerId,
    items: [
      {
        productId: 'prod-001',
        name: 'Smartphone X',
        quantity: 1,
        unitPrice: 999.99,
      },
      {
        productId: 'prod-003',
        name: 'Wireless Headphones',
        quantity: 2,
        unitPrice: 199.99,
      },
    ],
    totalAmount: 999.99 + (2 * 199.99),
    status: OrderStatus.CREATED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    shippingAddress: sampleShippingAddress,
    billingAddress: sampleBillingAddress,
    paymentInfo: samplePaymentInfo,
  };

  console.log(`Starting order processing workflow for order ${orderId}`);

  // Start the workflow
  const handle = await client.workflow.start(orderProcessingWorkflow, {
    args: [order, sampleCustomerId],
    taskQueue: 'ecommerce-task-queue',
    workflowId: `order-processing-${orderId}`,
  });

  console.log(`Started workflow with ID: ${handle.workflowId}`);

  // Wait for the workflow to complete
  console.log('Waiting for workflow to complete...');
  const result = await handle.result();
  console.log('Workflow completed with result:', result);
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});