export enum OrderStatus {
    CREATED = 'CREATED',
    PAYMENT_PENDING = 'PAYMENT_PENDING',
    PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    INVENTORY_CHECKED = 'INVENTORY_CHECKED',
    INVENTORY_FAILED = 'INVENTORY_FAILED',
    SHIPPING_PENDING = 'SHIPPING_PENDING',
    SHIPPED = 'SHIPPED',
    SHIPPING_FAILED = 'SHIPPING_FAILED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED',
  }
  
  export interface OrderItem {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }
  
  export interface Order {
    orderId: string;
    customerId: string;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
    shippingAddress: Address;
    billingAddress: Address;
    paymentInfo: PaymentInfo;
    trackingNumber?: string;
    notes?: string;
  }
  
  export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }
  
  export interface PaymentInfo {
    paymentMethod: 'CREDIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER';
    cardNumber?: string; // Last 4 digits only for security
    transactionId?: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  }