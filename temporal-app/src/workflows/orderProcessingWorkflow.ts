import { proxyActivities, sleep, defineSignal, setHandler, defineQuery, workflowInfo } from '@temporalio/workflow';
import type * as activities from '../activities/paymentActivities';
import type * as inventoryActivities from '../activities/inventoryActivities';
import type * as shippingActivities from '../activities/shippingActivities';
import type * as notificationActivities from '../activities/notificationActivities';
import type * as fileActivities from '../activities/fileActivities';
import type * as dbActivities from '../activities/databaseActivities';
import { Order, OrderStatus } from '../models/order';
import { Customer } from '../models/customer';

// Define activity options with appropriate timeouts and retry policies
const paymentActivities = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1 second',
    maximumInterval: '10 seconds',
    backoffCoefficient: 2,
  },
});

const inventoryActs = proxyActivities<typeof inventoryActivities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 5,
    initialInterval: '500 milliseconds',
    maximumInterval: '5 seconds',
    backoffCoefficient: 1.5,
  },
});

const shippingActs = proxyActivities<typeof shippingActivities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
    initialInterval: '2 seconds',
    maximumInterval: '20 seconds',
    backoffCoefficient: 2,
  },
});

const notificationActs = proxyActivities<typeof notificationActivities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    maximumAttempts: 5,
    initialInterval: '1 second',
    maximumInterval: '10 seconds',
    backoffCoefficient: 1.5,
  },
});

const fileActs = proxyActivities<typeof fileActivities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
    initialInterval: '2 seconds',
    maximumInterval: '20 seconds',
    backoffCoefficient: 2,
  },
});

const dbActs = proxyActivities<typeof dbActivities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    maximumAttempts: 5,
    initialInterval: '500 milliseconds',
    maximumInterval: '5 seconds',
    backoffCoefficient: 1.5,
  },
});

// Define signals
const cancelOrderSignal = defineSignal('cancelOrder');

// Define queries
const getOrderStatusQuery = defineQuery<OrderStatus>('getOrderStatus');
const getOrderDetailsQuery = defineQuery<Order | null>('getOrderDetails');

/**
 * Main order processing workflow
 */
export async function orderProcessingWorkflow(
  order: Order,
  customerId: string
): Promise<{
  success: boolean;
  orderId: string;
  finalStatus: OrderStatus;
  trackingNumber?: string;
  receiptUrl?: string;
}> {
  // Initialize workflow state
  let currentOrder = order;
  let isCancelled = false;
  let customer: Customer | null = null;
  let receiptUrl: string | undefined;
  
  // Set up signal handler for order cancellation
  setHandler(cancelOrderSignal, () => {
    console.log(`Received cancellation signal for order ${order.orderId}`);
    isCancelled = true;
  });
  
  // Set up query handlers
  setHandler(getOrderStatusQuery, () => currentOrder.status);
  setHandler(getOrderDetailsQuery, () => currentOrder);
  
  // Log workflow start
  console.log(`Starting order processing workflow for order ${order.orderId}`);
  
  try {
    // Save initial order to database
    await dbActs.saveOrder(currentOrder);
    
    // Get customer information
    customer = await dbActs.getCustomer(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }
    
    // Check if order was cancelled
    if (isCancelled) {
      currentOrder.status = OrderStatus.CANCELLED;
      await dbActs.updateOrderStatus(currentOrder.orderId, OrderStatus.CANCELLED);
      return {
        success: false,
        orderId: currentOrder.orderId,
        finalStatus: OrderStatus.CANCELLED
      };
    }
    
    // Check inventory
    console.log(`Checking inventory for order ${currentOrder.orderId}`);
    const inventoryResult = await inventoryActs.checkInventory(currentOrder);
    
    if (!inventoryResult.allInStock) {
      console.log(`Inventory check failed for order ${currentOrder.orderId}. Items not in stock: ${inventoryResult.unavailableItems.join(', ')}`);
      currentOrder.status = OrderStatus.INVENTORY_FAILED;
      await dbActs.updateOrderStatus(currentOrder.orderId, OrderStatus.INVENTORY_FAILED);
      
      // Send notification about unavailable items
      await notificationActs.sendOrderConfirmationEmail(
        currentOrder,
        customer.email
      );
      
      return {
        success: false,
        orderId: currentOrder.orderId,
        finalStatus: OrderStatus.INVENTORY_FAILED
      };
    }
    
    // Reserve inventory
    console.log(`Reserving inventory for order ${currentOrder.orderId}`);
    const inventoryReserved = await inventoryActs.reserveInventory(currentOrder);
    
    if (!inventoryReserved) {
      console.log(`Failed to reserve inventory for order ${currentOrder.orderId}`);
      currentOrder.status = OrderStatus.INVENTORY_FAILED;
      await dbActs.updateOrderStatus(currentOrder.orderId, OrderStatus.INVENTORY_FAILED);
      
      return {
        success: false,
        orderId: currentOrder.orderId,
        finalStatus: OrderStatus.INVENTORY_FAILED
      };
    }
    
    // Check if order was cancelled
    if (isCancelled) {
      // Release reserved inventory
      await inventoryActs.releaseInventory(currentOrder);
      
      currentOrder.status = OrderStatus.CANCELLED;
      await dbActs.updateOrderStatus(currentOrder.orderId, OrderStatus.CANCELLED);
      
      return {
        success: false,
        orderId: currentOrder.orderId,
        finalStatus: OrderStatus.CANCELLED
      };
    }
    
    // Process payment
    console.log(`Processing payment for order ${currentOrder.orderId}`);
    currentOrder.status = OrderStatus.PAYMENT_PENDING;
    await dbActs.updateOrderStatus(currentOrder.orderId, OrderStatus.PAYMENT_PENDING);
    
    const paymentResult = await paymentActivities.processPayment(currentOrder);
    
    if (!paymentResult.success) {
      console.log(`Payment failed for order ${currentOrder.orderId}: ${paymentResult.errorMessage}`);
      
      // Release reserved inventory
      await inventoryActs.releaseInventory(currentOrder);
      
      currentOrder.status = OrderStatus.PAYMENT_FAILED;
      await dbActs.updateOrderStatus(currentOrder.orderId, OrderStatus.PAYMENT_FAILED);
      
      return {
        success: false,
        orderId: currentOrder.orderId,
        finalStatus: OrderStatus.PAYMENT_FAILED
      };
    }
    
    // Update order with payment information
    currentOrder = await dbActs.getOrder(currentOrder.orderId) || currentOrder;
    
    // Check if order was cancelled
    if (isCancelled) {
      // Refund payment
      await paymentActivities.refundPayment(
        currentOrder.orderId,
        paymentResult.transactionId!,
        currentOrder.totalAmount
      );
      
      // Release reserved inventory
      await inventoryActs.releaseInventory(currentOrder);
      
      currentOrder.status = OrderStatus.CANCELLED;
      await dbActs.updateOrderStatus(currentOrder.orderId, OrderStatus.CANCELLED);
      
      return {
        success: false,
        orderId: currentOrder.orderId,
        finalStatus: OrderStatus.CANCELLED
      };
    }
    
    // Generate and store receipt
    console.log(`Generating receipt for order ${currentOrder.orderId}`);
    const receiptResult = await fileActs.generateAndStoreReceipt(currentOrder);
    
    if (receiptResult.success && receiptResult.fileUrl) {
      receiptUrl = receiptResult.fileUrl;
    }
    
    // Send order confirmation email
    console.log(`Sending order confirmation email for order ${currentOrder.orderId}`);
    await notificationActs.sendOrderConfirmationEmail(
      currentOrder,
      customer.email
    );
    
    // Create shipment
    console.log(`Creating shipment for order ${currentOrder.orderId}`);
    currentOrder.status = OrderStatus.SHIPPING_PENDING;
    await dbActs.updateOrderStatus(currentOrder.orderId, OrderStatus.SHIPPING_PENDING);
    
    const shippingResult = await shippingActs.createShipment(currentOrder);
    
    if (!shippingResult.success) {
      console.log(`Shipping failed for order ${currentOrder.orderId}: ${shippingResult.errorMessage}`);
      
      // We don't refund or release inventory here, as payment was successful
      // In a real system, this might trigger a manual review process
      
      currentOrder.status = OrderStatus.SHIPPING_FAILED;
      await dbActs.updateOrderStatus(currentOrder.orderId, OrderStatus.SHIPPING_FAILED);
      
      return {
        success: false,
        orderId: currentOrder.orderId,
        finalStatus: OrderStatus.SHIPPING_FAILED,
        receiptUrl
      };
    }
    
    // Update order with shipping information
    currentOrder = await dbActs.getOrder(currentOrder.orderId) || currentOrder;
    
    // Send shipping confirmation email
    console.log(`Sending shipping confirmation email for order ${currentOrder.orderId}`);
    await notificationActs.sendShippingConfirmationEmail(
      currentOrder,
      customer.email,
      shippingResult.trackingNumber!,
      shippingResult.carrier!,
      shippingResult.estimatedDeliveryDate!
    );
    
    // Periodically track shipment (simulate with a few checks)
    for (let i = 0; i < 3; i++) {
      // Wait some time between tracking checks
      await sleep(5000);
      
      // Check if order was cancelled (unlikely at this stage, but still possible)
      if (isCancelled) {
        break;
      }
      
      console.log(`Tracking shipment ${shippingResult.trackingNumber} (attempt ${i + 1})`);
      const trackingResult = await shippingActs.trackShipment(shippingResult.trackingNumber!);
      
      console.log(`Shipment status: ${trackingResult.status}, Location: ${trackingResult.location}`);
      
      // If delivered, update order status
      if (trackingResult.status === 'DELIVERED') {
        currentOrder.status = OrderStatus.DELIVERED;
        await dbActs.updateOrderStatus(currentOrder.orderId, OrderStatus.DELIVERED);
        break;
      }
    }
    
    // Return successful result
    return {
      success: true,
      orderId: currentOrder.orderId,
      finalStatus: currentOrder.status,
      trackingNumber: shippingResult.trackingNumber,
      receiptUrl
    };
    
  } catch (error) {
    // Handle unexpected errors
    console.error(`Workflow error for order ${order.orderId}:`, error);
    
    // Update order status
    try {
      await dbActs.updateOrderStatus(order.orderId, OrderStatus.CANCELLED);
    } catch (dbError) {
      console.error(`Failed to update order status after error:`, dbError);
    }
    
    // Attempt to release inventory if it was reserved
    try {
      await inventoryActs.releaseInventory(order);
    } catch (invError) {
      console.error(`Failed to release inventory after error:`, invError);
    }
    
    return {
      success: false,
      orderId: order.orderId,
      finalStatus: OrderStatus.CANCELLED
    };
  }
}