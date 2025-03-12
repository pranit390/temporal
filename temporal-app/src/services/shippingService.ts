import { simulateDelay, simulateFailure } from '../utils/simulators';
import { Address } from '../models/order';

export interface ShippingRequest {
  orderId: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    weight: number;
  }[];
  shippingAddress: Address;
  shippingMethod: 'STANDARD' | 'EXPRESS' | 'OVERNIGHT';
}

export interface ShippingResponse {
  success: boolean;
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  shippingCost?: number;
  carrier?: string;
  errorMessage?: string;
}

export class ShippingService {
  /**
   * Simulates creating a shipping label and arranging for pickup
   */
  async createShipment(request: ShippingRequest): Promise<ShippingResponse> {
    console.log(`Creating shipment for order ${request.orderId} to ${request.shippingAddress.city}`);
    
    // Simulate processing delay
    await simulateDelay(2000, 8000);
    
    // Simulate occasional shipping service failures
    try {
      simulateFailure(0.2, 'Shipping service temporarily unavailable');
      simulateFailure(0.1, 'Invalid shipping address');
      simulateFailure(0.05, 'Shipping carrier API timeout');
      
      // Generate tracking number and delivery estimate
      const trackingNumber = `TRACK-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      
      // Calculate estimated delivery date based on shipping method
      const now = new Date();
      let deliveryDays = 0;
      
      switch (request.shippingMethod) {
        case 'STANDARD':
          deliveryDays = 5 + Math.floor(Math.random() * 3); // 5-7 days
          break;
        case 'EXPRESS':
          deliveryDays = 2 + Math.floor(Math.random() * 2); // 2-3 days
          break;
        case 'OVERNIGHT':
          deliveryDays = 1; // Next day
          break;
      }
      
      const estimatedDelivery = new Date(now);
      estimatedDelivery.setDate(now.getDate() + deliveryDays);
      
      // Calculate shipping cost based on weight and method
      const totalWeight = request.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
      let shippingCost = totalWeight * 2; // Base cost
      
      switch (request.shippingMethod) {
        case 'STANDARD':
          // Base cost
          break;
        case 'EXPRESS':
          shippingCost *= 1.5; // 50% more
          break;
        case 'OVERNIGHT':
          shippingCost *= 2.5; // 150% more
          break;
      }
      
      // Determine carrier based on shipping method
      const carriers = ['FedEx', 'UPS', 'DHL', 'USPS'];
      const carrier = carriers[Math.floor(Math.random() * carriers.length)];
      
      return {
        success: true,
        trackingNumber,
        estimatedDeliveryDate: estimatedDelivery.toISOString(),
        shippingCost,
        carrier
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown shipping error'
      };
    }
  }
  
  /**
   * Simulates tracking a shipment
   */
  async trackShipment(trackingNumber: string): Promise<{
    status: 'PROCESSING' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION';
    location?: string;
    timestamp: string;
    details?: string;
  }> {
    console.log(`Tracking shipment ${trackingNumber}`);
    
    // Simulate API delay
    await simulateDelay(500, 2000);
    
    // Simulate occasional tracking failures
    try {
      simulateFailure(0.15, 'Tracking service unavailable');
      
      // Randomly select a shipping status
      const statuses: Array<'PROCESSING' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION'> = [
        'PROCESSING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION'
      ];
      
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const locations = ['New York, NY', 'Chicago, IL', 'Los Angeles, CA', 'Miami, FL', 'Seattle, WA'];
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      
      let details = '';
      switch (randomStatus) {
        case 'PROCESSING':
          details = 'Shipment information received';
          break;
        case 'PICKED_UP':
          details = 'Package picked up by carrier';
          break;
        case 'IN_TRANSIT':
          details = 'Package in transit to destination';
          break;
        case 'OUT_FOR_DELIVERY':
          details = 'Package out for delivery';
          break;
        case 'DELIVERED':
          details = 'Package delivered';
          break;
        case 'EXCEPTION':
          details = 'Delivery exception: weather delay';
          break;
      }
      
      return {
        status: randomStatus,
        location: randomLocation,
        timestamp: new Date().toISOString(),
        details
      };
    } catch (error) {
      throw error;
    }
  }
}