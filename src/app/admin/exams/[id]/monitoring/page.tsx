
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ArrowLeft, 
  Video, 
  CameraOff, 
  UserCheck, 
  AlertCircle, 
  Activity, 
  Search,
  Users,
  Wifi,
  WifiOff,
  Maximize2,
  RefreshCw,
  Monitor,
  Eye,
  ScanEye,
  Fingerprint,
  Loader2
} from 'lucide-react';
import { 
  useDoc, 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase
} from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

export default function AdminExamMonitoringPage() {
  const { id: examId } = useParams() as { id: string };
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  const examRef = useMemoFirebase(() => db && examId ? doc(db, 'exams', examId) : null, [db, examId]);
  const { data: exam, isLoading: examLoading } = useDoc(examRef);

  const attemptsQuery = useMemoFirebase(() => {
    if (!db || !examId || !user) return null;
    return query(collection(db, 'exam_attempts'), where('examId', '==', examId));
  }, [db, examId, user]);
  const { data: attempts, isLoading: attemptsLoading } = useCollection(attemptsQuery);

  const monitoringData = useMemo(() => {
    if (!attempts) return [];
    return attempts
      .filter(a => a.status === 'Started')
      .map(a => {
        const lastSeenDate = a.lastSeen ? new Date(a.lastSeen) : new Date(0);
        const isOnline = (now.getTime() - lastSeenDate.getTime()) / 1000 < 60;
        return { ...a, isOnline };
      })
      .filter(a => 
        a.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.studentRollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [attempts, now, searchTerm]);

  if (examLoading || attemptsLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col h-screen overflow-hidden">
      <header className="h-16 bg-slate-900 text-white flex items-center px-4 md:px-8 sticky top-0 z-50 justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <Link href="/admin/exams">
            <Button variant="ghost" size="icon" className="text-white"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="font-headline font-bold text-lg text-primary flex items-center gap-2"><Monitor className="h-5 w-5" /> Global Monitoring</h1>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{exam?.title}</p>
          </div>
        </div>
        <Badge className="bg-red-600 text-white font-black text-[9px] h-6 px-4">VISION GUARD LIVE</Badge>
      </header>

      <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-8">
           <div className="relative w-96">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input placeholder="Search name or roll..." className="pl-10 h-11 bg-white border-none rounded-xl shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Streams: {monitoringData.filter(m => m.isOnline).length}</span></div>
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {monitoringData.map((m) => (
             <Card key={m.id} className={cn("overflow-hidden border-2 rounded-[2rem] shadow-lg", m.isOnline ? "border-white" : "border-slate-200 opacity-60 grayscale")}>
                <div className="aspect-video bg-slate-900 relative">
                   {m.latestSnapshot ? (
                      <img src={m.latestSnapshot} className="w-full h-full object-cover" />
                   ) : (
                      <div className="h-full flex items-center justify-center"><CameraOff className="h-8 w-8 text-slate-700" /></div>
                   )}
                   <div className="absolute top-2 left-2 bg-black/50 px-2 py-0.5 rounded-full text-[7px] font-black text-white uppercase">{m.proctoringStatus || 'MONITORING'}</div>
                </div>
                <CardContent className="p-4 flex items-center justify-between">
                   <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{m.studentName}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.studentRollNumber}</p>
                   </div>
                   <Badge variant={m.isOnline ? "default" : "outline"} className={cn("h-5 text-[8px] font-black", m.isOnline ? "bg-green-500" : "text-slate-400")}>{m.isOnline ? 'LIVE' : 'OFFLINE'}</Badge>
                </CardContent>
             </Card>
           ))}
        </div>
      </main>
    </div>
  );
}
