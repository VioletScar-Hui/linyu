import { useState } from 'react';

/** AI 异步动作的通用状态封装:loading / error / 运行。被 AI 起标题、变体、体检等复用。 */
export function useAiAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async <T>(fn: () => Promise<T>, onOk: (result: T) => void) => {
    setLoading(true);
    setError(null);
    try {
      onOk(await fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, run, clearError: () => setError(null) };
}
