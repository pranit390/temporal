import { ShippingService, ShippingRequest } from '../services/shippingService';
import { DatabaseService } from '../services/dbService';
import { Order, OrderStatus } from '../models/order';

// Initialize services
const shippingService = new ShippingService();
const dbService = new DatabaseService();

/**
 * Activity to create a shipment for an order
 */
export async function createShipment(order: Order): Promise<{
  success: boolean;
  trackingNumber?: string;
  carrier?: string;
  estimatedDeliveryDate?: string;
  errorMessage?: string;
}> {
  console.log(`Shipping activity: Creating shipment for order ${order.orderId}`);
  
  // Get product weights (in a real app, this would come from the database)
  // Here we'll simulate with random weights
  const itemsWithWeight = order.items.map(item => ({
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    weight: Math.random() * 2 + 0.1 // Random weight between 0.1 and 2.1 kg
  }));
  
  // Create shipping request
  const shippingRequest: ShippingRequest = {
    orderId: order.orderId,
    items: itemsWithWeight,
    shippingAddress: order.shippingAddress,
    shippingMethod: 'STANDARD' // Could be determined based on order details
  };
  
  // Create shipment
  const shippingResult = await shippingService.createShipment(shippingRequest);
  
  if (shippingResult.success) {
    // Update order with shipping information
    await dbService.updateOrder(order.orderId, {
      status: OrderStatus.SHIPPED,
      trackingNumber: shippingResult.trackingNumber
    });
    
    return {
      success: true,
      trackingNumber: shippingResult.trackingNumber,
      carrier: shippingResult.carrier,
      estimatedDeliveryDate: shippingResult.estimatedDeliveryDate
    };
  } else {
    // Update order with shipping failure
    await dbService.updateOrder(order.orderId, {
      status: OrderStatus.SHIPPING_FAILED
    });
    
    return {
      success: false,
      errorMessage: shippingResult.errorMessage
    };
  }
}

/**
 * Activity to track a shipment
 */
export async function trackShipment(trackingNumber: string): Promise<{
  status: 'PROCESSING' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION';
  location?: string;
  timestamp: string;
  details?: string;
}> {
  console.log(`Shipping activity: Tracking shipment ${trackingNumber}`);
  
  // Track the shipment
  const trackingResult = await shippingService.trackShipment(trackingNumber);
  
  // If the shipment is delivered, we could update the order status
  if (trackingResult.status === 'DELIVERED') {
    // In a real implementation, we would need to find the order by tracking number
    // Here we'll just log it
    console.log(`Shipment ${trackingNumber} has been delivered`);
  }
  
  return trackingResult;
}