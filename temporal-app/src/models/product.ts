export interface Product {
    productId: string;
    name: string;
    description: string;
    price: number;
    category: string;
    stockQuantity: number;
    imageUrl: string;
    weight: number; // in kg
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    isAvailable: boolean;
  }
  
  export interface InventoryUpdate {
    productId: string;
    quantityChange: number;
    reason: 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'RESTOCK';
    timestamp: string;
  }