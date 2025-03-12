import { simulateDelay, simulateFailure } from '../utils/simulators';
import { PaymentInfo } from '../models/order';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  paymentMethod: 'CREDIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER';
  cardDetails?: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardHolderName: string;
  };
  paypalEmail?: string;
  bankAccountDetails?: {
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
  timestamp: string;
}

export class PaymentService {
  /**
   * Simulates processing a payment with a payment gateway
   * Has random delays and occasional failures to simulate real-world scenarios
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.log(`Processing payment for order ${request.orderId} for amount ${request.amount}`);
    
    // Simulate processing delay (payment gateway taking time)
    await simulateDelay(1000, 5000);
    
    // Simulate occasional payment failures (declined card, insufficient funds, etc.)
    try {
      simulateFailure(0.25, 'Payment declined: Insufficient funds');
      simulateFailure(0.1, 'Payment gateway timeout');
      simulateFailure(0.05, 'Payment processor unavailable');
      
      // If no failures occurred, return success response
      const transactionId = `txn_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      
      return {
        success: true,
        transactionId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown payment error',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Simulates refunding a payment
   */
  async refundPayment(transactionId: string, amount: number): Promise<PaymentResponse> {
    console.log(`Refunding payment ${transactionId} for amount ${amount}`);
    
    // Simulate processing delay
    await simulateDelay(1000, 3000);
    
    // Simulate occasional refund failures
    try {
      simulateFailure(0.15, 'Refund failed: Transaction not found');
      simulateFailure(0.1, 'Refund gateway timeout');
      
      // If no failures occurred, return success response
      const refundTransactionId = `refund_${transactionId}_${Date.now()}`;
      
      return {
        success: true,
        transactionId: refundTransactionId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown refund error',
        timestamp: new Date().toISOString()
      };
    }
  }
}