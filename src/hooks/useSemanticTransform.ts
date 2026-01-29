import { useState } from 'react';
import { toast } from 'sonner';

export function useSemanticTransform() {
  const [isProcessing, setIsProcessing] = useState(false);

  const transform = async (imageUrl: string, instruction: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/remix/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, instruction }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Transformation failed');

      return data;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Transformation failed');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return { transform, isProcessing };
}
