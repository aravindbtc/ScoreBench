'use client';

import { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AppLogo } from '../layout/AppLogo';
import { Loader2 } from 'lucide-react';

export function AdminAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('admin-auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="absolute top-6 left-6">
          <AppLogo />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminLogin />
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
