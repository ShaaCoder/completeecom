'use client';

import { useEffect, useState } from 'react';

interface AuthWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthWrapper({ children, fallback = null }: AuthWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and before hydration, show fallback
  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}