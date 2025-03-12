import { simulateDelay, simulateFailure } from '../utils/simulators';

export interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  attachments?: {
    filename: string;
    content: string; // Base64 encoded content
  }[];
}

export class EmailService {
  /**
   * Simulates sending an email
   */
  async sendEmail(request: EmailRequest): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`Sending email to ${request.to} with subject "${request.subject}"`);
    
    // Simulate email service delay
    await simulateDelay(500, 3000);
    
    // Simulate occasional email sending failures
    try {
      simulateFailure(0.2, 'Email service temporarily unavailable');
      simulateFailure(0.1, 'Invalid email address');
      simulateFailure(0.05, 'Email quota exceeded');
      
      // Generate a message ID
      const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      
      return {
        success: true,
        messageId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }
  
  /**
   * Simulates sending an order confirmation email
   */
  async sendOrderConfirmation(
    email: string,
    orderId: string,
    orderDetails: string,
    receiptPdf?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = `Order Confirmation #${orderId}`;
    const body = `
      Thank you for your order!
      
      Order ID: ${orderId}
      
      ${orderDetails}
      
      Your order is being processed and you will receive shipping information soon.
      
      Thank you for shopping with us!
    `;
    
    const attachments = receiptPdf ? [{
      filename: `receipt-${orderId}.pdf`,
      content: receiptPdf
    }] : undefined;
    
    return this.sendEmail({
      to: email,
      subject,
      body,
      attachments
    });
  }
  
  /**
   * Simulates sending a shipping confirmation email
   */
  async sendShippingConfirmation(
    email: string,
    orderId: string,
    trackingNumber: string,
    carrier: string,
    estimatedDelivery: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = `Your Order #${orderId} Has Shipped`;
    const body = `
      Good news! Your order is on its way.
      
      Order ID: ${orderId}
      Tracking Number: ${trackingNumber}
      Carrier: ${carrier}
      Estimated Delivery: ${new Date(estimatedDelivery).toLocaleDateString()}
      
      Track your package: https://example.com/track/${trackingNumber}
      
      Thank you for shopping with us!
    `;
    
    return this.sendEmail({
      to: email,
      subject,
      body
    });
  }
}