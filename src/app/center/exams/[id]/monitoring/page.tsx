
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
  Bell,
  AlertTriangle,
  Monitor,
  Eye,
  Smartphone,
  ScanEye,
  User,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Fingerprint
} from 'lucide-react';
import { 
  useDoc, 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
  updateDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, where, serverTimestamp, limit } from 'firebase/firestore';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

export default function ExamMonitoringPage() {
  const { id: examId } = useParams() as { id: string };
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(new Date());

  // Periodically refresh the "now" state
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  const examRef = useMemoFirebase(() => db && examId ? doc(db, 'exams', examId) : null, [db, examId]);
  const { data: exam, isLoading: examLoading } = useDoc(examRef);

  // Wait for user to be authenticated to avoid permission error
  const attemptsQuery = useMemoFirebase(() => {
    if (!db || !examId || !user) return null;
    return query(
      collection(db, 'exam_attempts'), 
      where('examId', '==', examId)
    );
  }, [db, examId, user]);
  const { data: attempts, isLoading: attemptsLoading } = useCollection(attemptsQuery);

  // Simplified doubts query
  const doubtsQuery = useMemoFirebase(() => {
    if (!db || !examId || !user) return null;
    return query(
      collection(db, 'doubts'),
      where('examId', '==', examId),
      limit(50)
    );
  }, [db, examId, user]);
  const { data: rawDoubts } = useCollection(doubtsQuery);

  // Client-side sorting for doubts
  const doubts = useMemo(() => {
    if (!rawDoubts) return [];
    return [...rawDoubts].sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  }, [rawDoubts]);

  const monitoringData = useMemo(() => {
    if (!attempts) return [];
    
    return attempts
      .filter(a => a.status === 'Started')
      .map(a => {
        const lastSeenDate = a.lastSeen ? new Date(a.lastSeen) : new Date(0);
        const diffSeconds = (now.getTime() - lastSeenDate.getTime()) / 1000;
        const isOnline = diffSeconds < 60; 
        
        const violationsCount = Array.isArray(a.securityViolationsCount) ? a.securityViolationsCount.length : (Number(a.securityViolationsCount) || 0);

        return {
          ...a,
          isOnline,
          violationsCount,
          isSecurityAlert: (a.proctoringStatus && a.proctoringStatus !== 'Monitoring') || (violationsCount > 0)
        };
      })
      .filter(a => 
        a.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.studentRollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [attempts, now, searchTerm]);

  const stats = useMemo(() => {
    const active = monitoringData.filter(a => a.isOnline).length;
    const alerts = monitoringData.filter(a => a.isSecurityAlert).length;
    const pendingDoubts = doubts?.filter(d => d.status === 'Pending').length || 0;
    return { active, alerts, total: monitoringData.length, pendingDoubts };
  }, [monitoringData, doubts]);

  const handleResolveDoubt = (doubtId: string) => {
    if (!db) return;
    const ref = doc(db, 'doubts', doubtId);
    updateDocumentNonBlocking(ref, { 
      status: 'Resolved', 
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp() 
    });
    toast({ title: "Doubt Resolved" });
  };

  if (examLoading || attemptsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Shield className="h-12 w-12 text-primary animate-pulse mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Authenticating Streams...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col h-screen overflow-hidden">
      <header className="h-16 bg-slate-900 text-white flex items-center px-4 md:px-8 sticky top-0 z-50 justify-between shadow-xl shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/center/exams">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="font-headline font-bold text-lg leading-tight flex items-center gap-2 text-primary">
              <Monitor className="h-5 w-5" /> Vision Console
            </h1>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest truncate max-w-[200px]">{exam?.title}</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active: {stats.active}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", stats.alerts > 0 ? "bg-red-500 animate-bounce" : "bg-slate-600")} />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Security Alerts: {stats.alerts}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", stats.pendingDoubts > 0 ? "bg-orange-500 animate-pulse" : "bg-slate-600")} />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Open Doubts: {stats.pendingDoubts}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-red-600 text-white font-black text-[9px] px-3 h-6">VISION GUARD LIVE</Badge>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-2">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Find Candidate Name or Roll..." 
                className="pl-10 bg-white h-11 border-none shadow-sm rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <RefreshCw className="h-3 w-3 animate-spin" /> Auto-Audit Stream Enabled
            </div>
          </div>

          {monitoringData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {monitoringData.map((student) => (
                <Card key={student.id} className={cn(
                  "overflow-hidden border-2 transition-all duration-500 shadow-lg rounded-2xl group relative bg-white",
                  !student.isOnline ? "border-slate-200 opacity-60 grayscale" :
                  student.isSecurityAlert ? "border-red-500 ring-4 ring-red-500/10" : "border-white hover:border-primary/20"
                )}>
                  <div className="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
                    {student.isOnline && student.latestSnapshot ? (
                      <div className="relative w-full h-full">
                        <img src={student.latestSnapshot} className="w-full h-full object-cover" alt="Student Feed" />
                        
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 z-20">
                          <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[7px] font-black text-white uppercase tracking-tighter">Verified AI Scan</span>
                        </div>

                        {student.isSecurityAlert && (
                          <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1 z-20 animate-pulse">
                            {student.proctoringStatus === 'Mobile Detected' ? <Smartphone className="h-2 w-2" /> : 
                             student.proctoringStatus === 'Multiple Persons' ? <Users className="h-2 w-2" /> : 
                             <AlertTriangle className="h-2 w-2" />}
                            {student.proctoringStatus || 'Security Alert'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <CameraOff className="h-8 w-8 text-slate-700 mx-auto" />
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{student.isOnline ? 'Awaiting Data...' : 'Offline'}</p>
                      </div>
                    )}
                  </div>

                  <CardHeader className="p-4 space-y-1">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-bold truncate">{student.studentName}</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-tight">{student.studentRollNumber}</CardDescription>
                      </div>
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm shrink-0">
                        <AvatarImage src={student.studentPhotoUrl} className="object-cover" />
                        <AvatarFallback className="bg-slate-100 text-slate-400 text-[10px] font-bold">ID</AvatarFallback>
                      </Avatar>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className={cn(
                        "text-[8px] h-5 font-black uppercase tracking-tighter",
                        student.proctoringStatus === 'Monitoring' ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                      )}>
                        {student.proctoringStatus || 'Normal'}
                      </Badge>
                      <Badge variant="outline" className="text-[8px] h-5 font-black uppercase tracking-tighter bg-slate-50 border-slate-100">
                        Violations: {student.violationsCount}/3
                      </Badge>
                    </div>

                    <div className="pt-2 border-t flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {student.isOnline ? 'Live' : 'Last Seen: ' + (student.lastSeen ? new Date(student.lastSeen).toLocaleTimeString() : 'N/A')}
                        </span>
                        {student.isOnline ? <Wifi className="h-3 w-3 text-green-500" /> : <WifiOff className="h-3 w-3 text-slate-400" />}
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                          <DialogHeader className="sr-only">
                            <DialogTitle>Audit Stream: {student.studentName}</DialogTitle>
                          </DialogHeader>
                          <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-3">
                              <ScanEye className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-headline font-bold text-sm leading-none">{student.studentName}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                  <Fingerprint className="h-3 w-3" /> ROLL: {student.studentRollNumber}
                                </p>
                              </div>
                            </div>
                            <Badge className={cn("font-black h-6", student.isSecurityAlert ? "bg-red-600" : "bg-green-600")}>
                              {student.proctoringStatus}
                            </Badge>
                          </div>
                          <div className="aspect-video bg-black flex items-center justify-center">
                            {student.latestSnapshot ? (
                              <img src={student.latestSnapshot} className="w-full h-full object-contain" alt="High Res" />
                            ) : (
                              <p className="text-slate-500 font-bold uppercase text-xs">No Signal</p>
                            )}
                          </div>
                          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white">
                             <div className="space-y-1">
                               <p className="text-[8px] font-black text-slate-400 uppercase">Integrity Index</p>
                               <p className="text-lg font-bold text-slate-900">{student.securityReport?.integrityScore ?? 100}%</p>
                             </div>
                             <div className="space-y-1">
                               <p className="text-[8px] font-black text-slate-400 uppercase">Tab Switches</p>
                               <p className="text-lg font-bold text-slate-900">{student.securityReport?.tabSwitchCount ?? 0}</p>
                             </div>
                             <div className="space-y-1">
                               <p className="text-[8px] font-black text-slate-400 uppercase">Mobile Detected</p>
                               <p className={cn("text-lg font-bold", student.securityReport?.mobileDetected ? "text-red-600" : "text-green-600")}>
                                 {student.securityReport?.mobileDetected ? "YES" : "NO"}
                               </p>
                             </div>
                             <div className="space-y-1">
                               <p className="text-[8px] font-black text-slate-400 uppercase">Multi-Person</p>
                               <p className={cn("text-lg font-bold", student.securityReport?.multiPersonIncident ? "text-red-600" : "text-green-600")}>
                                 {student.securityReport?.multiPersonIncident ? "YES" : "NO"}
                               </p>
                             </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[2rem] border-4 border-dashed border-slate-100">
              <Users className="h-16 w-16 text-slate-200 mb-4" />
              <h3 className="text-xl font-bold text-slate-900">No active sessions</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2 font-medium">Verified student streams will appear here automatically.</p>
            </div>
          )}
        </main>

        <aside className="w-80 bg-white border-l flex flex-col shrink-0 hidden lg:flex">
          <div className="p-6 border-b bg-slate-50/50">
            <h2 className="font-headline font-bold text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" /> Live Doubt Alerts
              {stats.pendingDoubts > 0 && <Badge className="bg-primary text-white h-5 min-w-[20px] p-0 flex items-center justify-center rounded-full text-[10px]">{stats.pendingDoubts}</Badge>}
            </h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y divide-slate-100">
              {doubts && doubts.length > 0 ? (
                doubts.map((doubt) => (
                  <div key={doubt.id} className={cn(
                    "p-4 hover:bg-slate-50 transition-colors group",
                    doubt.status === 'Resolved' && "opacity-50 grayscale"
                  )}>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="space-y-0.5">
                        <p className="font-bold text-xs text-slate-900">{doubt.studentName}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ROLL: {doubt.studentRollNumber}</p>
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-[7px] font-black uppercase tracking-tighter px-2 h-4",
                        doubt.status === 'Pending' ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-green-50 text-green-600 border-green-200"
                      )}>
                        {doubt.status}
                      </Badge>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-xl mb-3">
                      <p className="text-[11px] font-medium text-slate-600 leading-snug italic">"{doubt.message}"</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                        <Clock className="h-3 w-3" /> 
                        {doubt.createdAt ? new Date(doubt.createdAt.toMillis ? doubt.createdAt.toMillis() : doubt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </div>
                      {doubt.status === 'Pending' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-[9px] font-black text-primary uppercase hover:bg-primary/5 gap-1.5"
                          onClick={() => handleResolveDoubt(doubt.id)}
                        >
                          <CheckCircle2 className="h-3 w-3" /> Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center space-y-4 px-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                    <CheckCircle2 className="h-6 w-6 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Clear Queue</p>
                    <p className="text-[11px] text-slate-400 font-medium">No student doubts raised yet for this assessment.</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>

      <footer className="bg-white border-t p-4 px-8 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5"><Activity className="h-3 w-3 text-green-500" /> Proctor Status: Operational</span>
          <span className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-primary" /> Vision Guard: AI Engaged</span>
          <span className="flex items-center gap-1.5"><Bell className={cn("h-3 w-3", stats.pendingDoubts > 0 ? "text-orange-500" : "text-slate-300")} /> Pending Doubts: {stats.pendingDoubts}</span>
        </div>
        <div className="hidden sm:block">Exam Audit ID: {examId.substring(0, 12)}</div>
      </footer>
    </div>
  );
}
