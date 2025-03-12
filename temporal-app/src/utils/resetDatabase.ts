import * as fs from 'fs/promises';
import * as path from 'path';

async function resetDatabase() {
  try {
    // Reset orders to empty array
    const ordersFile = path.join(__dirname, '../data/orders.json');
    await fs.writeFile(ordersFile, JSON.stringify({ orders: [] }, null, 2));

    // Reset products to initial state
    const productsSource = path.join(__dirname, '../data/initial/products.json');
    const productsTarget = path.join(__dirname, '../data/products.json');
    await fs.copyFile(productsSource, productsTarget);

    // Reset customers to initial state
    const customersSource = path.join(__dirname, '../data/initial/customers.json');
    const customersTarget = path.join(__dirname, '../data/customers.json');
    await fs.copyFile(customersSource, customersTarget);

    console.log('Database reset successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1); // Exit with error code for npm script
  }
}

// Run if called directly
if (require.main === module) {
  resetDatabase().catch((err) => {
    console.error('Failed to reset database:', err);
    process.exit(1);
  });
}

export { resetDatabase }; 