"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  Globe, 
  Clock, 
  Calendar, 
  Zap, 
  Users, 
  Search, 
  ArrowRight,
  Filter,
  CheckCircle2,
  Trophy,
  Loader2,
  User,
  Fingerprint,
  Mail,
  Smartphone,
  CalendarDays,
  XCircle,
  TrendingUp,
  Award,
  ImageIcon,
  LayoutGrid,
  Info,
  ListChecks,
  Sparkles,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser, useAuth, initiateAnonymousSignIn } from '@/firebase';
import { collection, query, where, limit, getDocs, doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCategoryImage } from '@/lib/placeholder-images';

const CATEGORIES = [
  "All",
  "SSC",
  "Banking",
  "Railway",
  "UPSC",
  "Police/Defense",
  "Teaching",
  "JEE/NEET",
  "Insurance",
  "State Exams",
  "CUET"
];

const NOTIFICATION_MESSAGES = [
  {
    title: "Mock Tests Aren't Just Practice, They're the Secret to Selection!",
    body: "Start your Test Series today, check your rank, and eliminate your weak spots. 📈"
  },
  {
    title: "Know Where You Stand!",
    body: "Take daily/weekly mock tests, get a real exam experience, and boost your percentile."
  },
  {
    title: "Stop Fearing the Final Exam—Master It Today!",
    body: "Turn exam pressure into peak performance with real-time test analysis and national ranking."
  }
];

function NotificationPopup() {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissed = typeof window !== 'undefined' && localStorage.getItem('notification_dismissed');
    if (dismissed === 'true') return;
    
    setIsDismissed(false);
    const initialTimer = setTimeout(() => setIsVisible(true), 3000);

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % NOTIFICATION_MESSAGES.length);
        setIsVisible(true);
      }, 600);
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('notification_dismissed', 'true');
    setTimeout(() => setIsDismissed(true), 700);
  };

  if (isDismissed) return null;

  return (
    <div className={cn(
      "fixed bottom-6 left-6 z-[60] max-w-[320px] md:max-w-sm transition-all duration-700 transform no-print",
      isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
    )}>
       <Card className="border-l-4 border-l-primary shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden bg-white/95 backdrop-blur-md border-slate-100">
          <CardContent className="p-5">
             <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                   <Trophy className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                   <p className="text-[13px] font-black text-slate-900 leading-tight">
                      {NOTIFICATION_MESSAGES[index].title}
                   </p>
                   <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {NOTIFICATION_MESSAGES[index].body}
                   </p>
                </div>
                <button onClick={handleClose} className="text-slate-300 hover:text-slate-600 transition-colors shrink-0 self-start">
                   <XCircle className="h-4 w-4" />
                </button>
             </div>
          </CardContent>
          <div className="h-1 bg-slate-100 w-full overflow-hidden">
             <div className={cn("h-full bg-primary/30", isVisible ? "w-full transition-all duration-[30000ms] ease-linear" : "w-0")} />
          </div>
       </Card>
    </div>
  );
}

export default function GlobalExamsPortal() {
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [resultLookup, setResultLookup] = useState({ name: '', mobile: '' });
  const [lookupError, setLookupError] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) initiateAnonymousSignIn(auth);
  }, [user, isUserLoading, auth]);

  const configRef = useMemoFirebase(() => db ? doc(db, 'platformConfig', 'settings') : null, [db]);
  const { data: config } = useDoc(configRef);
  const platformLogoUrl = config?.platformLogoUrl || null;

  const examsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'exams'), where('isAdminExam', '==', true));
  }, [db, user]);
  const { data: exams, isLoading: isDataLoading } = useCollection(examsQuery);

  const isLoading = isUserLoading || isDataLoading;

  // Calculate concluded exams (Results Out)
  const concludedExams = useMemo(() => {
    if (!exams) return [];
    const now = new Date();
    return exams.filter(e => e.status === 'Active' && now > new Date(e.endTime))
                .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
  }, [exams]);

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number, new: number }> = {};
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Initialize stats
    CATEGORIES.forEach(cat => {
      stats[cat] = { total: 0, new: 0 };
    });

    if (!exams) return stats;

    let totalActive = 0;
    let totalNew = 0;

    exams.forEach(e => {
      if (e.status !== 'Active') return;
      
      const category = e.category || 'Other';
      const createdDate = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
      const isNew = createdDate >= sevenDaysAgo;

      totalActive++;
      if (isNew) totalNew++;

      if (stats[category]) {
        stats[category].total++;
        if (isNew) stats[category].new++;
      } else {
        // Handle categories not in the pre-defined list
        stats[category] = { total: 1, new: isNew ? 1 : 0 };
      }
    });

    stats["All"] = { total: totalActive, new: totalNew };
    return stats;
  }, [exams]);

  const filteredExams = useMemo(() => {
    if (!exams) return [];
    return exams.filter(e => {
      if (e.status !== 'Active') return false;
      const matchesSearch = e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           e.subject?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || e.category === activeCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [exams, searchTerm, activeCategory]);

  const handleResultLookup = async () => {
    if (!db || !resultLookup.name || !resultLookup.mobile || !selectedExamId) return;
    setIsLookingUp(true);
    setLookupError('');
    try {
      const q = query(
        collection(db, 'exam_attempts'),
        where('examId', '==', selectedExamId),
        where('studentName', '==', resultLookup.name.trim()),
        where('studentMobileNumber', '==', resultLookup.mobile.trim()),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const attempt = snap.docs[0].data();
        toast({ title: "Evaluation Found" });
        window.open(`/exam/${attempt.examId}/result?attempt=${snap.docs[0].id}`, '_blank');
        setIsResultOpen(false);
      } else {
        setLookupError("Invalid details. No matching record found for this exam.");
      }
    } catch (err) {
      setLookupError("Service busy. Try again later.");
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body">
      <header className="h-20 bg-white border-b px-4 md:px-12 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <Link href="/" className="flex items-center gap-3">
          {platformLogoUrl ? (
            <img src={platformLogoUrl} alt="Platform Logo" className="h-8 md:h-10 w-auto object-contain" />
          ) : (
            <>
              <div className="bg-primary p-2 rounded-xl text-white shadow-lg"><Shield className="h-6 w-6" /></div>
              <span className="font-headline font-bold text-xl md:text-2xl text-slate-900 tracking-tight">Test Series Portal</span>
            </>
          )}
        </Link>
        <Button variant="ghost" className="font-bold text-primary gap-2" onClick={() => { setSelectedExamId(null); setIsResultOpen(true); }}>
           <Trophy className="h-4 w-4" /> Search Result
        </Button>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 md:py-16 space-y-12">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge className="bg-primary/10 text-primary font-black px-6 py-2 rounded-full text-[10px] tracking-[0.2em] uppercase mx-auto">Verified Board Content</Badge>
          <h1 className="text-4xl md:text-7xl font-headline font-bold tracking-tight text-slate-900 leading-[1.1]">
            Prepare for Your Success with <span className="text-primary">Mock Tests</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">Take high-quality exams, get your national rank, and improve your score today.</p>
        </div>

        <div className="max-w-6xl mx-auto space-y-10">
          <div className="relative group w-full">
            <Search className="absolute left-6 top-5 h-6 w-6 text-slate-300" />
            <Input 
               placeholder="Search exams (e.g. CGL Tier 1)..." 
               className="h-16 pl-16 rounded-[2rem] text-lg font-medium bg-white border-none shadow-2xl"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-6 no-scrollbar scroll-smooth">
             {CATEGORIES.map((cat) => {
               const stats = categoryStats[cat] || { total: 0, new: 0 };
               const isActive = activeCategory === cat;
               
               return (
                 <Button
                   key={cat}
                   onClick={() => setActiveCategory(cat)}
                   variant={isActive ? 'default' : 'outline'}
                   className={cn(
                     "rounded-full h-12 px-6 font-bold uppercase text-[10px] tracking-widest shrink-0 transition-all gap-2 relative",
                     isActive ? "shadow-xl" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                   )}
                 >
                   <span>{cat}</span>
                   <Badge className={cn(
                     "h-5 px-1.5 rounded-md text-[9px] font-black min-w-[20px]",
                     isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                   )}>
                     {stats.total}
                   </Badge>
                   {stats.new > 0 && (
                     <div className="absolute -top-1 -right-1 flex items-center justify-center">
                        <div className="absolute h-3 w-3 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                        <Badge className="bg-emerald-50 text-white text-[7px] h-4 px-1 px-1.5 border-2 border-white leading-none">NEW</Badge>
                     </div>
                   )}
                 </Button>
               );
             })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {isLoading ? (
               Array.from({length: 3}).map((_, i) => <div key={i} className="h-[450px] bg-slate-200 animate-pulse rounded-[3rem]" />)
            ) : filteredExams.length > 0 ? (
              filteredExams.map((exam) => {
                const isOngoing = new Date() >= new Date(exam.startTime) && new Date() <= new Date(exam.endTime);
                const isOver = new Date() > new Date(exam.endTime);
                
                return (
                  <Card key={exam.id} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col">
                    <div className="aspect-[16/9] w-full relative bg-slate-100 overflow-hidden">
                       <img 
                         src={exam.posterUrl || getCategoryImage(exam.category)} 
                         alt={exam.title} 
                         className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                         referrerPolicy="no-referrer"
                       />
                       <div className="absolute top-4 left-4 flex flex-col gap-2">
                          <Badge className="bg-white/90 backdrop-blur-sm text-primary font-black text-[9px] px-3 h-6 uppercase">{exam.category}</Badge>
                          <Badge variant="outline" className="bg-slate-900/80 text-white font-black text-[8px] px-3 h-5 uppercase border-none">{exam.subject}</Badge>
                       </div>
                       <div className="absolute top-4 right-4 z-10">
                          {isOngoing ? <Badge className="bg-emerald-600 text-white font-black text-[9px] h-6 animate-pulse shadow-lg">LIVE NOW</Badge> : 
                          isOver ? <Badge variant="secondary" className="bg-slate-200 text-slate-600 font-black text-[9px] h-6">CONCLUDED</Badge> : 
                          <Badge className="bg-blue-50 text-white font-black text-[9px] h-6">UPCOMING</Badge>}
                       </div>
                    </div>

                    <CardHeader className="p-6 pb-2">
                       <CardTitle className="text-xl font-headline font-bold text-slate-900 leading-tight line-clamp-2">{exam.title}</CardTitle>
                       <div className="pt-2 flex flex-wrap gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-primary" /> {exam.durationMinutes} MIN</span>
                          <span className="flex items-center gap-1.5"><ListChecks className="h-3 w-3 text-primary" /> {exam.totalQuestions} QS</span>
                       </div>
                    </CardHeader>

                    <CardContent className="p-6 pt-2 flex-1 space-y-4">
                       {exam.sectionSummary && (
                         <div className="p-4 bg-slate-50 rounded-2xl border border-dashed space-y-3">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paper Structure:</p>
                            <div className="grid grid-cols-2 gap-3">
                               {exam.sectionSummary.map((s: any, idx: number) => (
                                 <div key={idx} className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-700 truncate">{s.name}</span>
                                    <span className="text-[9px] text-slate-400">{s.questionCount} Qs • {s.totalMarks} Marks</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}

                       <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2">
                             <div className="p-1.5 rounded-lg bg-white shadow-sm text-primary"><CalendarDays className="h-3.5 w-3.5" /></div>
                             <span className="text-[9px] font-bold text-slate-500 uppercase">Starts</span>
                          </div>
                          <span className="text-xs font-black text-slate-900">{new Date(exam.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                       </div>
                    </CardContent>

                    <CardFooter className="p-6 pt-0 gap-2">
                       {isOver ? (
                          <Button variant="outline" className="w-full h-12 rounded-2xl font-black text-primary border-2 hover:bg-primary/5" onClick={() => { setSelectedExamId(exam.id); setIsResultOpen(true); }}>
                             <Trophy className="h-4 w-4 mr-2" /> Results Published
                          </Button>
                       ) : (
                          <Link href={`/exam/${exam.id}`} className="w-full">
                            <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 group">
                               {exam.isPaid ? `Pay ₹${exam.price} & Join` : 'Enroll Free'} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                       )}
                    </CardFooter>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full py-24 text-center space-y-6 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                <Globe className="h-16 w-16 text-slate-100 mx-auto" />
                <h3 className="text-2xl font-black text-slate-900">No matching series found</h3>
              </div>
            )}
          </div>
        </div>
      </main>

      <NotificationPopup />

      <Dialog open={isResultOpen} onOpenChange={setIsResultOpen}>
         <DialogContent className="max-w-[95vw] md:max-w-lg rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-slate-900 p-8 text-white text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><Trophy className="h-32 w-32 text-primary" /></div>
               <DialogTitle className="text-2xl font-headline font-bold relative z-10">Series Scorecard</DialogTitle>
               <DialogDescription className="text-slate-400 relative z-10">Get your board-verified performance analysis.</DialogDescription>
            </div>
            
            <div className="p-6 md:p-8 space-y-6 bg-white">
               {!selectedExamId ? (
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latest Results Out:</p>
                    <ScrollArea className="h-[280px] w-full rounded-2xl border bg-slate-50/50 p-2">
                       {concludedExams.length > 0 ? (
                         <div className="space-y-2">
                           {concludedExams.map(e => (
                             <button 
                               key={e.id}
                               onClick={() => setSelectedExamId(e.id)}
                               className="w-full p-4 bg-white border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center justify-between group"
                             >
                               <div>
                                 <p className="font-bold text-sm text-slate-900 leading-tight line-clamp-1">{e.title}</p>
                                 <p className="text-[9px] font-black text-slate-400 uppercase mt-1">{e.category} • {e.subject}</p>
                               </div>
                               <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                             </button>
                           ))}
                         </div>
                       ) : (
                         <div className="py-20 text-center space-y-2">
                            <Info className="h-8 w-8 text-slate-200 mx-auto" />
                            <p className="text-xs font-bold text-slate-400 uppercase">No concluded exams yet</p>
                         </div>
                       )}
                    </ScrollArea>
                 </div>
               ) : (
                 <div className="space-y-6 animate-in zoom-in-95">
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                       <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                          <div className="space-y-0.5">
                             <p className="text-[8px] font-black text-emerald-600 uppercase">Exam Selected</p>
                             <p className="text-xs font-bold text-emerald-900 leading-tight truncate max-w-[200px]">
                                {exams?.find(e => e.id === selectedExamId)?.title}
                             </p>
                          </div>
                       </div>
                       <Button variant="ghost" size="sm" className="text-[9px] font-black text-emerald-600 hover:bg-emerald-100" onClick={() => setSelectedExamId(null)}>CHANGE</Button>
                    </div>

                    <div className="space-y-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Candidate Name</Label>
                          <Input placeholder="Enter full name" value={resultLookup.name} onChange={(e) => setResultLookup({...resultLookup, name: e.target.value})} className="h-12 rounded-xl" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Number</Label>
                          <Input placeholder="10-digit number" value={resultLookup.mobile} onChange={(e) => setResultLookup({...resultLookup, mobile: e.target.value})} className="h-12 rounded-xl" />
                       </div>
                       {lookupError && <p className="text-xs font-bold text-red-500 text-center bg-red-50 py-2 rounded-lg border border-red-100">{lookupError}</p>}
                       <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 mt-4" onClick={handleResultLookup} disabled={isLookingUp}>
                          {isLookingUp ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : 'Get Evaluation'}
                       </Button>
                    </div>
                 </div>
               )}
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
