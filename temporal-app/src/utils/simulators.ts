/**
 * Utility functions to simulate various real-world scenarios like delays, failures, and timeouts
 */

// Simulate a delay with random jitter
export function simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delayMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    console.log(`Simulating delay of ${delayMs}ms`);
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  // Simulate a failure with a given probability
  export function simulateFailure(failureProbability: number, errorMessage: string): void {
    if (Math.random() < failureProbability) {
      console.log(`Simulating failure: ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }
  
  // Simulate a timeout by never resolving the promise
  export function simulateTimeout(): Promise<never> {
    console.log('Simulating timeout (this promise will never resolve)');
    return new Promise(() => {
      // This promise never resolves
    });
  }
  
  // Simulate network instability with random delays and occasional failures
  export async function simulateNetworkInstability(
    failureProbability: number = 0.2,
    minDelayMs: number = 100,
    maxDelayMs: number = 3000
  ): Promise<void> {
    await simulateDelay(minDelayMs, maxDelayMs);
    simulateFailure(failureProbability, 'Network connection error');
  }
  
  // Simulate a flaky API that sometimes returns errors
  export async function simulateFlakyApi<T>(
    successResponse: T,
    failureProbability: number = 0.3,
    errorMessage: string = 'API Error',
    minDelayMs: number = 200,
    maxDelayMs: number = 2000
  ): Promise<T> {
    await simulateDelay(minDelayMs, maxDelayMs);
    simulateFailure(failureProbability, errorMessage);
    return successResponse;
  }