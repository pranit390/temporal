import { simulateDelay, simulateFailure } from '../utils/simulators';
import { Product, InventoryUpdate } from '../models/product';
import { Context } from '@temporalio/activity';

export class InventoryService {
  // In-memory product database for simulation
  private products: Map<string, Product> = new Map();
  
  constructor() {
    // Initialize with some sample products
    this.initializeSampleProducts();
  }
  
  private initializeSampleProducts() {
    const sampleProducts: Product[] = [
      {
        productId: 'prod-001',
        name: 'Smartphone X',
        description: 'Latest smartphone with advanced features',
        price: 999.99,
        category: 'Electronics',
        stockQuantity: 50,
        imageUrl: 'https://example.com/smartphone-x.jpg',
        weight: 0.2,
        dimensions: { length: 15, width: 7, height: 1 },
        isAvailable: true
      },
      {
        productId: 'prod-002',
        name: 'Laptop Pro',
        description: 'High-performance laptop for professionals',
        price: 1499.99,
        category: 'Electronics',
        stockQuantity: 25,
        imageUrl: 'https://example.com/laptop-pro.jpg',
        weight: 2.5,
        dimensions: { length: 35, width: 25, height: 2 },
        isAvailable: true
      },
      {
        productId: 'prod-003',
        name: 'Wireless Headphones',
        description: 'Noise-cancelling wireless headphones',
        price: 199.99,
        category: 'Audio',
        stockQuantity: 100,
        imageUrl: 'https://example.com/wireless-headphones.jpg',
        weight: 0.3,
        dimensions: { length: 18, width: 15, height: 8 },
        isAvailable: true
      },
      {
        productId: 'prod-004',
        name: 'Smart Watch',
        description: 'Fitness and health tracking smart watch',
        price: 299.99,
        category: 'Wearables',
        stockQuantity: 75,
        imageUrl: 'https://example.com/smart-watch.jpg',
        weight: 0.1,
        dimensions: { length: 5, width: 5, height: 1.5 },
        isAvailable: true
      },
      {
        productId: 'prod-005',
        name: 'Tablet Mini',
        description: 'Compact tablet for entertainment and productivity',
        price: 399.99,
        category: 'Electronics',
        stockQuantity: 0, // Out of stock
        imageUrl: 'https://example.com/tablet-mini.jpg',
        weight: 0.5,
        dimensions: { length: 20, width: 15, height: 1 },
        isAvailable: false
      }
    ];
    
    sampleProducts.forEach(product => {
      this.products.set(product.productId, product);
    });
  }

  /**
   * Simulate a failure with a given probability, but only for the first N attempts
   */
  private simulateFailureWithRetryCheck(failureProbability: number, errorMessage: string, maxFailureAttempts: number = 5): void {
    const context = Context.current();
    const currentAttempt = context.info.attempt;

    // Skip failure simulation if we've retried too many times
    if (currentAttempt > maxFailureAttempts) {
      console.log(`Attempt ${currentAttempt}: Skipping failure simulation after ${maxFailureAttempts} attempts`);
      return;
    }

    // Otherwise proceed with normal failure simulation
    if (Math.random() < failureProbability) {
      console.log(`Attempt ${currentAttempt}: Simulating failure: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  
  /**
   * Check if products are in stock
   */
  async checkInventory(productIds: string[]): Promise<Map<string, boolean>> {
    console.log(`Checking inventory for products: ${productIds.join(', ')}`);
    
    // Simulate API delay
    await simulateDelay(500, 3000);
    
    // Simulate occasional inventory service failures
    try {
   // this.simulateFailureWithRetryCheck(0.2, 'Inventory service temporarily unavailable', 2);
      
      const inventoryStatus = new Map<string, boolean>();
      
      for (const productId of productIds) {
        const product = this.products.get(productId);
        if (product) {
          inventoryStatus.set(productId, product.stockQuantity > 0);
        } else {
          inventoryStatus.set(productId, false);
        }
      }
      
      return inventoryStatus;
    } catch (error) {
      console.error(`Inventory service: Error checking inventory for products ${productIds.join(', ')}:`, error);
      throw new Error(`Inventory service: Error checking inventory for products ${productIds.join(', ')}: ${error}`);
    }
  }
  
  /**
   * Reserve inventory for an order
   */
  async reserveInventory(items: { productId: string; quantity: number }[]): Promise<boolean> {
    console.log(`Reserving inventory for ${items.length} items`);
    
    // Simulate API delay
    await simulateDelay(1000, 4000);
    
    // Simulate occasional inventory reservation failures
    try {
      simulateFailure(0.15, 'Inventory reservation failed: System overloaded');
      
      // Check if all items are available in requested quantities
      for (const item of items) {
        const product = this.products.get(item.productId);
        
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}: Requested ${item.quantity}, Available ${product.stockQuantity}`);
        }
      }
      
      // Update inventory
      for (const item of items) {
        const product = this.products.get(item.productId)!;
        product.stockQuantity -= item.quantity;
        
        // Update availability status if needed
        if (product.stockQuantity === 0) {
          product.isAvailable = false;
        }
        
        this.products.set(item.productId, product);
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Release reserved inventory (e.g., if payment fails)
   */
  async releaseInventory(items: { productId: string; quantity: number }[]): Promise<boolean> {
    console.log(`Releasing inventory for ${items.length} items`);
    
    // Simulate API delay
    await simulateDelay(500, 2000);
    
    // Simulate occasional release failures
    try {
      simulateFailure(0.1, 'Inventory release failed: Database error');
      
      // Return items to inventory
      for (const item of items) {
        const product = this.products.get(item.productId);
        
        if (product) {
          product.stockQuantity += item.quantity;
          
          // Update availability status if needed
          if (!product.isAvailable && product.stockQuantity > 0) {
            product.isAvailable = true;
          }
          
          this.products.set(item.productId, product);
        }
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  }
}