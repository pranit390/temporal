import { FileService } from '../services/fileService';
import { Order } from '../models/order';

// Initialize services
const fileService = new FileService();

/**
 * Activity to generate and store an order receipt
 */
export async function generateAndStoreReceipt(order: Order): Promise<{
  success: boolean;
  fileUrl?: string;
  error?: string;
}> {
  console.log(`File activity: Generating and storing receipt for order ${order.orderId}`);
  
  // Generate receipt PDF
  const receiptResult = await fileService.generateReceipt(order);
  
  if (!receiptResult.success || !receiptResult.content) {
    return {
      success: false,
      error: receiptResult.error || 'Failed to generate receipt'
    };
  }
  
  // Upload receipt to storage
  const fileName = `receipt-${order.orderId}.pdf`;
  const uploadResult = await fileService.uploadFile(
    fileName,
    receiptResult.content,
    'application/pdf'
  );
  
  if (!uploadResult.success) {
    return {
      success: false,
      error: uploadResult.error || 'Failed to upload receipt'
    };
  }
  
  return {
    success: true,
    fileUrl: uploadResult.url
  };
}

/**
 * Activity to download a file
 */
export async function downloadFile(fileUrl: string): Promise<{
  success: boolean;
  content?: string;
  error?: string;
}> {
  console.log(`File activity: Downloading file from ${fileUrl}`);
  
  // Download file
  const downloadResult = await fileService.downloadFile(fileUrl);
  
  return downloadResult;
}