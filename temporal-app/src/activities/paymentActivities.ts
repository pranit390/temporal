import { PaymentService, PaymentRequest } from '../services/paymentService';
import { Order, OrderStatus, PaymentInfo } from '../models/order';
import { DatabaseService } from '../services/dbService';

// Initialize services
const paymentService = new PaymentService();
const dbService = new DatabaseService();

/**
 * Activity to process payment for an order
 */
export async function processPayment(order: Order): Promise<{
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
}> {
  console.log(`Payment activity: Processing payment for order ${order.orderId}`);
  
  // Create payment request from order
  const paymentRequest: PaymentRequest = {
    orderId: order.orderId,
    amount: order.totalAmount,
    paymentMethod: order.paymentInfo.paymentMethod,
    // Include other payment details as needed
  };
  
  // Process the payment
  const paymentResult = await paymentService.processPayment(paymentRequest);
  
  if (paymentResult.success) {
    // Update order with payment information
    const paymentInfo: PaymentInfo = {
      ...order.paymentInfo,
      transactionId: paymentResult.transactionId,
      status: 'COMPLETED'
    };
    
    // Update order in database
    await dbService.updateOrder(order.orderId, {
      paymentInfo,
      status: OrderStatus.PAYMENT_COMPLETED
    });
    
    return {
      success: true,
      transactionId: paymentResult.transactionId
    };
  } else {
    // Update order with failed payment status
    const paymentInfo: PaymentInfo = {
      ...order.paymentInfo,
        status: 'FAILED'
    };
    
    // Update order in database
    await dbService.updateOrder(order.orderId, {
      paymentInfo,
      status: OrderStatus.PAYMENT_FAILED
    });
    
    return {
      success: false,
      errorMessage: paymentResult.errorMessage
    };
  }
}

/**
 * Activity to refund a payment
 */
export async function refundPayment(
  orderId: string,
  transactionId: string,
  amount: number
): Promise<{
  success: boolean;
  refundTransactionId?: string;
  errorMessage?: string;
}> {
  console.log(`Payment activity: Refunding payment for order ${orderId}`);
  
  // Process the refund
  const refundResult = await paymentService.refundPayment(transactionId, amount);
  
  if (refundResult.success) {
    // Get the order
    const order = await dbService.getOrder(orderId);
    if (!order) {
      return {
        success: false,
        errorMessage: `Order ${orderId} not found`
      };
    }
    
    // Update order with refund information
    const paymentInfo: PaymentInfo = {
      ...order.paymentInfo,
      status: 'REFUNDED'
    };
    
    // Update order in database
    await dbService.updateOrder(orderId, {
      paymentInfo,
      status: OrderStatus.REFUNDED
    });
    
    return {
      success: true,
      refundTransactionId: refundResult.transactionId
    };
  } else {
    return {
      success: false,
      errorMessage: refundResult.errorMessage
    };
  }
}