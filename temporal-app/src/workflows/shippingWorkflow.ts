import { proxyActivities, sleep, defineQuery,setHandler } from '@temporalio/workflow';
import type * as shippingActivities from '../activities/shippingActivities';
import type * as dbActivities from '../activities/databaseActivities';
import type * as notificationActivities from '../activities/notificationActivities';
import { Order, OrderStatus } from '../models/order';

// Define activity options
const shippingActs = proxyActivities<typeof shippingActivities>({
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

// Define queries
const getShipmentStatusQuery = defineQuery<{
  status: string;
  trackingNumber?: string;
  location?: string;
}>('getShipmentStatus');

/**
 * Dedicated shipping workflow that handles the entire shipping process
 */
export async function shippingWorkflow(
  order: Order,
  customerEmail: string
): Promise<{
  success: boolean;
  trackingNumber?: string;
  carrier?: string;
  finalStatus: OrderStatus;
}> {
  let shipmentStatus = {
    status: 'PENDING',
    trackingNumber: undefined as string | undefined,
    location: undefined as string | undefined,
  };

  // Set up query handler
  setHandler(getShipmentStatusQuery, () => shipmentStatus);

  try {
    // Create shipment
    console.log(`Creating shipment for order ${order.orderId}`);
    const shippingResult = await shippingActs.createShipment(order);

    if (!shippingResult.success) {
      await dbActs.updateOrderStatus(order.orderId, OrderStatus.SHIPPING_FAILED);
      return {
        success: false,
        finalStatus: OrderStatus.SHIPPING_FAILED,
      };
    }

    // Update shipment status
    shipmentStatus.status = 'CREATED';
    shipmentStatus.trackingNumber = shippingResult.trackingNumber;

    // Send shipping confirmation email
    await notificationActs.sendShippingConfirmationEmail(
      order,
      customerEmail,
      shippingResult.trackingNumber!,
      shippingResult.carrier!,
      shippingResult.estimatedDeliveryDate!
    );

    // Track shipment until delivered or max attempts reached
    const maxTrackingAttempts = 10;
    for (let i = 0; i < maxTrackingAttempts; i++) {
      // Wait between tracking attempts (5 minutes in production, shorter for demo)
      await sleep(5000); // 5 seconds for demo

      const trackingResult = await shippingActs.trackShipment(shippingResult.trackingNumber!);
      
      shipmentStatus.status = trackingResult.status;
      shipmentStatus.location = trackingResult.location;

      // Update order status based on tracking status
      let orderStatus: OrderStatus;
      switch (trackingResult.status) {
        case 'DELIVERED':
          orderStatus = OrderStatus.DELIVERED;
          break;
        case 'EXCEPTION':
          orderStatus = OrderStatus.SHIPPING_FAILED;
          break;
        default:
          orderStatus = OrderStatus.SHIPPED;
      }

      await dbActs.updateOrderStatus(order.orderId, orderStatus);

      if (trackingResult.status === 'DELIVERED' || trackingResult.status === 'EXCEPTION') {
        return {
          success: trackingResult.status === 'DELIVERED',
          trackingNumber: shippingResult.trackingNumber,
          carrier: shippingResult.carrier,
          finalStatus: orderStatus,
        };
      }
    }

    // If we reach here, we've hit max tracking attempts
    return {
      success: true,
      trackingNumber: shippingResult.trackingNumber,
      carrier: shippingResult.carrier,
      finalStatus: OrderStatus.SHIPPED,
    };

  } catch (error) {
    console.error(`Shipping workflow error for order ${order.orderId}:`, error);
    await dbActs.updateOrderStatus(order.orderId, OrderStatus.SHIPPING_FAILED);
    
    return {
      success: false,
      finalStatus: OrderStatus.SHIPPING_FAILED,
    };
  }
}