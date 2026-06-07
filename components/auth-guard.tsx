'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo } from '@/lib/api';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getUserInfo();
      if (!user) {
        router.push('/login');
      } else {
        setIsAuthenticated(true);
      }
    };

    checkAuth();
  }, [router]);

  // 检查中显示加载状态
  if (isAuthenticated === null) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">验证中...</p>
          </div>
        </div>
      )
    );
  }

  // 未认证已在 useEffect 中处理重定向
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
