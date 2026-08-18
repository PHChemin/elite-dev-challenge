import { useCallback, useEffect, useState } from 'react';
import i18n from '../i18n';
import { ApiError } from './client';

type ApiResource<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

/**
 * Carrega um recurso da API. `load` precisa ter referência estável: função de
 * módulo ou `useCallback`, porque é a dependência que dispara a busca.
 */
export function useApiResource<T>(load: () => Promise<T>): ApiResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(null);
    load()
      .then((result) => {
        if (current) {
          setData(result);
        }
      })
      .catch((cause: unknown) => {
        if (current) {
          setError(
            cause instanceof ApiError
              ? cause.message
              : i18n.t('errors.api.requestFailed'),
          );
        }
      })
      .finally(() => {
        if (current) {
          setLoading(false);
        }
      });
    return () => {
      current = false;
    };
  }, [load, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { data, loading, error, reload };
}
