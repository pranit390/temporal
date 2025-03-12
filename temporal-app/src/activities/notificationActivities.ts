import { EmailService } from '../services/emailService';
import { Order } from '../models/order';
import { FileService } from '../services/fileService';
import { DatabaseService } from '../services/dbService';

// Initialize services
const emailService = new EmailService();
const fileService = new FileService();
const dbService = new DatabaseService();

/**
 * Activity to send an order confirmation email
 */
export async function sendOrderConfirmationEmail(
  order: Order,
  customerEmail: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  console.log(`Notification activity: Sending order confirmation email for order ${order.orderId}`);
  
  // Generate order details text
  const orderDetails = `
    Order Details:
    ${order.items.map(item => `- ${item.name} x${item.quantity} - $${(item.unitPrice * item.quantity).toFixed(2)}`).join('\n')}
    
    Total: $${order.totalAmount.toFixed(2)}
  `;
  
  // Generate receipt PDF
  const receiptResult = await fileService.generateReceipt(order);
  const receiptPdf = receiptResult.success ? receiptResult.content : undefined;
  
  // Send confirmation email
  const emailResult = await emailService.sendOrderConfirmation(
    customerEmail,
    order.orderId,
    orderDetails,
    receiptPdf
  );
  
  return emailResult;
}

/**
 * Activity to send a shipping confirmation email
 */
export async function sendShippingConfirmationEmail(
  order: Order,
  customerEmail: string,
  trackingNumber: string,
  carrier: string,
  estimatedDelivery: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  console.log(`Notification activity: Sending shipping confirmation email for order ${order.orderId}`);
  
  // Send shipping confirmation email
  const emailResult = await emailService.sendShippingConfirmation(
    customerEmail,
    order.orderId,
    trackingNumber,
    carrier,
    estimatedDelivery
  );
  
  return emailResult;
}