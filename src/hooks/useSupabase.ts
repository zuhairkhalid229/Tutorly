
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "./use-toast";

export function useSupabase<T = any>() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const query = async (
    queryFn: () => Promise<{ data: T | null; error: Error | null }>,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
      successMessage?: string;
      errorMessage?: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: responseData, error: responseError } = await queryFn();
      
      if (responseError) {
        setError(responseError);
        if (options?.errorMessage) {
          toast({
            title: "Error",
            description: options.errorMessage,
            variant: "destructive",
          });
        }
        options?.onError?.(responseError);
        return { data: null, error: responseError };
      }
      
      setData(responseData as T);
      if (options?.successMessage) {
        toast({
          title: "Success",
          description: options.successMessage,
        });
      }
      options?.onSuccess?.(responseData as T);
      return { data: responseData as T, error: null };
    } catch (err: any) {
      setError(err);
      if (options?.errorMessage) {
        toast({
          title: "Error",
          description: options.errorMessage,
          variant: "destructive",
        });
      }
      options?.onError?.(err);
      return { data: null, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    data,
    query,
    client: supabase,
  };
}
