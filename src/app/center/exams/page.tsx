
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Plus, 
  Share2, 
  BarChart, 
  Shield, 
  Search, 
  Filter, 
  Pencil, 
  LogOut, 
  Menu, 
  Lock,
  Activity,
  Users,
  Loader2,
  MessageSquare,
  HelpCircle,
  User,
  Fingerprint,
  Layers,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  TrendingUp
} from 'lucide-react';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useAuth, 
  useMemoFirebase,
  useDoc,
  updateDocumentNonBlocking
} from '@/firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

function DoubtDetailItem({ doubt, examId }: { doubt: any, examId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const questionRef = useMemoFirebase(() => 
    db && examId && doubt.questionId ? doc(db, 'exams', examId, 'questions', doubt.questionId) : null,
    [db, examId, doubt.questionId]
  );
  const { data: question, isLoading: questionLoading } = useDoc(questionRef);

  const handleResolve = () => {
    if (!db) return;
    const ref = doc(db, 'doubts', doubt.id);
    updateDocumentNonBlocking(ref, { status: 'Resolved', updatedAt: serverTimestamp() });
    toast({ title: "Doubt Resolved" });
  };

  return (
    <div className={cn(
      "p-6 rounded-[2rem] border-2 transition-all group",
      doubt.status === 'Resolved' ? "opacity-50 bg-slate-50 border-slate-100" : "bg-white border-primary/5 hover:border-primary/20 shadow-sm"
    )}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-none">{doubt.studentName}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
              <Fingerprint className="h-3 w-3" /> ROLL: {doubt.studentRollNumber} • {doubt.batchName || 'General'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {doubt.status === 'Pending' ? (
            <Button onClick={handleResolve} variant="outline" size="sm" className="h-8 rounded-full border-green-200 text-green-600 bg-green-50 font-bold gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
            </Button>
          ) : (
            <Badge className="bg-slate-200 text-slate-500 font-bold uppercase text-[8px]">Resolved</Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 relative">
          <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <HelpCircle className="h-3 w-3" /> Student's Message
          </p>
          <p className="text-sm font-medium text-orange-900 italic">"{doubt.message}"</p>
        </div>

        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
          <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Layers className="h-3 w-3" /> Question Context
          </p>
          {questionLoading ? (
            <div className="py-2 flex items-center gap-2 text-slate-500 text-xs italic">
              <Loader2 className="h-3 w-3 animate-spin" /> Retrieving question data...
            </div>
          ) : question ? (
            <div className="space-y-3">
              <p className="text-xs font-bold text-white line-clamp-3 leading-relaxed">{question.questionText}</p>
              <div className="grid grid-cols-2 gap-2">
                {['A', 'B', 'C', 'D'].map(l => (
                  <div key={l} className={cn(
                    "text-[10px] p-2 rounded-lg border",
                    question.correctAnswerForSingleChoice === l ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-white/5 bg-white/5 text-slate-400"
                  )}>
                    <span className="font-black mr-1">{l}:</span> {question.options?.find((o: any) => o.label === l)?.text || 'N/A'}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-slate-500 italic">Question content no longer available or was removed.</p>
          )}
        </div>
      </div>
      
      <p className="mt-4 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">
        Received: {doubt.createdAt?.toMillis ? new Date(doubt.createdAt.toMillis()).toLocaleString() : 'Just now'}
      </p>
    </div>
  );
}

export default function ExamsListPage() {
  const { user: currentUser } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [now, setNow] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedExamForDoubts, setSelectedExamForDoubts] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const examsQuery = useMemoFirebase(() => {
    if (!db || !currentUser?.uid) return null;
    return query(collection(db, 'exams'), where('coachingCenterId', '==', currentUser.uid));
  }, [db, currentUser?.uid]);
  const { data: exams, isLoading: examsLoading } = useCollection(examsQuery);

  const allDoubtsQuery = useMemoFirebase(() => {
    if (!db || !currentUser?.uid) return null;
    return query(collection(db, 'doubts'), where('coachingCenterId', '==', currentUser.uid));
  }, [db, currentUser?.uid]);
  const { data: allDoubts } = useCollection(allDoubtsQuery);

  const attemptsQuery = useMemoFirebase(() => {
    if (!db || !currentUser?.uid) return null;
    return query(collection(db, 'exam_attempts'), where('coachingCenterId', '==', currentUser.uid));
  }, [db, currentUser?.uid]);
  const { data: allAttempts } = useCollection(attemptsQuery);

  const filteredExams = useMemo(() => {
    if (!exams) return [];
    return exams.filter(exam => 
      exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      exam.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
       const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
       const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
       return dateB - dateA;
    });
  }, [exams, searchTerm]);

  const handleShare = (examId: string) => {
    const url = `${window.location.origin}/exam/${examId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copied!", description: "Send this URL to your students." });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth/login');
  };

  const getEffectiveStatus = (exam: any) => {
    const endTime = new Date(exam.endTime);
    const startTime = new Date(exam.startTime);
    if (now > endTime) return 'Completed';
    if (now >= startTime && exam.status === 'Active') return 'Active';
    if (now < startTime && exam.status === 'Active') return 'Scheduled';
    return exam.status;
  };

  const NavItems = () => (
    <nav className="flex-1 p-4 space-y-2">
      <Link href="/center/dashboard"><Button variant="ghost" className="w-full justify-start gap-3"><LayoutDashboard className="h-4 w-4" /> Console Home</Button></Link>
      <Link href="/center/students"><Button variant="ghost" className="w-full justify-start gap-3"><Users className="h-4 w-4" /> Students</Button></Link>
      <Link href="/center/exams"><Button variant="secondary" className="w-full justify-start gap-3 bg-primary/10 text-primary"><FileText className="h-4 w-4" /> Exams</Button></Link>
      <Link href="/center/results"><Button variant="ghost" className="w-full justify-start gap-3"><BarChart className="h-4 w-4" /> Results</Button></Link>
      <Link href="/center/profile"><Button variant="ghost" className="w-full justify-start gap-3"><Settings className="h-4 w-4" /> Profile</Button></Link>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col sticky top-0 h-screen shadow-sm">
        <div className="p-6 border-b flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-headline font-bold text-xl">Get Exam</span></div>
        <NavItems />
        <div className="p-4 border-t"><Button variant="ghost" className="w-full justify-start gap-3 text-red-600" onClick={handleLogout}><LogOut className="h-4 w-4" /> Logout</Button></div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b md:hidden flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-headline font-bold text-lg">Get Exam</span></div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu className="h-6 w-6" /></Button></SheetTrigger>
            <SheetContent side="left" className="p-0 w-72"><NavItems /></SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div><h1 className="text-2xl md:text-3xl font-headline font-bold">Assessments & Doubts</h1><p className="text-muted-foreground text-sm">Deploy exams and resolve student queries centrally.</p></div>
            <Link href="/center/exams/create" className="w-full md:w-auto"><Button className="w-full font-bold shadow-lg shadow-primary/20 gap-2 h-11"><Plus className="h-4 w-4" /> Create New Exam</Button></Link>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-0">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative w-full lg:w-96"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search exams..." className="pl-10 h-11" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {examsLoading ? <div className="py-12 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" /></div> : filteredExams.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow className="bg-slate-50/50">
                      <TableHead className="pl-6">Exam Details</TableHead>
                      <TableHead>Capacity / Credits</TableHead>
                      <TableHead>Actual Attempts</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Doubts</TableHead>
                      <TableHead className="text-right pr-6">Operations</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>{filteredExams.map((exam) => {
                      const status = getEffectiveStatus(exam);
                      const isLocked = status === 'Completed' || status === 'Active';
                      const examDoubts = allDoubts?.filter(d => d.examId === exam.id && d.status === 'Pending') || [];
                      const attemptCount = allAttempts?.filter(a => a.examId === exam.id).length || 0;
                      
                      return (
                        <TableRow key={exam.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="pl-6"><div className="flex flex-col"><span className="font-bold text-slate-900 text-sm">{exam.title}</span><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{exam.subject}</span></div></TableCell>
                          <TableCell>
                             <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black px-3 h-6 gap-1">
                                   <Zap className="h-2.5 w-2.5 fill-current" /> {exam.studentCapacity || 0}
                                </Badge>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Spent</span>
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-900">{attemptCount}</span>
                                <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (attemptCount / (exam.studentCapacity || 1)) * 100)}%` }} />
                                </div>
                             </div>
                          </TableCell>
                          <TableCell><Badge className={cn("text-[9px] font-black uppercase tracking-widest px-3 h-6", status === 'Completed' ? 'bg-slate-200 text-slate-600' : status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')}>{status}</Badge></TableCell>
                          <TableCell>
                            {examDoubts.length > 0 ? (
                              <Button onClick={() => setSelectedExamForDoubts(exam)} variant="ghost" className="h-8 gap-2 p-0 hover:bg-transparent group">
                                <Badge className="bg-orange-500 text-white font-black h-6 px-2.5 animate-pulse group-hover:scale-105 transition-transform">{examDoubts.length}</Badge>
                                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Pending</span>
                              </Button>
                            ) : <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">All Clear</span>}
                          </TableCell>
                          <TableCell className="text-right pr-6"><div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-primary hover:bg-primary/5" onClick={() => handleShare(exam.id)}><Share2 className="h-4 w-4" /></Button>
                            <Link href={isLocked ? "#" : `/center/exams/${exam.id}/edit`}><Button size="icon" variant="ghost" className={cn("h-9 w-9", isLocked ? "text-slate-200" : "text-blue-600 hover:bg-blue-50")} disabled={isLocked}>{isLocked ? <Lock className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}</Button></Link>
                            {status === 'Active' && <Link href={`/center/exams/${exam.id}/monitoring`}><Button variant="outline" size="sm" className="h-9 font-bold px-4 gap-2 bg-green-50 text-green-700 border-green-100"><Activity className="h-4 w-4" /> Monitor</Button></Link>}
                          </div></TableCell>
                        </TableRow>
                      );
                    })}</TableBody>
                  </Table>
                </div>
              ) : <div className="py-24 text-center text-slate-400 italic">No examinations mapped to your center yet.</div>}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Doubts Management Dialog */}
      <Dialog open={!!selectedExamForDoubts} onOpenChange={() => setSelectedExamForDoubts(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className="bg-slate-900 p-8 text-white shrink-0 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12"><MessageSquare className="h-32 w-32 text-primary" /></div>
             <DialogHeader className="relative z-10">
               <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-primary text-white font-black text-[9px] uppercase tracking-[0.2em]">{selectedExamForDoubts?.subject}</Badge>
               </div>
               <DialogTitle className="text-3xl font-headline font-bold text-white tracking-tight">{selectedExamForDoubts?.title}</DialogTitle>
               <DialogDescription className="text-slate-400 font-medium">Resolution panel for student doubts raised during this session.</DialogDescription>
             </DialogHeader>
          </div>
          
          <ScrollArea className="flex-1 bg-slate-50/50">
            <div className="p-8 space-y-8">
              {allDoubts?.filter(d => d.examId === selectedExamForDoubts?.id).length ? (
                allDoubts
                  .filter(d => d.examId === selectedExamForDoubts?.id)
                  .sort((a, b) => (a.status === 'Pending' ? -1 : 1))
                  .map(doubt => (
                    <DoubtDetailItem key={doubt.id} doubt={doubt} examId={selectedExamForDoubts.id} />
                  ))
              ) : (
                <div className="py-32 text-center space-y-4">
                  <div className="h-20 w-20 rounded-full bg-white shadow-xl flex items-center justify-center mx-auto"><CheckCircle2 className="h-10 w-10 text-green-500" /></div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">No Doubts Found</h4>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">Excellent! No students have reported issues with this assessment.</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="p-6 bg-white border-t">
             <Button variant="outline" className="font-bold h-12 rounded-xl px-10" onClick={() => setSelectedExamForDoubts(null)}>Close Panel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
