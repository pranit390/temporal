import * as fs from 'fs/promises';
import * as path from 'path';

const initialProducts = {
  "products": [
    {
      "productId": "prod-001",
      "name": "Smartphone X",
      "description": "Latest smartphone with advanced features",
      "price": 999.99,
      "category": "Electronics",
      "stockQuantity": 50,
      "imageUrl": "https://example.com/smartphone-x.jpg",
      "weight": 0.2,
      "dimensions": {
        "length": 15,
        "width": 7,
        "height": 1
      },
      "isAvailable": true
    },
    // ... other products
  ]
};

const initialCustomers = {
  "customers": [
    {
      "customerId": "cust-001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "123-456-7890",
      "defaultShippingAddress": {
        "street": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "zipCode": "12345",
        "country": "USA"
      },
      "defaultBillingAddress": {
        "street": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "zipCode": "12345",
        "country": "USA"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    // ... other customers
  ]
};

const emptyOrders = {
  "orders": []
};

async function initDatabase() {
  try {
    // Create directory structure
    const dataDir = path.join(__dirname, '../data');
    const initialDir = path.join(dataDir, 'initial');

    await fs.mkdir(dataDir, { recursive: true });
    await fs.mkdir(initialDir, { recursive: true });

    // Write initial data files
    await fs.writeFile(
      path.join(initialDir, 'products.json'),
      JSON.stringify(initialProducts, null, 2)
    );
    await fs.writeFile(
      path.join(initialDir, 'customers.json'),
      JSON.stringify(initialCustomers, null, 2)
    );

    // Write working data files
    await fs.writeFile(
      path.join(dataDir, 'orders.json'),
      JSON.stringify(emptyOrders, null, 2)
    );
    await fs.copyFile(
      path.join(initialDir, 'products.json'),
      path.join(dataDir, 'products.json')
    );
    await fs.copyFile(
      path.join(initialDir, 'customers.json'),
      path.join(dataDir, 'customers.json')
    );

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase().catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
}

export { initDatabase }; 