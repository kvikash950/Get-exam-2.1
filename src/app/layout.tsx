
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';

function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  
  const statusRef = useMemoFirebase(() => db ? doc(db, 'platformConfig', 'status') : null, [db]);
  const { data: status } = useDoc(statusRef);

  const ADMIN_EMAIL = 'kvikash@gmail.com';

  useEffect(() => {
    if (status?.isMaintenanceActive) {
      const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const isLoginPage = pathname?.includes('/auth/admin-login');
      const isAdminRoute = pathname?.startsWith('/admin');
      
      // Redirect to maintenance if not admin and not on maintenance page already
      if (!isAdmin && !isLoginPage && !isAdminRoute && pathname !== '/maintenance') {
        router.push('/maintenance');
      }
    }
  }, [status, user, pathname, router]);

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=Caveat:wght@400..700&family=Patrick+Hand&display=swap" rel="stylesheet" />
        <title>My Exam | Professional Online Exam Platform</title>
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <MaintenanceGuard>
            {children}
            <Toaster />
          </MaintenanceGuard>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
