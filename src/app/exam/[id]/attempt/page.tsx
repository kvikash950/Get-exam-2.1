
"use client";

import { useState, useEffect, Suspense, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock, 
  Shield, 
  Flag, 
  Check, 
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Video,
  CameraOff,
  AlertTriangle,
  Lock,
  Loader2,
  Timer,
  MessageCircle,
  Send,
  HelpCircle,
  Fingerprint,
  BookOpen,
  Hash,
  MonitorCheck,
  Maximize,
  ShieldAlert,
  Smartphone,
  Users,
  Eye,
  ScanSearch,
  LockKeyhole,
  RotateCcw,
  LayoutGrid,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { 
  useDoc, 
  useCollection, 
  useFirestore, 
  useMemoFirebase, 
  setDocumentNonBlocking, 
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useUser,
  useAuth,
  initiateAnonymousSignIn,
  addDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from '@/hooks/use-toast';

function shuffleArray(array: any[]) {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function PaletteShape({ status, number, active, onClick }: { status: any; number: number; active: boolean; onClick: () => void }) {
  const base = "relative h-10 w-10 flex items-center justify-center text-xs font-bold transition-all focus:outline-none shrink-0";
  const ring = active ? "ring-2 ring-primary ring-offset-2 scale-110" : "";

  if (status === 'answered') return (
    <button onClick={onClick} className={cn(base, ring)}>
      <svg viewBox="0 0 40 40" className="absolute inset-0 fill-green-600"><path d="M 0,10 L 20,0 L 40,10 L 40,40 L 0,40 Z" /></svg>
      <span className="relative text-white">{number}</span>
    </button>
  );

  if (status === 'notAnswered') return (
    <button onClick={onClick} className={cn(base, ring)}>
      <svg viewBox="0 0 40 40" className="absolute inset-0 fill-orange-600"><path d="M 0,0 L 40,0 L 40,30 L 20,40 L 0,30 Z" /></svg>
      <span className="relative text-white">{number}</span>
    </button>
  );

  if (status === 'marked') return (
    <button onClick={onClick} className={cn(base, ring, "bg-purple-600 rounded-full text-white")}>{number}</button>
  );

  if (status === 'answeredMarked') return (
    <button onClick={onClick} className={cn(base, ring, "bg-purple-600 rounded-full text-white")}>
      {number}
      <Check className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-green-500 rounded-full p-0.5 border border-white" />
    </button>
  );

  return (
    <button onClick={onClick} className={cn(base, ring, "bg-slate-100 border rounded-md text-slate-600")}>{number}</button>
  );
}

function ProctorFeed({ stream, proctoringStatus, isMobile = false }: { stream: MediaStream | null, proctoringStatus: string, isMobile?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => console.warn("Video play failed:", err));
    }
  }, [stream]);

  if (isMobile) {
    return (
      <div className="fixed bottom-24 right-4 z-[40] w-24 md:hidden">
        <Card className="overflow-hidden border-2 border-primary/20 shadow-2xl bg-slate-900 aspect-video p-0">
          {stream ? (
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          ) : (
            <div className="h-full flex items-center justify-center"><CameraOff className="h-4 w-4 text-white/30" /></div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-2 border-primary/20 shadow-lg bg-slate-900 text-white p-0">
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        {stream ? (
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-50"><CameraOff className="h-8 w-8" /><span className="text-[8px] uppercase font-bold tracking-widest text-center px-4">Feed Offline</span></div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 z-20">
          <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", proctoringStatus === 'Monitoring' ? "bg-green-500" : "bg-red-500")} />
          <span className="text-[8px] font-black uppercase tracking-widest">Vision Guard™</span>
        </div>
      </div>
    </Card>
  );
}

export default function AttemptContent() {
  const { id: examId } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  
  const rollNumber = searchParams.get('roll') || 'unknown';
  const studentName = searchParams.get('name') || 'Student';
  const attemptDocId = `${examId}_${rollNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  const [isInitialized, setIsInitialized] = useState(false);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [proctoringStatus, setProctoringStatus] = useState<string>('Monitoring');
  const [violationCount, setViolationCount] = useState(0);
  const violationCountRef = useRef(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [visited, setVisited] = useState<Record<number, boolean>>({ 0: true });
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const isSubmittingRef = useRef(false);

  const [isDoubtOpen, setIsDoubtOpen] = useState(false);
  const [doubtText, setDoubtText] = useState('');
  const [isDoubtSubmitting, setIsDoubtSubmitting] = useState(false);

  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) initiateAnonymousSignIn(auth);
  }, [user, isUserLoading, auth]);

  const examQuery = useMemoFirebase(() => db && examId && user ? doc(db, 'exams', examId) : null, [db, examId, user]);
  const { data: exam } = useDoc(examQuery);

  const attemptQuery = useMemoFirebase(() => db && attemptDocId && user ? doc(db, 'exam_attempts', attemptDocId) : null, [db, attemptDocId, user]);
  const { data: attempt } = useDoc(attemptQuery);

  const questionsQuery = useMemoFirebase(() => db && examId && user ? query(collection(db, 'exams', examId, 'questions')) : null, [db, examId, user]);
  const { data: questions } = useCollection(questionsQuery);

  const logViolation = useCallback((type: string) => {
    if (!db) return;
    const attemptRef = doc(db, 'exam_attempts', attemptDocId);
    updateDocumentNonBlocking(attemptRef, {
      securityViolationsCount: arrayUnion({ type, timestamp: new Date().toISOString() }),
      updatedAt: serverTimestamp()
    });
  }, [db, attemptDocId]);

  const handleAutoSubmit = useCallback((reason: string = 'TimerExpired') => {
    if (!db || shuffledQuestions.length === 0 || !exam || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    
    let earnedScore = 0, totalMaxScore = 0, correctCount = 0, wrongCount = 0, attemptedCount = 0;
    const secAnal: any = {};

    shuffledQuestions.forEach((q) => {
      const sec = q.sectionName || 'General';
      const qMarks = Number(q.marks) || 1;
      totalMaxScore += qMarks;
      if (!secAnal[sec]) secAnal[sec] = { total: 0, correct: 0, attempted: 0, marksTotal: 0, marksEarned: 0 };
      secAnal[sec].total++;
      secAnal[sec].marksTotal += qMarks;
      
      const ans = answers[q.id];
      if (ans) {
        attemptedCount++; 
        secAnal[sec].attempted++;
        if (ans === q.correctAnswerForSingleChoice) { 
          correctCount++; earnedScore += qMarks; secAnal[sec].marksEarned += qMarks;
        } else {
          wrongCount++; if (exam.negativeMarkingEnabled) earnedScore -= (Number(exam.negativeMarkingValue) || 0);
        }
      }
    });

    const percentage = parseFloat(((earnedScore / totalMaxScore) * 100).toFixed(2));
    const finalIntegrity = Math.max(0, 100 - (violationCountRef.current * 15));

    updateDocumentNonBlocking(doc(db, 'exam_attempts', attemptDocId), {
      status: 'Submitted',
      submissionReason: reason,
      submittedAt: serverTimestamp(),
      score: parseFloat(earnedScore.toFixed(2)),
      maxScore: totalMaxScore,
      percentageScore: percentage,
      totalQuestionsAttempted: attemptedCount,
      correctAnswersCount: correctCount,
      wrongAnswersCount: wrongCount,
      sectionAnalytics: secAnal,
      securityReport: {
        integrityScore: finalIntegrity,
        tabSwitchCount: violationCountRef.current,
        mobileDetected: reason.includes('Mobile'),
        multiPersonIncident: reason.includes('MultiPerson')
      },
      updatedAt: serverTimestamp()
    });

    if (activeStream) activeStream.getTracks().forEach(track => track.stop());
    if (document.fullscreenElement) {
       document.exitFullscreen().catch(() => {});
    } else if ((document as any).webkitFullscreenElement) {
       (document as any).webkitExitFullscreen();
    }
    
    toast({ title: "Assessment Submitted" });
    setTimeout(() => router.push(`/exam/${examId}/result?attempt=${attemptDocId}`), 500);
  }, [db, attemptDocId, shuffledQuestions, exam, answers, examId, router, activeStream, toast]);

  useEffect(() => {
    let isMounted = true;
    const initCamera = async () => {
      if (!exam?.videoProctoringEnabled || !isInitialized || activeStream) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (isMounted) setActiveStream(stream);
      } catch (err) {
        if (isMounted) toast({ variant: "destructive", title: "Camera Required" });
      }
    };
    initCamera();
    return () => { isMounted = false; };
  }, [exam?.videoProctoringEnabled, isInitialized, activeStream, toast]);

  useEffect(() => {
    if (!isInitialized || !activeStream || isSubmittingRef.current || !db) return;

    const canvas = document.createElement('canvas');
    const video = document.createElement('video');
    video.srcObject = activeStream;
    video.play().catch(console.warn);

    const heartbeatInterval = setInterval(() => {
      if (isSubmittingRef.current) return;

      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const snapshot = canvas.toDataURL('image/jpeg', 0.5);

        const attemptRef = doc(db, 'exam_attempts', attemptDocId);
        updateDocumentNonBlocking(attemptRef, {
          lastSeen: new Date().toISOString(),
          latestSnapshot: snapshot,
          proctoringStatus: proctoringStatus,
          updatedAt: serverTimestamp()
        });
      }
    }, 15000); 

    return () => clearInterval(heartbeatInterval);
  }, [isInitialized, activeStream, db, attemptDocId, proctoringStatus]);

  useEffect(() => {
    if (!isInitialized) return;
    
    const handleFullscreenChange = () => {
      const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement);
      setIsFullscreen(isFull);
      if (!isFull && !isSubmittingRef.current) {
        const next = violationCountRef.current + 1;
        violationCountRef.current = next; setViolationCount(next);
        logViolation('FullscreenExit');
        if (next >= 2) handleAutoSubmit('SecurityBreach_FullscreenExit');
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmittingRef.current) {
        const next = violationCountRef.current + 1;
        violationCountRef.current = next; setViolationCount(next);
        logViolation(`TabSwitch_${next}`);
        setProctoringStatus('Tab Switch Detected');
        if (next >= 2) handleAutoSubmit('SecurityBreach_TabSwitch');
      } else {
        setProctoringStatus('Monitoring');
      }
    };

    const preventExit = (e: BeforeUnloadEvent) => {
      if (!isSubmittingRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const preventClipboard = (e: ClipboardEvent) => e.preventDefault();
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    
    // Attempt to block back navigation by pushing a state
    history.pushState(null, '', window.location.href);
    const handlePopState = () => {
       history.pushState(null, '', window.location.href);
       toast({ title: "Navigation Blocked", description: "You cannot navigate away during the exam." });
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', preventExit);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('copy', preventClipboard);
    document.addEventListener('cut', preventClipboard);
    document.addEventListener('paste', preventClipboard);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', preventExit);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('copy', preventClipboard);
      document.removeEventListener('cut', preventClipboard);
      document.removeEventListener('paste', preventClipboard);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isInitialized, handleAutoSubmit, logViolation]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentNow = new Date(); setNow(currentNow);
      if (!isSubmittingRef.current && exam && isInitialized) {
        const currentQId = shuffledQuestions[currentIdx]?.id;
        if (currentQId) {
          setQuestionTimes(prev => ({ ...prev, [currentQId]: (prev[currentQId] || 0) + 1 }));
          setDocumentNonBlocking(doc(db, 'exam_attempts', attemptDocId, 'student_answers', currentQId), {
            timeSpentSeconds: (questionTimes[currentQId] || 0) + 1,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }
    }, 1000); 
    return () => clearInterval(interval);
  }, [shuffledQuestions, currentIdx, exam, db, attemptDocId, isInitialized, questionTimes]);

  useEffect(() => {
    if (exam && now && isInitialized) {
      const examDurationMinutes = Number(exam.durationMinutes || exam.timeLimitMinutes || 60);
      
      let attemptStartTime = now.getTime();
      if (attempt?.startedAt) {
        if (typeof attempt.startedAt.toDate === 'function') {
           attemptStartTime = attempt.startedAt.toDate().getTime();
        } else if (attempt.startedAt.seconds) {
           attemptStartTime = attempt.startedAt.seconds * 1000;
        } else if (typeof attempt.startedAt === 'string' || typeof attempt.startedAt === 'number') {
           attemptStartTime = new Date(attempt.startedAt).getTime();
        }
      }

      const attemptEndTime = attemptStartTime + (examDurationMinutes * 60 * 1000);
      let effectiveEndTime = attemptEndTime;
      
      if (exam.endTime) {
        const examEndTime = new Date(exam.endTime).getTime();
        if (!isNaN(examEndTime)) {
          effectiveEndTime = Math.min(examEndTime, attemptEndTime);
        }
      }
      
      // If end time is reached, submit for everyone immediately
      const remainingSeconds = Math.max(0, Math.floor((effectiveEndTime - now.getTime()) / 1000));
      
      setTimeLeft(remainingSeconds);
      
      if (remainingSeconds <= 0 && !isSubmittingRef.current) {
        handleAutoSubmit('TimeExpired');
      }
    }
  }, [exam, attempt, now, handleAutoSubmit, isInitialized]);

  useEffect(() => {
    if (questions?.length && shuffledQuestions.length === 0) setShuffledQuestions(shuffleArray(questions));
  }, [questions, shuffledQuestions.length]);

  const handleAnswerSelect = (qid: string, ans: string) => {
    if (!user || !exam || isSubmittingRef.current) return;
    setAnswers(p => ({ ...p, [qid]: ans }));
    setDocumentNonBlocking(doc(db, 'exam_attempts', attemptDocId, 'student_answers', qid), { 
      id: qid, 
      responseTextSingleChoice: ans, 
      questionId: qid, 
      examId, 
      examAttemptId: attemptDocId, 
      timeSpentSeconds: questionTimes[qid] || 0, 
      updatedAt: serverTimestamp() 
    }, { merge: true });
  };

  const handleClearResponse = () => {
    const qid = shuffledQuestions[currentIdx].id;
    if (!qid || !db) return;
    setAnswers(prev => { const next = { ...prev }; delete next[qid]; return next; });
    deleteDocumentNonBlocking(doc(db, 'exam_attempts', attemptDocId, 'student_answers', qid));
  };

  const handleSaveAndNext = () => {
    if (currentIdx + 1 < shuffledQuestions.length) {
      setCurrentIdx(currentIdx + 1);
      setVisited(p => ({ ...p, [currentIdx + 1]: true }));
    } else {
      toast({ title: "End of Question Set" });
    }
  };

  const handleRaiseDoubt = async () => {
    if (!doubtText.trim() || !db || !user || !exam) return;
    setIsDoubtSubmitting(true);
    try {
      addDocumentNonBlocking(collection(db, 'doubts'), {
        examId, studentUserId: user.uid, studentName, studentRollNumber: rollNumber,
        message: doubtText, status: 'Pending', coachingCenterId: exam.coachingCenterId, createdAt: serverTimestamp(),
      });
      toast({ title: "Doubt Dispatched" });
      setDoubtText(''); setIsDoubtOpen(false);
    } finally { setIsDoubtSubmitting(false); }
  };

  const handleStartExam = async () => {
    try {
      const docEl = document.documentElement;
      
      // Attempt standard fullscreen
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if ((docEl as any).webkitRequestFullscreen) {
        (docEl as any).webkitRequestFullscreen();
      } else if ((docEl as any).msRequestFullscreen) {
        (docEl as any).msRequestFullscreen();
      }
      
      // Attempt to lock orientation if possible (some browsers allow this in fullscreen)
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('portrait').catch(() => {});
      }

      setIsFullscreen(true);
      setIsInitialized(true);
    } catch (err) {
      console.warn("Fullscreen request failed or restricted:", err);
      // Proceed even if fullscreen fails, but the user is warned
      setIsInitialized(true);
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    }
  };

  const stats = useMemo(() => {
    const total = shuffledQuestions.length;
    const answered = Object.keys(answers).length;
    const marked = Object.values(flagged).filter(v => v).length;
    const notAnswered = total - answered;
    return { total, answered, marked, notAnswered };
  }, [shuffledQuestions, answers, flagged]);

  if (!exam || shuffledQuestions.length === 0 || !now || !user) return <div className="h-screen flex items-center justify-center font-bold">Synchronizing Session...</div>;

  if (!isInitialized) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <Card className="max-w-md border-none shadow-2xl rounded-[3rem] p-10 space-y-8 bg-slate-900 text-white">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary border border-primary/20"><LockKeyhole className="h-10 w-10" /></div>
          <h2 className="text-3xl font-headline font-bold">Secure Access</h2>
          <p className="text-slate-400 font-medium">Activate Vision Guard™ to start your assessment. Full-screen mode is mandatory for security.</p>
          <Button onClick={handleStartExam} className="w-full h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/30">Activate & Start</Button>
        </Card>
      </div>
    );
  }

  const currentQ = shuffledQuestions[currentIdx];

  const PaletteGrid = () => (
    <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
      {shuffledQuestions.map((q, idx) => {
        let status = answers[q.id] ? 'answered' : visited[idx] ? 'notAnswered' : 'notVisited';
        if (flagged[idx]) status = answers[q.id] ? 'answeredMarked' : 'marked';
        return <PaletteShape key={idx} status={status} number={idx+1} active={currentIdx === idx} onClick={() => { setCurrentIdx(idx); setVisited(p => ({...p, [idx]: true})); }} />;
      })}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden select-none">
      {!isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center p-6 text-center">
           <Card className="max-w-md border-none shadow-2xl rounded-[3rem] p-10 space-y-8 bg-slate-900 text-white">
             <ShieldAlert className="h-16 w-16 text-red-500 mx-auto animate-pulse" />
             <h2 className="text-3xl font-headline font-bold text-white">Security Alert</h2>
             <p className="text-slate-400">Please enable Full-Screen mode to proceed. For security, switching apps or leaving this screen is restricted. Please ensure your browser has permission to enter full-screen mode.</p>
             <Button onClick={handleStartExam} className="w-full h-14 rounded-2xl font-black bg-red-600">Restore Full-Screen</Button>
           </Card>
        </div>
      )}

      <header className="h-14 bg-white border-b px-3 md:px-4 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <Shield className="text-primary h-5 w-5" />
          <div className="flex flex-col">
            <h1 className="font-bold text-[10px] md:text-xs truncate max-w-[100px] md:max-w-[200px] text-primary uppercase">{exam.title}</h1>
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter lg:hidden">Vision Guard Active</span>
          </div>
          <Badge className="hidden md:flex bg-slate-900 text-white font-black text-[9px] px-3">VISION GUARD ACTIVE</Badge>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className={cn("font-mono text-xs md:text-base font-bold bg-primary/5 px-2 md:px-3 py-1 rounded-full text-primary border flex items-center gap-1.5 md:gap-2", timeLeft !== null && timeLeft < 60 && "bg-red-50 text-red-600 border-red-200 animate-pulse")}>
            <Timer className="h-3.5 w-3.5 md:h-4 w-4" />
            {timeLeft !== null ? `${Math.floor(timeLeft/60).toString().padStart(2,'0')}:${(timeLeft%60).toString().padStart(2,'0')}` : '--:--'}
          </div>
          <Button variant="destructive" size="sm" className="font-black h-8 md:h-9 px-3 md:px-6 text-[10px] md:text-sm" onClick={() => setIsSubmitConfirmOpen(true)}>FINISH</Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row p-2 md:p-6 gap-6 overflow-hidden max-w-[1600px] mx-auto w-full relative">
        <main className="flex-1 flex flex-col gap-2 md:gap-4 overflow-hidden">
          <Card className="flex-1 flex flex-col overflow-hidden shadow-2xl border-none rounded-xl md:rounded-2xl bg-white">
            <CardHeader className="border-b py-2 px-3 md:px-4 flex flex-row items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-white font-black h-6 w-10 flex items-center justify-center text-[10px]">Q.{currentIdx+1}</Badge>
                {currentQ.sectionName && <Badge variant="outline" className="text-[8px] md:text-[10px] font-bold h-6 truncate max-w-[80px] md:max-w-none">{currentQ.sectionName}</Badge>}
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <Dialog open={isDoubtOpen} onOpenChange={setIsDoubtOpen}>
                  <DialogTrigger asChild><Button variant="ghost" size="sm" className="text-[8px] md:text-[10px] font-black h-7 md:h-8 text-orange-600 gap-1"><HelpCircle className="h-3 w-3 md:h-3.5 w-3.5" /> Doubt</Button></DialogTrigger>
                  <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl max-w-md">
                    <div className="bg-orange-600 p-6 text-white text-center"><DialogHeader><DialogTitle className="text-white text-xl">Raise Doubt</DialogTitle></DialogHeader></div>
                    <div className="p-6 space-y-4"><Textarea placeholder="Explain your doubt..." className="min-h-[120px] rounded-2xl" value={doubtText} onChange={(e) => setDoubtText(e.target.value)} /></div>
                    <DialogFooter className="p-6 pt-0"><Button onClick={handleRaiseDoubt} disabled={isDoubtSubmitting || !doubtText.trim()} className="w-full h-12 rounded-xl bg-orange-600 font-black">DISPATCH</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Sheet>
                   <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="lg:hidden text-[8px] md:text-[10px] font-black h-7 md:h-8 text-primary gap-1"><LayoutGrid className="h-3 w-3" /> Palette</Button>
                   </SheetTrigger>
                   <SheetContent side="right" className="w-[85vw] sm:max-w-md p-6 flex flex-col gap-6">
                      <SheetHeader>
                         <SheetTitle className="text-left font-headline font-bold">Question Palette</SheetTitle>
                      </SheetHeader>
                      <PaletteGrid />
                      <div className="grid grid-cols-2 gap-2 border-t pt-4 mt-auto">
                        <div className="flex items-center gap-2 text-[8px] font-black uppercase"><div className="h-3 w-3 bg-green-600 rounded-sm" /> Answered</div>
                        <div className="flex items-center gap-2 text-[8px] font-black uppercase"><div className="h-3 w-3 bg-orange-600 rounded-sm" /> Not Answered</div>
                        <div className="flex items-center gap-2 text-[8px] font-black uppercase"><div className="h-3 w-3 bg-purple-600 rounded-full" /> Marked</div>
                      </div>
                   </SheetContent>
                </Sheet>

                <Button variant="ghost" size="sm" className={cn("text-[8px] md:text-[10px] font-black h-7 md:h-8 uppercase", flagged[currentIdx] ? "text-purple-600" : "text-slate-500")} onClick={() => setFlagged(p => ({...p, [currentIdx]: !p[currentIdx]}))}>
                  <Flag className="h-3 w-3 mr-1" /> {flagged[currentIdx] ? "MARKED" : "MARK REVIEW"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-3 md:p-12 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar bg-white">
              <div className="space-y-4 md:space-y-6">
                {currentQ.questionImageUrl && <img src={currentQ.questionImageUrl} alt="Context" className="max-w-full md:max-w-xl mx-auto border-2 md:border-4 rounded-lg md:rounded-xl shadow-sm" />}
                <div className="text-base md:text-2xl font-bold text-slate-800 whitespace-pre-wrap leading-relaxed">{currentQ.questionText}</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {currentQ.options?.map((opt: any) => (
                  <Button key={opt.label} variant="outline" className={cn("h-auto p-3 md:p-4 justify-start text-left border-2 rounded-xl transition-all flex items-start gap-3 md:gap-4", answers[currentQ.id] === opt.label ? "border-primary bg-primary/5" : "bg-white border-slate-100")} onClick={() => handleAnswerSelect(currentQ.id, opt.label)}>
                    <span className={cn("w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 mt-0.5", answers[currentQ.id] === opt.label ? "bg-primary text-white" : "bg-slate-100 text-slate-500")}>{opt.label}</span>
                    <div className="flex-1 space-y-2 md:space-y-3">
                       {opt.imageUrl && <img src={opt.imageUrl} className="max-w-[150px] md:max-w-[200px] border rounded-lg" />}
                       <span className="block leading-tight font-bold whitespace-pre-wrap text-sm md:text-base">{opt.text}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t p-2 md:p-5 flex justify-between bg-white items-center gap-2 md:gap-3 shrink-0">
              <div className="flex gap-1 md:gap-2">
                <Button variant="outline" disabled={currentIdx === 0} className="h-10 px-3 md:px-4 font-bold text-xs" onClick={() => setCurrentIdx(currentIdx - 1)}><ChevronLeft className="h-4 w-4 mr-1" /> BACK</Button>
                <Button variant="ghost" className="h-10 px-3 md:px-4 font-bold text-slate-500 text-xs" onClick={handleClearResponse}><RotateCcw className="h-4 w-4 mr-1" /> CLEAR</Button>
              </div>
              <Button className="h-10 px-6 md:px-12 font-black shadow-xl text-xs flex-1 md:flex-none" onClick={handleSaveAndNext}>SAVE & NEXT <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </CardFooter>
          </Card>
        </main>
        
        {/* Desktop Sidebar */}
        <aside className="w-80 hidden lg:flex flex-col gap-4">
          <ProctorFeed stream={activeStream} proctoringStatus={proctoringStatus} />
          <Card className="p-4 flex-1 flex flex-col shadow-lg border-none rounded-2xl bg-white">
             <PaletteGrid />
             <div className="mt-auto pt-4 grid grid-cols-2 gap-2 border-t">
                <div className="flex items-center gap-2 text-[8px] font-black uppercase"><div className="h-3 w-3 bg-green-600 rounded-sm" /> Answered</div>
                <div className="flex items-center gap-2 text-[8px] font-black uppercase"><div className="h-3 w-3 bg-orange-600 rounded-sm" /> Not Answered</div>
                <div className="flex items-center gap-2 text-[8px] font-black uppercase"><div className="h-3 w-3 bg-purple-600 rounded-full" /> Marked</div>
             </div>
          </Card>
        </aside>

        {/* Mobile Proctor Feed Overlay */}
        <ProctorFeed stream={activeStream} proctoringStatus={proctoringStatus} isMobile={true} />
      </div>

      <Dialog open={isSubmitConfirmOpen} onOpenChange={setIsSubmitConfirmOpen}>
         <DialogContent className="max-w-[95vw] md:max-w-lg rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="p-6 md:p-8 space-y-6 bg-white">
               <div className="space-y-2">
                  <DialogTitle className="text-2xl md:text-3xl font-headline font-bold text-slate-900 tracking-tight">Submit your exam?</DialogTitle>
                  <DialogDescription className="text-slate-500 font-medium">Once you submit, your answers are final and you'll see your result.</DialogDescription>
               </div>

               <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="p-4 md:p-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col gap-1">
                     <p className="text-[8px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest">ANSWERED</p>
                     <p className="text-2xl md:text-4xl font-black text-emerald-700">{stats.answered}</p>
                  </div>
                  <div className="p-4 md:p-6 rounded-2xl bg-rose-50 border border-rose-100 flex flex-col gap-1">
                     <p className="text-[8px] md:text-[10px] font-black text-rose-600 uppercase tracking-widest">NOT ANSWERED</p>
                     <p className="text-2xl md:text-4xl font-black text-rose-700">{stats.notAnswered}</p>
                  </div>
                  <div className="p-4 md:p-6 rounded-2xl bg-purple-50 border border-purple-100 flex flex-col gap-1">
                     <p className="text-[8px] md:text-[10px] font-black text-purple-600 uppercase tracking-widest">MARKED</p>
                     <p className="text-2xl md:text-4xl font-black text-purple-700">{stats.marked}</p>
                  </div>
                  <div className="p-4 md:p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                     <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">TOTAL</p>
                     <p className="text-2xl md:text-4xl font-black text-slate-700">{stats.total}</p>
                  </div>
               </div>
            </div>

            <DialogFooter className="bg-slate-50/50 p-4 md:p-6 flex flex-row gap-2 md:gap-3 border-t">
               <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl font-bold bg-white text-xs"
                  onClick={() => setIsSubmitConfirmOpen(false)}
               >
                  Keep working
               </Button>
               <Button 
                  className="flex-1 h-12 rounded-xl font-black bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 text-xs"
                  onClick={() => handleAutoSubmit('ManualSubmit')}
               >
                  Submit exam
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
