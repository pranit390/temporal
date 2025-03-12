import { DatabaseService } from '../services/dbService';
import { Order, OrderStatus } from '../models/order';
import { Customer } from '../models/customer';

// Initialize services
const dbService = new DatabaseService();

/**
 * Activity to save an order to the database
 */
export async function saveOrder(order: Order): Promise<boolean> {
  console.log(`Database activity: Saving order ${order.orderId} to database`);
  
  try {
    const result = await dbService.saveOrder(order);
    return result;
  } catch (error) {
    console.error(`Failed to save order ${order.orderId}:`, error);
    throw error;
  }
}

/**
 * Activity to retrieve an order from the database
 */
export async function getOrder(orderId: string): Promise<Order | null> {
  console.log(`Database activity: Retrieving order ${orderId} from database`);
  
  try {
    const order = await dbService.getOrder(orderId);
    return order;
  } catch (error) {
    console.error(`Failed to retrieve order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Activity to update an order status
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  console.log(`Database activity: Updating status for order ${orderId} to ${status}`);
  
  try {
    const result = await dbService.updateOrder(orderId, { status });
    return result;
  } catch (error) {
    console.error(`Failed to update status for order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Activity to get customer information
 */
export async function getCustomer(customerId: string): Promise<Customer | null> {
  console.log(`Database activity: Retrieving customer ${customerId}`);
  
  try {
    const customer = await dbService.getCustomer(customerId);
    return customer;
  } catch (error) {
    console.error(`Failed to retrieve customer ${customerId}:`, error);
    throw error;
  }
}