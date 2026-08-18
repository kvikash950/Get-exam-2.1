"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2, Shield } from 'lucide-react';

export default function VerificationPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.push('/center/dashboard');
      } else {
        router.push('/auth/login');
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-8 w-8 text-primary animate-pulse" />
        <span className="font-headline font-bold text-2xl text-primary">My Exam</span>
      </div>
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Finalizing Security Handshake...</p>
      </div>
    </div>
  );
}