
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Construction, Clock, RefreshCw, Mail } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function MaintenancePage() {
  const router = useRouter();
  const db = useFirestore();
  const statusRef = useMemoFirebase(() => db ? doc(db, 'platformConfig', 'status') : null, [db]);
  const { data: status } = useDoc(statusRef);

  useEffect(() => {
    // If maintenance is turned off, redirect to home
    if (status && !status.isMaintenanceActive) {
      router.push('/');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
      <div className="absolute inset-0 bg-[url('https://placehold.co/1000x1000/000000/111111/png')] opacity-20 pointer-events-none"></div>
      
      <div className="w-full max-w-2xl relative z-10 space-y-10">
        <div className="flex items-center justify-center gap-3">
          <div className="bg-primary p-2 rounded-2xl text-white shadow-2xl">
            <Shield className="h-8 w-8" />
          </div>
          <span className="font-headline font-bold text-3xl text-white tracking-tight">My Exam</span>
        </div>

        <Card className="border-none shadow-2xl bg-slate-900/50 backdrop-blur-xl rounded-[3rem] p-12 overflow-hidden border border-white/5">
           <div className="space-y-8">
              <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto text-orange-500 ring-8 ring-orange-500/5">
                <Construction className="h-12 w-12 animate-pulse" />
              </div>
              
              <div className="space-y-4">
                 <h1 className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tight leading-tight">
                    Under Scheduled Upgrade
                 </h1>
                 <p className="text-xl text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                    {status?.maintenanceMessage || "We are currently improving the platform infrastructure. Access will be restored shortly."}
                 </p>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-6">
                 <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 text-slate-300">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold uppercase tracking-widest">Est. Restore: 2 Hours</span>
                 </div>
                 <Button 
                    variant="outline" 
                    className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-2xl h-12 px-8 font-black gap-2"
                    onClick={() => window.location.reload()}
                 >
                    <RefreshCw className="h-4 w-4" /> Check Status
                 </Button>
              </div>
           </div>
        </Card>

        <div className="flex flex-col items-center gap-4 text-slate-500">
           <p className="text-[10px] font-black uppercase tracking-[0.4em]">Urgent Enquiries</p>
           <a href="mailto:support@myexam.io" className="flex items-center gap-2 font-bold hover:text-white transition-colors">
              <Mail className="h-4 w-4" /> support@myexam.io
           </a>
        </div>
      </div>
    </div>
  );
}
