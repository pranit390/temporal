export interface Customer {
    customerId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    defaultShippingAddress: Address;
    defaultBillingAddress: Address;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }