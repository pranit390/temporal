import { simulateDelay, simulateFailure } from '../utils/simulators';
import { Order } from '../models/order';
import { Customer } from '../models/customer';
import { Product } from '../models/product';
import * as fs from 'fs/promises';
import * as path from 'path';

export class DatabaseService {
  private ordersFile: string;
  private customersFile: string;
  private productsFile: string;
  
  private orders: Map<string, Order>;
  private customers: Map<string, Customer>;
  private products: Map<string, Product>;

  constructor() {
    // Initialize file paths
    this.ordersFile = path.join(__dirname, '../data/orders.json');
    this.customersFile = path.join(__dirname, '../data/customers.json');
    this.productsFile = path.join(__dirname, '../data/products.json');

    // Initialize maps
    this.orders = new Map();
    this.customers = new Map();
    this.products = new Map();

    // Load initial data
    this.loadData().catch(console.error);
  }

  private async loadData(): Promise<void> {
    try {
      // Load products
      const productsData = JSON.parse(await fs.readFile(this.productsFile, 'utf8'));
      this.products = new Map(productsData.products.map((p: Product) => [p.productId, p]));

      // Load customers
      const customersData = JSON.parse(await fs.readFile(this.customersFile, 'utf8'));
      this.customers = new Map(customersData.customers.map((c: Customer) => [c.customerId, c]));

      // Load orders
      const ordersData = JSON.parse(await fs.readFile(this.ordersFile, 'utf8'));
      this.orders = new Map(ordersData.orders.map((o: Order) => [o.orderId, o]));

      console.log('Data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  private async saveOrders(): Promise<void> {
    try {
      const ordersData = {
        orders: Array.from(this.orders.values())
      };
      await fs.writeFile(this.ordersFile, JSON.stringify(ordersData, null, 2));
    } catch (error) {
      console.error('Error saving orders:', error);
      throw error;
    }
  }

  /**
   * Simulates saving an order to the database
   */
  async saveOrder(order: Order): Promise<boolean> {
    console.log(`Saving order ${order.orderId} to database`);
    
    // Simulate database operation delay
    await simulateDelay(200, 1000);
    
    // Simulate occasional database failures
    try {
      simulateFailure(0.15, 'Database connection error');
      simulateFailure(0.1, 'Database write timeout');
      
      // Save to in-memory map
      this.orders.set(order.orderId, {
        ...order,
        updatedAt: new Date().toISOString()
      });
      
      // Save to file
      await this.saveOrders();
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Simulates retrieving an order from the database
   */
  async getOrder(orderId: string): Promise<Order | null> {
    console.log(`Retrieving order ${orderId} from database`);
    
    // Simulate database operation delay
    await simulateDelay(100, 800);
    
    // Simulate occasional database failures
    try {
      simulateFailure(0.1, 'Database read timeout');
      
      // Retrieve from in-memory map
      const order = this.orders.get(orderId);
      return order || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Simulates updating an order in the database
   */
  async updateOrder(orderId: string, updates: Partial<Order>): Promise<boolean> {
    console.log(`Updating order ${orderId} in database`);
    
    // Simulate database operation delay
    await simulateDelay(200, 1200);
    
    // Simulate occasional database failures
    try {
      simulateFailure(0.15, 'Database connection error');
      simulateFailure(0.1, 'Database update timeout');
      
      // Update in-memory map
      const existingOrder = this.orders.get(orderId);
      if (!existingOrder) {
        throw new Error(`Order ${orderId} not found`);
      }
      
      const updatedOrder = {
        ...existingOrder,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      this.orders.set(orderId, updatedOrder);
      
      // Save to file
      await this.saveOrders();
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Simulates retrieving a customer from the database
   */
  async getCustomer(customerId: string): Promise<Customer | null> {
    console.log(`Retrieving customer ${customerId} from database`);
    
    // Simulate database operation delay
    await simulateDelay(100, 800);
    
    // Simulate occasional database failures
    try {
      simulateFailure(0.1, 'Database read timeout');
      
      // Retrieve from in-memory map
      const customer = this.customers.get(customerId);
      return customer || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Simulates retrieving a product from the database
   */
  async getProduct(productId: string): Promise<Product | null> {
    console.log(`Retrieving product ${productId} from database`);
    
    // Simulate database operation delay
    await simulateDelay(100, 600);
    
    // Simulate occasional database failures
    try {
      simulateFailure(0.1, 'Database read timeout');
      
      // Retrieve from in-memory map
      const product = this.products.get(productId);
      return product || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Simulates updating product inventory in the database
   */
  async updateProductInventory(productId: string, quantityChange: number): Promise<boolean> {
    console.log(`Updating inventory for product ${productId} by ${quantityChange}`);
    
    // Simulate database operation delay
    await simulateDelay(200, 1000);
    
    // Simulate occasional database failures
    try {
      simulateFailure(0.15, 'Database connection error');
      
      // Update in-memory map
      const product = this.products.get(productId);
      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }
      
      const updatedProduct = {
        ...product,
        stockQuantity: Math.max(0, product.stockQuantity + quantityChange),
        isAvailable: (product.stockQuantity + quantityChange) > 0
      };
      
      this.products.set(productId, updatedProduct);
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all products (useful for testing)
   */
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  /**
   * Get all customers (useful for testing)
   */
  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  /**
   * Get all orders (useful for testing)
   */
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
}