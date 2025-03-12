import { InventoryService } from '../services/inventoryService';
import { DatabaseService } from '../services/dbService';
import { Order, OrderItem, OrderStatus } from '../models/order';

// Initialize services
const inventoryService = new InventoryService();
const dbService = new DatabaseService();

/**
 * Activity to check if all items in an order are in stock
 */
export async function checkInventory(order: Order): Promise<{
  allInStock: boolean;
  unavailableItems: string[];
}> {
 try{ console.log(`Inventory activity: Checking inventory for order ${order.orderId}`);
  
  // Extract product IDs from order items
  const productIds = order.items.map(item => item.productId);
  
  // Check inventory status
  const inventoryStatus = await inventoryService.checkInventory(productIds);
  
  // Determine which items are unavailable
  const unavailableItems: string[] = [];
  let allInStock = true;
  
  for (const [productId, inStock] of inventoryStatus.entries()) {
    if (!inStock) {
      allInStock = false;
      unavailableItems.push(productId);
    }
  }
  
  // Update order status in database
  if (allInStock) {
    await dbService.updateOrder(order.orderId, {
      status: OrderStatus.INVENTORY_CHECKED
    });
  } else {
    await dbService.updateOrder(order.orderId, {
      status: OrderStatus.INVENTORY_FAILED
    });
  }
  
  return {
    allInStock,
    unavailableItems
  };
}
catch(error){
  console.error(`Inventory activity: Error checking inventory for order ${order.orderId}:`, error);
  throw new Error(`Inventory activity: Error checking inventory for order ${order.orderId}: ${error}`);
}
}

/**
 * Activity to reserve inventory for an order
 */
export async function reserveInventory(order: Order): Promise<boolean> {
  console.log(`Inventory activity: Reserving inventory for order ${order.orderId}`);
  
  // Convert order items to inventory items
  const inventoryItems = order.items.map(item => ({
    productId: item.productId,
    quantity: item.quantity
  }));
  
  // Reserve inventory
  try {
    const reserved = await inventoryService.reserveInventory(inventoryItems);
    return reserved;
  } catch (error) {
    console.error(`Failed to reserve inventory for order ${order.orderId}:`, error);
    return false;
  }
}

/**
 * Activity to release reserved inventory
 */
export async function releaseInventory(order: Order): Promise<boolean> {
  console.log(`Inventory activity: Releasing inventory for order ${order.orderId}`);
  
  // Convert order items to inventory items
  const inventoryItems = order.items.map(item => ({
    productId: item.productId,
    quantity: item.quantity
  }));
  
  // Release inventory
  try {
    const released = await inventoryService.releaseInventory(inventoryItems);
    return released;
  } catch (error) {
    console.error(`Failed to release inventory for order ${order.orderId}:`, error);
    return false;
  }
}