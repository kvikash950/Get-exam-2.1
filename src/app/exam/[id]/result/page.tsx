"use client";

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  BarChart as BarChartIcon, 
  TrendingUp, 
  Download,
  Medal,
  Target,
  Flame,
  LayoutDashboard,
  FileText,
  Printer,
  ShieldCheck,
  Building,
  Lock,
  CalendarDays,
  CheckCircle2,
  User,
  Activity,
  AlertTriangle,
  Fingerprint,
  Zap,
  Smartphone,
  Users,
  Loader2,
  BellRing
} from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase, useCollection, useUser, useAuth, initiateAnonymousSignIn } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function ResultContent() {
  const { id: examId } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attempt');
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading: userLoading } = useUser();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Restore anonymous session if refreshed
  useEffect(() => {
    if (!userLoading && !user) initiateAnonymousSignIn(auth);
  }, [user, userLoading, auth]);

  const attemptRef = useMemoFirebase(() => {
    if (!db || !attemptId || !user) return null;
    return doc(db, 'exam_attempts', attemptId);
  }, [db, attemptId, user]);
  const { data: attempt, isLoading: attemptLoading } = useDoc(attemptRef);

  const examQuery = useMemoFirebase(() => {
    if (!db || !examId || !user) return null;
    return doc(db, 'exams', examId);
  }, [db, examId, user]);
  const { data: exam, isLoading: examLoading } = useDoc(examQuery);

  const centerProfileQuery = useMemoFirebase(() => {
    if (!db || !exam?.coachingCenterId || !user) return null;
    return doc(db, 'coaching_centers', exam.coachingCenterId);
  }, [db, exam?.coachingCenterId, user]);
  const { data: center } = useDoc(centerProfileQuery);

  // Use authentication dependency for the query
  const allAttemptsQuery = useMemoFirebase(() => {
    if (!db || !examId || !user) return null;
    return query(collection(db, 'exam_attempts'), where('examId', '==', examId));
  }, [db, examId, user]);
  const { data: allAttempts } = useCollection(allAttemptsQuery);

  const stats = useMemo(() => {
    if (!attempt || !allAttempts) return null;
    const sorted = [...allAttempts].sort((a, b) => (b.score || 0) - (a.score || 0));
    const rank = sorted.findIndex(a => a.id === attempt.id) + 1;
    const topperScore = sorted[0]?.percentageScore || 0;
    
    const sections = attempt.sectionAnalytics || {};
    const chartData = Object.entries(sections).map(([name, data]: [string, any]) => ({
      name,
      accuracy: Math.round((data.correct / data.total) * 100)
    }));

    const weakTopic = [...chartData].sort((a, b) => a.accuracy - b.accuracy)[0]?.name || 'N/A';
    const strongTopic = [...chartData].sort((a, b) => b.accuracy - a.accuracy).reverse()[0]?.name || 'N/A';

    return { rank, totalParticipants: sorted.length, topperScore, chartData, weakTopic, strongTopic };
  }, [attempt, allAttempts]);

  if (attemptLoading || examLoading || !attempt || !exam || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground font-headline font-bold uppercase tracking-widest text-[10px]">Processing Performance Data...</p>
        </div>
      </div>
    );
  }

  // REFINED EMBARGO LOGIC: Results release after global endTime
  const isResultPublished = now > new Date(exam.endTime);

  if (!isResultPublished) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
          <div className="h-2 bg-primary"></div>
          <CardHeader className="text-center pt-12 pb-6 px-10">
            <div className="w-24 h-24 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-primary/10">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-4xl font-headline font-bold tracking-tight text-slate-900 leading-tight">Submission Successful!</CardTitle>
            <CardDescription className="text-lg font-medium text-slate-500 mt-4 leading-relaxed">
              Your responses for <b className="text-slate-900">"{exam.title}"</b> have been securely archived in our board registry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-10 px-10 pb-12">
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center space-y-4">
               <div className="inline-flex items-center gap-2 bg-white px-5 py-2 rounded-full border shadow-sm">
                  <BellRing className="h-4 w-4 text-primary animate-bounce" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Result Declaration</span>
               </div>
               <p className="text-3xl font-black text-primary font-headline tracking-tighter">
                  {new Date(exam.endTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
               </p>
               <p className="text-xs font-bold text-slate-500 max-w-sm mx-auto leading-relaxed uppercase tracking-wider">
                  For competitive integrity, results and scorecards are released globally only after the examination window concludes.
               </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                  <Fingerprint className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Roll ID</p>
                    <p className="text-xs font-bold text-slate-900">{attempt.studentRollNumber}</p>
                  </div>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Status</p>
                    <p className="text-xs font-bold text-emerald-600">Verified</p>
                  </div>
               </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-900 p-8 border-t flex flex-col gap-4">
            <Link href="/global-exams" className="w-full">
              <Button size="lg" className="w-full font-black h-16 rounded-[1.5rem] text-lg shadow-xl shadow-primary/30">
                Exit to Test Series Portal
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isPassed = (attempt.percentageScore || 0) >= 40;
  const integrityScore = attempt.securityReport?.integrityScore ?? 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12 print:p-0 print:bg-white">
      <div className="w-full max-w-5xl space-y-6 print:hidden">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <span className="font-headline font-bold text-2xl text-primary tracking-tight">Assessment Audit Panel</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-white">
              <div className={`h-3 ${isPassed ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <CardHeader className="pt-8 px-8">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-4xl font-headline font-bold tracking-tighter">
                      {isPassed ? 'Congratulations!' : 'Keep Pushing!'}
                    </CardTitle>
                    <CardDescription className="text-lg font-bold text-slate-500">{exam.title} Result</CardDescription>
                  </div>
                  <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                    <AvatarImage src={attempt.studentPhotoUrl} className="object-cover" />
                    <AvatarFallback className="bg-slate-100 text-slate-400 font-bold uppercase">{attempt.studentName?.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                </div>
              </CardHeader>

              <CardContent className="space-y-8 pt-6 px-8 pb-10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 bg-slate-50 rounded-[2rem] text-center border relative overflow-hidden group hover:bg-white transition-all shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Final Score</p>
                    <p className="text-5xl font-headline font-bold text-primary">{attempt.score}</p>
                    <Badge variant="outline" className="mt-3 font-bold bg-white text-primary border-primary/20">{attempt.percentageScore}% Precision</Badge>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-[2rem] text-center border relative overflow-hidden group hover:bg-white transition-all shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Global Rank</p>
                    <p className="text-5xl font-headline font-bold text-primary">#{stats?.rank || '--'}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 tracking-wide">of {stats?.totalParticipants} students</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm flex items-center gap-2 text-slate-700 uppercase tracking-widest"><BarChartIcon className="h-4 w-4" /> Performance Metrics</h4>
                  </div>
                  <div className="h-[220px] w-full bg-slate-50/50 p-4 rounded-3xl border">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={stats?.chartData || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} fontSize={9} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="accuracy" radius={[12, 12, 4, 4]} barSize={40}>
                          {stats?.chartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.accuracy >= 70 ? '#10b981' : entry.accuracy >= 40 ? '#2563eb' : '#ef4444'} />
                          ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 pt-8 px-8 pb-10 border-t bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <Link href={`/exam/${examId}/script/${attemptId}`} target="_blank" className="w-full">
                    <Button variant="outline" className="w-full gap-2 font-bold rounded-[1.25rem] h-14 bg-white border-slate-200">
                      <FileText className="h-5 w-5 text-slate-500" /> Answer Script
                    </Button>
                  </Link>
                  {isPassed && (
                    <Button onClick={() => window.print()} className="w-full gap-2 font-bold rounded-[1.25rem] h-14 shadow-xl shadow-primary/20 bg-primary text-white">
                      <Printer className="h-5 w-5" /> Merit Certificate
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>

            {/* SECURITY AUDIT REPORT CARD */}
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
              <CardHeader className="border-b border-white/5 pb-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-headline flex items-center gap-3">
                      <ShieldCheck className="h-6 w-6 text-green-400" /> Vision Guard™ Security Audit
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs uppercase tracking-widest font-black">AI Behavioral Analysis Report</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-green-400">{integrityScore}%</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Integrity Index</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-slate-400 font-black text-[9px] uppercase tracking-widest">
                      <Users className="h-3" /> Multi-Person
                    </div>
                    <p className="text-lg font-bold">
                      {attempt.securityReport?.multiPersonIncident ? (
                        <span className="text-red-400 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Detected</span>
                      ) : (
                        <span className="text-green-400 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Secure</span>
                      )}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-slate-400 font-black text-[9px] uppercase tracking-widest">
                      <Smartphone className="h-3" /> Mobile Device
                    </div>
                    <p className="text-lg font-bold">
                      {attempt.securityReport?.mobileDetected ? (
                        <span className="text-red-400 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Detected</span>
                      ) : (
                        <span className="text-green-400 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Secure</span>
                      )}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-slate-400 font-black text-[9px] uppercase tracking-widest">
                      <LayoutDashboard className="h-3" /> Tab Switches
                    </div>
                    <p className="text-lg font-bold">
                      {attempt.securityReport?.tabSwitchCount || 0} Incident(s)
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-primary/10 rounded-3xl border border-primary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="h-5 w-5 text-primary" />
                    <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Behavioral Summary</h4>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed font-medium">
                    {integrityScore >= 95 ? "Student maintained exceptional focus and complied with all security protocols. Verified as highly disciplined session." :
                     integrityScore >= 80 ? "Session recorded with minor gaze distractions. Overall integrity maintained within acceptable institutional bounds." :
                     integrityScore >= 60 ? "Frequent distractions or secondary activity detected. Suggest institutional review of snapshots for validation." :
                     "Security breach detected. High-risk behavioral anomalies recorded including unauthorized object detection or environment changes."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-primary text-white pb-8 pt-8">
                <CardTitle className="text-xl flex items-center gap-3 font-headline"><ShieldCheck className="h-6 w-6" /> Result Token</CardTitle>
                <CardDescription className="text-white/70 font-medium">Verified Performance Identity</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border">
                  <div className="flex items-center gap-4">
                    <Target className="h-10 w-10 text-primary" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Accuracy</p>
                      <p className="text-2xl font-bold text-slate-900">{attempt.percentageScore}%</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm p-3 hover:bg-slate-50 rounded-xl transition-colors font-bold">
                    <div className="flex items-center gap-3 text-slate-600"><CheckCircle className="h-5 w-5 text-green-500" /> Correct</div>
                    <span className="text-slate-900">{attempt.correctAnswersCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm p-3 hover:bg-slate-50 rounded-xl transition-colors font-bold">
                    <div className="flex items-center gap-3 text-slate-600"><XCircle className="h-5 w-5 text-red-500" /> Incorrect</div>
                    <span className="text-slate-900">{attempt.wrongAnswersCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[2.5rem]">
              <CardContent className="p-10 text-center space-y-6">
                <div className="bg-white/10 w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto border border-white/10 rotate-3">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-headline font-bold text-2xl tracking-tight">Security Level: 3</h3>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Vision Guard Active</p>
                </div>
                <div className="pt-2">
                  <code className="text-[8px] font-black bg-white/5 px-4 py-2 rounded-full border border-white/10 text-slate-400">
                    HASH: {attempt.id.substring(0, 16)}
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* PRINT CERTIFICATE */}
      <div className="hidden print:block w-[1100px] h-[780px] bg-white border-[25px] border-double border-slate-900/5 p-12 mx-auto relative overflow-hidden">
        <div className="text-center h-full rounded-sm relative z-10 border-[6px] border-slate-50 flex flex-col items-center justify-between py-12 px-16">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl text-white shadow-md">
                <Shield className="h-8 w-8" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-headline font-bold text-2xl text-primary leading-none">{center?.name || 'Get Exam'}</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Certified Digital Assessment</span>
              </div>
            </div>

            {center?.logoUrl ? (
              <img src={center.logoUrl} className="h-20 w-auto object-contain" alt="Institutional Logo" />
            ) : (
              <div className="flex flex-col items-center gap-1 opacity-20">
                <Building className="h-12 w-12 text-slate-400" />
                <span className="text-[8px] font-bold uppercase tracking-widest">Board Verification</span>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24 border-4 border-slate-100 shadow-lg">
                <AvatarImage src={attempt.studentPhotoUrl} className="object-cover" />
                <AvatarFallback className="bg-slate-50 text-slate-300 font-bold text-2xl">{attempt.studentName?.substring(0, 2)}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-slate-400 font-black uppercase tracking-[0.5em] text-xs">Achievement Recognition</h4>
            <h1 className="text-6xl font-headline font-bold text-slate-900 tracking-tighter uppercase mb-4">Certificate of Merit</h1>
            <div className="h-1 w-48 bg-primary mx-auto"></div>
          </div>

          <div className="space-y-6">
            <p className="text-xl text-slate-500 font-medium italic">This certifies that the candidate</p>
            <h2 className="text-7xl font-headline font-bold text-primary tracking-tighter border-b-4 border-slate-100 pb-4 inline-block px-16">{attempt.studentName}</h2>
            <div className="flex flex-col gap-2 mt-4">
              <p className="text-lg text-slate-500 font-bold uppercase tracking-widest">Roll Number: {attempt.studentRollNumber}</p>
              <p className="text-2xl text-primary font-black uppercase tracking-[0.2em]">Global Rank: #{stats?.rank || '--'}</p>
            </div>
          </div>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            successfully completed <b className="text-slate-900">"{exam.title}"</b> with an aggregate precision of <b className="text-slate-900">{attempt.percentageScore}%</b>.
          </p>

          <div className="w-full flex justify-between items-end px-8">
            <div className="text-center w-64 border-t pt-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Signatory</p>
              <p className="text-xs font-bold text-slate-800">{center?.name || 'Academic Head'}</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary/30" />
              <p className="text-[8px] font-black uppercase text-slate-300 tracking-tighter">Verified Integrity System • myexam.io</p>
            </div>
            <div className="text-center w-64 border-t pt-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Board Registrar</p>
              <p className="text-xs font-bold text-slate-800">Assessment Forge Global</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExamResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Analyzing Report...</div>}>
      <ResultContent />
    </Suspense>
  );
}
