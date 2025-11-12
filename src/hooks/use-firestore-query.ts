
'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, FirestoreError } from 'firebase/firestore';
import { isEqual } from 'lodash';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type QueryStatus = 'loading' | 'success' | 'error';

// This is a simplified internal type from the SDK to get the path
interface InternalQuery extends Query {
  _query: {
    path: {
      canonicalString(): string;
    }
  }
}

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

        // Prevent re-render if data is the same
        setData(prevData => {
          if (isEqual(prevData, results)) {
            return prevData;
          }
          return results;
        });

        setStatus('success');
      },
      (err: FirestoreError) => {
        console.error('Firestore query error:', err);

        const path = (query as InternalQuery)._query.path.canonicalString();
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: path,
        });

        setError(contextualError);
        errorEmitter.emit('permission-error', contextualError);
        
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, status, error };
}
