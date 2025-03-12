import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from '../activities/paymentActivities';
import type * as dbActivities from '../activities/databaseActivities';
import type * as notificationActivities from '../activities/notificationActivities';
import { OrderStatus } from '../models/order';

// Define activity options
const paymentActivities = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 5,
    initialInterval: '5s',
    maximumInterval: '30s',
  },
});

const dbActs = proxyActivities<typeof dbActivities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1 second',
    maximumInterval: '10 seconds',
    backoffCoefficient: 2,
  },
});

const notificationActs = proxyActivities<typeof notificationActivities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1 second',
    maximumInterval: '10 seconds',
    backoffCoefficient: 2,
  },
});

/**
 * Workflow that handles payment retries for failed payments
 */
export async function paymentRetryWorkflow(
  orderId: string,
  maxRetries: number = 3,
  initialRetryDelayMs: number = 60000 // 1 minute
): Promise<{
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
}> {
  let retryCount = 0;
  let retryDelayMs = initialRetryDelayMs;
  
  console.log(`Starting payment retry workflow for order ${orderId}`);
  
  while (retryCount < maxRetries) {
    // Get the current order
    const order = await dbActs.getOrder(orderId);
    
    if (!order) {
      return {
        success: false,
        errorMessage: `Order ${orderId} not found`
      };
    }
    
    // Skip if payment is already completed
    if (order.status === OrderStatus.PAYMENT_COMPLETED) {
      return {
        success: true,
        transactionId: order.paymentInfo.transactionId
      };
    }
    
    // Skip if order is cancelled
    if (order.status === OrderStatus.CANCELLED) {
      return {
        success: false,
        errorMessage: 'Order is cancelled'
      };
    }
    
    // Wait before retrying
    if (retryCount > 0) {
      console.log(`Waiting ${retryDelayMs}ms before retry ${retryCount + 1} for order ${orderId}`);
      await sleep(retryDelayMs);
      
      // Increase delay for next retry (exponential backoff)
      retryDelayMs *= 2;
    }
    
    // Attempt payment
    console.log(`Attempting payment retry ${retryCount + 1} for order ${orderId}`);
    const paymentResult = await paymentActivities.processPayment(order);
    
    if (paymentResult.success) {
      console.log(`Payment retry successful for order ${orderId}`);
      
      // Get customer and send notification
      const customer = await dbActs.getCustomer(order.customerId);
      if (customer) {
        await notificationActs.sendOrderConfirmationEmail(order, customer.email);
      }
      
      return {
        success: true,
        transactionId: paymentResult.transactionId
      };
    }
    
    console.log(`Payment retry ${retryCount + 1} failed for order ${orderId}: ${paymentResult.errorMessage}`);
    retryCount++;
  }
  
  console.log(`All payment retries failed for order ${orderId}`);
  
  // Update order status to permanently failed
  await dbActs.updateOrderStatus(orderId, OrderStatus.PAYMENT_FAILED);
  
  return {
    success: false,
    errorMessage: `Payment failed after ${maxRetries} retries`
  };
}