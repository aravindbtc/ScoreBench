'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query } from 'firebase/firestore';

type QueryStatus = 'loading' | 'success' | 'error';

export function useFirestoreQuery<T>(query: Query) {
  const [data, setData] = useState<T[] | null>(null);
  const [status, setStatus] = useState<QueryStatus>('loading');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setStatus('loading');
    const unsubscribe = onSnapshot(
      query,
      (querySnapshot) => {
        const results: T[] = [];
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(results);
        setStatus('success');
      },
      (err) => {
        console.error('Firestore query error:', err);
        setError(err);
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, status, error };
}
