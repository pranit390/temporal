import { proxyActivities, sleep, CancellationScope } from '@temporalio/workflow';
import type * as inventoryActivities from '../activities/inventoryActivities';
import type * as notificationActivities from '../activities/notificationActivities';
import { OrderStatus } from '../models/order';

// Define activity options
const {checkInventory, reserveInventory, releaseInventory} = proxyActivities<typeof inventoryActivities>({
    startToCloseTimeout: '2m',
    retry: {
      maximumAttempts: 5,
      initialInterval: '5s',
      maximumInterval: '30s',
    },
});

const {sendOrderConfirmationEmail, sendShippingConfirmationEmail} = proxyActivities<typeof notificationActivities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1 second',
    maximumInterval: '10 seconds',
    backoffCoefficient: 2,
  },
  heartbeatTimeout: '10 seconds',
});

/**
 * Workflow that periodically checks inventory levels and sends alerts for low stock
 */
export async function inventoryCheckWorkflow(
  productIds: string[],
  lowStockThreshold: number = 10,
  adminEmail: string = 'admin@example.com'
): Promise<void> {
  // This workflow runs continuously until cancelled
    console.log(`Running scheduled inventory check for ${productIds.length} products`);
    
    try {
      // Use CancellationScope to handle potential cancellation during activity execution
      await CancellationScope.nonCancellable(async () => {
        // Check inventory for all products
        const inventoryStatus = await checkInventory({
          orderId: `inventory-check-${Date.now()}`,
          customerId: 'system',
          items: productIds.map(id => ({ productId: id, name: id, quantity: 1, unitPrice: 0 })),
          totalAmount: 0,
          status: OrderStatus.CREATED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          shippingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
          billingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
          paymentInfo: { paymentMethod: 'CREDIT_CARD', status: 'PENDING' }
        });
        
        // Identify low stock items
        const lowStockItems = inventoryStatus.unavailableItems;
        
        if (lowStockItems.length > 0) {
          // In a real implementation, we would get actual stock levels
          // Here we're just using the unavailable items list as a proxy for low stock
          
          // Send notification about low stock
          await sendOrderConfirmationEmail(
            {
              orderId: `inventory-alert-${Date.now()}`,
              customerId: 'system',
              items: lowStockItems.map(id => ({ productId: id, name: id, quantity: 1, unitPrice: 0 })),
              totalAmount: 0,
              status: OrderStatus.CREATED,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              shippingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
              billingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
              paymentInfo: { paymentMethod: 'CREDIT_CARD', status: 'PENDING' }
            },
            adminEmail
          );
        }
      });
    } catch (error) {
      console.error('Error in inventory check workflow:', error);
    }
    
    // Wait for the next check interval (e.g., every hour)
    // In a real implementation, this would be much longer
    // await sleep(60000); // 1 minute for demonstration purposes
}