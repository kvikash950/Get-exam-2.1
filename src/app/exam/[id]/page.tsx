
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Clock, 
  AlertCircle, 
  Video, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  User,
  Info,
  ScrollText,
  Timer,
  Smartphone,
  Calendar,
  Fingerprint,
  Mail,
  ArrowRight,
  Lock,
  ListChecks,
  Zap,
  AlertTriangle,
  CreditCard,
  QrCode,
  ShieldCheck,
  Globe,
  Wallet
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useDoc, useFirestore, useCollection, useMemoFirebase, useUser, useAuth, initiateAnonymousSignIn, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, serverTimestamp, getDocs, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getCategoryImage } from '@/lib/placeholder-images';

export default function ExamEntryPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [rollNumber, setRollNumber] = useState('');
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [hasAgreed, setHasAgreed] = useState(false);
  
  const [globalReg, setGlobalReg] = useState({ name: '', mobile: '', dob: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'unauthorized' | 'notfound'>('pending');
  const [hasAlreadyAttempted, setHasAlreadyAttempted] = useState(false);
  const [countdownText, setCountdownText] = useState('');

  // Payment State
  const [showPayment, setShowPayment] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) initiateAnonymousSignIn(auth);
  }, [user, isUserLoading, auth]);

  const examRef = useMemoFirebase(() => db && id ? doc(db, 'exams', id) : null, [db, id]);
  const { data: exam, isLoading: examLoading } = useDoc(examRef);

  const paymentConfigRef = useMemoFirebase(() => db ? doc(db, 'platformConfig', 'payments') : null, [db]);
  const { data: payConfig } = useDoc(paymentConfigRef);

  const OWNER_UPI_ID = payConfig?.manualUpiId || '9430214094@okbizaxis'; 
  const OWNER_NAME = payConfig?.manualUpiName || 'Vikash Kumar';

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      if (exam) {
        const start = new Date(exam.startTime);
        const end = new Date(exam.endTime);
        
        if (now < start) {
          const diff = start.getTime() - now.getTime();
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setCountdownText(`Starts in: ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
        } else if (now >= start && now <= end) {
          const diff = end.getTime() - now.getTime();
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setCountdownText(`Closes in: ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
        } else {
          setCountdownText('Registration Closed');
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [exam]);

  const verificationQuery = useMemoFirebase(() => {
    if (!db || !exam || exam.isAdminExam || !rollNumber.trim() || !user) return null;
    return query(
      collection(db, 'coaching_centers', exam.coachingCenterId, 'student_enrollments'),
      where('rollNumber', '==', rollNumber.trim().toUpperCase())
    );
  }, [db, exam, rollNumber, user]);

  const { data: verifiedResults, isLoading: verifyingQuery } = useCollection(verificationQuery);

  const attemptCheckQuery = useMemoFirebase(() => {
    if (!db || !id || !rollNumber.trim() || !user) return null;
    return query(
      collection(db, 'exam_attempts'),
      where('examId', '==', id),
      where('studentRollNumber', '==', rollNumber.trim().toUpperCase())
    );
  }, [db, id, rollNumber, user]);

  const { data: existingAttempts, isLoading: checkingAttempts } = useCollection(attemptCheckQuery);

  useEffect(() => {
    if (exam?.isAdminExam) return;
    if (!rollNumber.trim() || !exam) {
      setVerificationStatus('pending');
      setStudentData(null);
      setHasAlreadyAttempted(false);
      return;
    }
    if (verifyingQuery || checkingAttempts) return;

    if (existingAttempts && existingAttempts.length > 0) {
      setHasAlreadyAttempted(true);
      setVerificationStatus('pending');
      setStudentData(null);
    } else {
      setHasAlreadyAttempted(false);
      if (verifiedResults) {
        const student = verifiedResults[0]; 
        if (!student) {
          setVerificationStatus('notfound');
          setStudentData(null);
        } else {
          setVerificationStatus('verified');
          setStudentData(student);
        }
      }
    }
  }, [rollNumber, verifiedResults, existingAttempts, exam, verifyingQuery, checkingAttempts]);

  const handleGlobalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalReg.name || !globalReg.mobile || !db || isRegistering) return;

    setIsRegistering(true);
    try {
      const checkQ = query(collection(db, 'exam_attempts'), where('examId', '==', id), where('studentMobileNumber', '==', globalReg.mobile.trim()), limit(1));
      const snap = await getDocs(checkQ);
      if (!snap.empty) {
        toast({ variant: "destructive", title: "Already Registered" });
        setIsRegistering(false);
        return;
      }
      const newRoll = `ADM-${id.substring(0,4).toUpperCase()}-${Math.floor(1000+Math.random()*9000)}`;
      setStudentData({ name: globalReg.name, mobile: globalReg.mobile });
      setRollNumber(newRoll);
      
      if (exam?.isPaid) {
        setShowPayment(true);
      } else {
        setVerificationStatus('verified');
      }
      
      toast({ title: "Registration Successful", description: `Assigned Roll: ${newRoll}` });
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.length < 6) {
      toast({ variant: "destructive", title: "Invalid UTR", description: "Please enter a valid Transaction ID." });
      return;
    }
    setVerificationStatus('verified');
    setShowPayment(false);
    toast({ title: "Payment Recorded", description: "You can now proceed to the assessment." });
  };

  const handleOnlinePayment = () => {
    toast({ title: "Payment Initializing", description: `Gateway: ${payConfig?.provider.toUpperCase()}` });
    setTimeout(() => {
       setVerificationStatus('verified');
       setShowPayment(false);
       toast({ title: "Payment Verified", description: "Gateway transaction successful." });
    }, 1500);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationStatus !== 'verified' || !db || !user || !studentData || !hasAgreed) return;

    setLoading(true);
    const attemptDocId = `${id}_${rollNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const duration = Number(exam.durationMinutes || exam.timeLimitMinutes || 60);

    setDocumentNonBlocking(doc(db, 'exam_attempts', attemptDocId), {
      id: attemptDocId,
      examId: id,
      studentUserId: user.uid,
      studentName: studentData.name,
      studentRollNumber: rollNumber.toUpperCase(),
      studentMobileNumber: studentData.mobile || '', 
      coachingCenterId: exam.coachingCenterId,
      coachingCenterOwnerUserId: exam.coachingCenterOwnerUserId || exam.coachingCenterId,
      status: 'Started',
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      durationMinutes: duration,
      timeLimitMinutes: duration,
      paymentUtr: utrNumber || (payConfig?.activeMode === 'automated' ? 'GATEWAY_SUCCESS' : null),
      paymentStatus: (utrNumber || payConfig?.activeMode === 'automated') ? 'Verified' : 'N/A',
      paidAmount: exam.isPaid ? exam.price : 0
    }, { merge: true });

    router.push(`/exam/${id}/attempt?name=${encodeURIComponent(studentData.name)}&roll=${encodeURIComponent(rollNumber)}`);
  };

  if (examLoading || (!user && isUserLoading) || !currentTime) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Shield className="h-12 w-12 text-primary animate-pulse" /></div>;
  if (!exam) return <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl font-bold">Exam Not Found</h1></div>;

  const isExamStarted = currentTime >= new Date(exam.startTime);
  const isExamOver = currentTime > new Date(exam.endTime);

  const upiUrl = `upi://pay?pa=${OWNER_UPI_ID}&pn=${encodeURIComponent(OWNER_NAME)}&am=${exam.price}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 exam-grid py-12">
      <div className="w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="h-8 w-8 text-primary" /><span className="font-headline font-bold text-2xl text-primary">{exam.isAdminExam ? "Global Board Portal" : "Institutional Portal"}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-2xl overflow-hidden rounded-[2rem] bg-white">
              <div className="aspect-[21/9] w-full relative bg-slate-100 overflow-hidden">
                 <img 
                   src={exam.posterUrl || getCategoryImage(exam.category)} 
                   alt={exam.title} 
                   className="w-full h-full object-cover"
                   referrerPolicy="no-referrer"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/10" />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 font-black uppercase text-[9px] tracking-widest">{exam.subject}</Badge>
                  {isExamOver ? <Badge variant="secondary">Concluded</Badge> : isExamStarted ? <Badge className="bg-emerald-600 text-white animate-pulse font-black px-4 h-6">Live Now</Badge> : <Badge className="bg-blue-50 text-white">Upcoming</Badge>}
                </div>
                <CardTitle className="text-3xl font-headline font-bold text-slate-900">{exam.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className={cn("p-6 rounded-[2rem] text-center border-2", isExamStarted ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200")}>
                   <p className="text-3xl font-black font-headline tracking-tighter text-slate-900">{countdownText}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-1">
                      <ListChecks className="h-5 w-5 text-primary" />
                      <p className="text-[10px] font-black text-slate-400 uppercase">Questions</p>
                      <p className="text-lg font-black text-slate-900">{exam.totalQuestions || 0}</p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-1">
                      <Timer className="h-5 w-5 text-primary" />
                      <p className="text-[10px] font-black text-slate-400 uppercase">Duration</p>
                      <p className="text-lg font-black text-slate-900">{exam.durationMinutes || 0} Min</p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-1">
                      <AlertTriangle className={cn("h-5 w-5", exam.negativeMarkingEnabled ? "text-rose-500" : "text-slate-300")} />
                      <p className="text-[10px] font-black text-slate-400 uppercase">Negative</p>
                      <p className="text-lg font-black text-slate-900">{exam.negativeMarkingEnabled ? `-${exam.negativeMarkingValue}` : 'No'}</p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-1">
                      <Video className={cn("h-5 w-5", exam.videoProctoringEnabled ? "text-emerald-500" : "text-slate-300")} />
                      <p className="text-[10px] font-black text-slate-400 uppercase">AI Guard</p>
                      <p className="text-lg font-black text-slate-900">{exam.videoProctoringEnabled ? 'Active' : 'Off'}</p>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="flex items-center gap-2 px-1">
                      <Info className="h-4 w-4 text-primary" />
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Candidate Instructions</h4>
                   </div>
                   <ScrollArea className="h-[200px] w-full rounded-[2rem] border-2 border-slate-100 bg-white p-6 shadow-inner">
                      <div className="prose prose-sm prose-slate max-w-none">
                         {exam.description ? (
                           <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{exam.description}</p>
                         ) : (
                           <ul className="space-y-3 text-slate-500 list-none p-0">
                              <li className="flex gap-3">
                                 <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black shrink-0">1</div>
                                 <span>Ensure you are in a quiet, well-lit room for the entire duration.</span>
                              </li>
                              <li className="flex gap-3">
                                 <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black shrink-0">2</div>
                                 <span>Do not switch browser tabs or minimize the window during the test.</span>
                              </li>
                              <li className="flex gap-3">
                                 <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black shrink-0">3</div>
                                 <span>The AI (Vision Guard) will be monitoring your webcam feed.</span>
                              </li>
                              <li className="flex gap-3">
                                 <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black shrink-0">4</div>
                                 <span>Your progress is saved automatically. If internet drops, don't worry.</span>
                              </li>
                           </ul>
                         )}
                      </div>
                   </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="bg-slate-900 text-white">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> {showPayment ? "Secure Payment" : "Registration Access"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {showPayment ? (
                   payConfig?.activeMode === 'automated' ? (
                     <div className="space-y-6 text-center animate-in zoom-in-95">
                        <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                           <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
                           <p className="font-bold text-slate-900">Secure Online Checkout</p>
                           <p className="text-xs text-slate-500 mt-2">Amount to pay: ₹{exam.price}</p>
                        </div>
                        <Button className="w-full h-16 rounded-2xl font-black text-lg gap-2" onClick={handleOnlinePayment}>
                           <Wallet className="h-5 w-5" /> Pay with {payConfig.provider.toUpperCase()}
                        </Button>
                     </div>
                   ) : (
                    <div className="space-y-6 animate-in zoom-in-95">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-dashed text-center">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Scan & Pay ₹{exam.price}</p>
                         <img src={qrUrl} alt="UPI QR" className="w-48 h-48 mx-auto shadow-xl rounded-xl border-4 border-white" />
                         <code className="block mt-4 text-xs font-bold text-slate-600 bg-white py-2 px-3 rounded-lg border">{OWNER_UPI_ID}</code>
                      </div>
                      <form onSubmit={handlePaymentSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500">Transaction ID (UTR)</Label>
                          <Input required placeholder="ENTER 12 DIGIT UTR..." className="h-12 rounded-xl text-center font-black tracking-widest" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value.replace(/\s/g, '').toUpperCase())} />
                        </div>
                        <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg">Confirm & Unlock</Button>
                      </form>
                    </div>
                   )
                ) : exam.isAdminExam && verificationStatus !== 'verified' ? (
                   <form onSubmit={handleGlobalRegister} className="space-y-4">
                      <div className="space-y-2"><Label>Full Name</Label><Input required placeholder="Enter Name" className="h-12 rounded-xl" value={globalReg.name} onChange={(e) => setGlobalReg({...globalReg, name: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Mobile Number</Label><Input required placeholder="10 Digit Mobile" maxLength={10} className="h-12 rounded-xl" value={globalReg.mobile} onChange={(e) => setGlobalReg({...globalReg, mobile: e.target.value})} /></div>
                      <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg" disabled={isExamOver || isRegistering}>{isRegistering ? <Loader2 className="animate-spin" /> : "Verify Identity"}</Button>
                   </form>
                ) : (
                  <div className="space-y-6">
                     {!exam.isAdminExam && verificationStatus !== 'verified' && (
                        <div className="space-y-2">
                           <Label className="font-bold text-[10px] uppercase text-slate-400 tracking-widest">Board Roll ID</Label>
                           <Input placeholder="IDXXXXXX" className="h-14 rounded-2xl text-lg font-black tracking-widest text-center" value={rollNumber} onChange={(e) => setRollNumber(e.target.value.toUpperCase())} />
                        </div>
                     )}

                     {verificationStatus === 'verified' && studentData && (
                       <div className="p-6 bg-emerald-50 border-2 border-emerald-200 rounded-[2rem] space-y-6 animate-in zoom-in-95">
                          <div className="flex items-center gap-4">
                             <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm"><CheckCircle2 className="h-8 w-8" /></div>
                             <div className="flex-1">
                                <p className="text-xl font-headline font-bold text-emerald-900 leading-none">{studentData.name}</p>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1.5">Verified Candidate</p>
                             </div>
                          </div>
                          <div className="space-y-4 pt-4 border-t border-emerald-100">
                             <div className="flex items-center gap-3">
                                <Checkbox id="agree" checked={hasAgreed} onCheckedChange={(v) => setHasAgreed(v as boolean)} />
                                <Label htmlFor="agree" className="text-[10px] font-bold text-emerald-800 cursor-pointer uppercase tracking-tight">I agree to the security rules.</Label>
                             </div>
                             <Button onClick={handleStart} disabled={!hasAgreed || loading || !isExamStarted || isExamOver} className="w-full h-16 rounded-2xl font-black text-xl shadow-xl shadow-emerald-500/20">
                                {loading ? <Loader2 className="animate-spin" /> : "Launch Series"}
                             </Button>
                          </div>
                       </div>
                     )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
