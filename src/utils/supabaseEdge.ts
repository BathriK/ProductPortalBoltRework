
import { supabase } from '@/integrations/supabase/client';

interface EdgeFunctionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RetryOptions {
  retries?: number;
  retryDelay?: number;
  timeoutMs?: number;
}

export const callBackendFunction = async <T>(
  functionName: string,
  params: Record<string, any>,
  options: RetryOptions = {}
): Promise<T> => {
  const { retries = 3, retryDelay = 1000, timeoutMs = 30000 } = options;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Calling edge function '${functionName}' (attempt ${attempt}/${retries})`);
      
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Function call timed out after ${timeoutMs}ms`)), timeoutMs);
      });

      // Race between the actual call and the timeout
      const callPromise = supabase.functions.invoke(functionName, {
        body: params,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const { data, error } = await Promise.race([callPromise, timeoutPromise]);

      if (error) {
        console.error(`Edge function error (attempt ${attempt}/${retries}):`, error);
        lastError = error;
        
        // If this is the last attempt or error is not retryable, throw immediately
        if (attempt === retries || !isRetryableError(error)) {
          throw error;
        }
      }

      if (!data) {
        throw new Error(`No data returned from edge function '${functionName}'`);
      }

      const response = data as EdgeFunctionResponse<T>;
      
      if (!response.success) {
        console.error(`Edge function failed (attempt ${attempt}/${retries}):`, response.error);
        lastError = new Error(response.error || 'Edge function failed');
        
        if (attempt === retries || !isRetryableError(lastError)) {
          throw lastError;
        }
      } else {
        // Success! Log and return
        console.log(`Edge function '${functionName}' succeeded on attempt ${attempt}`);
        return response.data as T;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === retries) {
        console.error(`All attempts failed for edge function '${functionName}':`, lastError);
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      const delayMs = retryDelay * Math.pow(1.5, attempt - 1);
      console.log(`Waiting ${delayMs}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // This should never be reached due to the throw in the last attempt
  throw lastError || new Error('Unknown error occurred');
};

const isRetryableError = (error: Error): boolean => {
  // Add more retryable error conditions as needed
  const retryableErrors = [
    'timeout',
    'connection',
    'network',
    'rate limit',
    'request failed',
    'function invocation failed',
    'internal server error',
    '503',
    '504',
    '502',
    '500'
  ];

  const errorMessage = error.message.toLowerCase();
  return retryableErrors.some(errorType => 
    errorMessage.includes(errorType)
  );
};

// Enhanced function with specific timeout and retry settings for different operations
export const callBackendFunctionWithRetries = async <T>(
  functionName: string,
  params: Record<string, any>,
  operationType: 'read' | 'write' | 'delete' = 'read'
): Promise<T> => {
  const options: RetryOptions = {
    retries: operationType === 'read' ? 3 : 2,
    retryDelay: operationType === 'read' ? 1000 : 2000,
    timeoutMs: operationType === 'read' ? 15000 : 30000
  };

  return callBackendFunction(functionName, params, options);
};
