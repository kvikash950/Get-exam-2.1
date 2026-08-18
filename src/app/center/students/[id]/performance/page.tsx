
"use client";

import { useMemo, Suspense, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  FileText, 
  Zap, 
  AlertTriangle,
  User,
  Activity,
  BarChart3,
  Calendar,
  Loader2,
  LineChart,
  BrainCircuit,
  Trophy,
  History,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { 
  useDoc, 
  useCollection, 
  useFirestore, 
  useMemoFirebase, 
  useUser 
} from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function PerformanceContent() {
  const { id: enrollmentId } = useParams() as { id: string };
  const { user } = useUser();
  const db = useFirestore();

  // 1. Fetch Student Enrollment Details
  const studentRef = useMemoFirebase(() => {
    if (!db || !user?.uid || !enrollmentId) return null;
    return doc(db, 'coaching_centers', user.uid, 'student_enrollments', enrollmentId);
  }, [db, user?.uid, enrollmentId]);
  const { data: student, isLoading: studentLoading } = useDoc(studentRef);

  // 2. Fetch All Attempts for this Student's Roll Number
  const attemptsQuery = useMemoFirebase(() => {
    if (!db || !student?.rollNumber || !user?.uid) return null;
    return query(
      collection(db, 'exam_attempts'),
      where('studentRollNumber', '==', student.rollNumber),
      where('coachingCenterOwnerUserId', '==', user.uid)
    );
  }, [db, student?.rollNumber, user?.uid]);
  const { data: rawAttempts, isLoading: attemptsLoading } = useCollection(attemptsQuery);

  // 3. Fetch All Exams to map names
  const examsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, 'exams'), where('coachingCenterId', '==', user.uid));
  }, [db, user?.uid]);
  const { data: exams } = useCollection(examsQuery);

  // 4. Aggregate Performance Data
  const analytics = useMemo(() => {
    if (!rawAttempts || rawAttempts.length === 0) return null;

    // Sort attempts chronologically by submission time
    const sortedAttempts = [...rawAttempts].sort((a, b) => {
      const dateA = a.submittedAt?.toMillis?.() || 0;
      const dateB = b.submittedAt?.toMillis?.() || 0;
      return dateA - dateB;
    });

    // Create trend data for the graph
    const trendData = sortedAttempts.map((a, i) => {
      const examInfo = exams?.find(e => e.id === a.examId);
      return {
        sequence: `Exam ${i + 1}`,
        fullTitle: examInfo?.title || 'Unknown Exam',
        score: a.percentageScore || 0,
        date: a.submittedAt?.toDate ? a.submittedAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A',
      };
    });

    const totalAttempts = sortedAttempts.length;
    const avgAccuracy = Math.round(sortedAttempts.reduce((acc, curr) => acc + (curr.percentageScore || 0), 0) / totalAttempts);
    const peakScore = Math.max(...sortedAttempts.map(a => a.percentageScore || 0));
    
    // Improvement from last attempt
    const current = sortedAttempts[totalAttempts - 1]?.percentageScore || 0;
    const previous = totalAttempts > 1 ? sortedAttempts[totalAttempts - 2]?.percentageScore : current;
    const improvement = parseFloat((current - previous).toFixed(1));

    // Aggregate Subject Statistics across all exams
    const subjectStats: Record<string, { total: number, correct: number }> = {};
    sortedAttempts.forEach(attempt => {
      const sections = attempt.sectionAnalytics || {};
      Object.entries(sections).forEach(([name, data]: [string, any]) => {
        if (!subjectStats[name]) subjectStats[name] = { total: 0, correct: 0 };
        subjectStats[name].total += data.total || 0;
        subjectStats[name].correct += data.correct || 0;
      });
    });

    const subjectAnalysis = Object.entries(subjectStats)
      .map(([name, data]) => ({
        name,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    const strongest = subjectAnalysis[0] || { name: 'General Performance', accuracy: avgAccuracy };
    const weakest = subjectAnalysis.length > 1 ? subjectAnalysis[subjectAnalysis.length - 1] : { name: 'Inconclusive', accuracy: 0 };

    return { 
      attempts: sortedAttempts, 
      trendData, 
      avgAccuracy, 
      peakScore, 
      improvement, 
      subjectAnalysis, 
      strongest, 
      weakest 
    };
  }, [rawAttempts, exams]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl text-white space-y-1">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">{data.date}</p>
          <p className="text-sm font-bold leading-tight">{data.fullTitle}</p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xl font-black text-primary">{data.score}%</span>
            <span className="text-[10px] font-bold text-slate-400">Score</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (studentLoading || attemptsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="font-headline font-bold text-slate-400 uppercase tracking-widest text-[10px]">Processing Exam Archives...</p>
      </div>
    );
  }

  if (!student) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="max-w-md w-full p-10 text-center rounded-[2.5rem] border-none shadow-2xl">
        <Shield className="h-16 w-16 text-primary mx-auto mb-6 opacity-20" />
        <h2 className="text-2xl font-black text-slate-900">Record Not Found</h2>
        <p className="text-slate-500 mt-2 font-medium">The requested student profile is missing from your center's registry.</p>
        <Link href="/center/students" className="mt-8 block">
          <Button className="w-full font-bold h-12 rounded-xl">Back to Student Directory</Button>
        </Link>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 px-4 md:px-12 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/center/students">
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 transition-all h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="font-headline font-bold text-lg md:text-xl text-slate-900 leading-tight">Performance Audit</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[200px]">ROLL: {student.rollNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black px-4 py-1.5 h-auto hidden sm:flex">
            <History className="h-3.5 w-3.5 mr-2" /> {analytics?.attempts?.length || 0} EXAMS RECORDED
          </Badge>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8 md:py-12 space-y-10">
        {/* Profile Identity Card */}
        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-slate-900 text-white relative">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none rotate-12">
            <BrainCircuit className="h-64 w-64 text-primary" />
          </div>
          <CardContent className="p-8 md:p-16 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="relative group">
                <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all duration-500"></div>
                <Avatar className="h-32 w-32 md:h-48 md:w-48 border-4 border-white shadow-2xl relative z-10 transition-transform duration-500 hover:scale-105">
                  <AvatarImage src={student.photoUrl} className="object-cover" />
                  <AvatarFallback className="bg-slate-800 text-primary text-5xl font-black uppercase">
                    {student.name?.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 text-center md:text-left space-y-6">
                <div className="space-y-2">
                  <Badge className="bg-primary hover:bg-primary text-[10px] font-black tracking-widest px-5 py-1.5 rounded-full">INSTITUTIONAL PROFILE</Badge>
                  <h2 className="text-4xl md:text-7xl font-headline font-bold tracking-tighter leading-none">{student.name}</h2>
                  <p className="text-slate-400 font-bold text-lg md:text-2xl uppercase tracking-wider flex items-center justify-center md:justify-start gap-2">
                    <Trophy className="h-5 w-5 text-primary" /> {student.batchName || 'General Batch'}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-8 pt-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enrollment Date</p>
                    <p className="text-lg font-bold text-white">
                      {student.createdAt ? new Date(student.createdAt.toMillis ? student.createdAt.toMillis() : student.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                  <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Security Clearance</p>
                    <div className="flex items-center gap-2 text-green-400 font-bold text-lg">
                      <ShieldCheck className="h-5 w-5" /> Active Audit
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 text-center min-w-[240px] shadow-2xl ring-1 ring-white/20">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3">OVERALL PRECISION</p>
                <p className="text-7xl font-headline font-bold text-white tracking-tighter mb-2">
                  {analytics?.avgAccuracy || 0}<span className="text-3xl text-primary font-black">%</span>
                </p>
                <div className="mt-4">
                  {analytics && analytics.improvement >= 0 ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[10px] h-7 px-4">
                      <TrendingUp className="h-3 w-3 mr-2" /> +{analytics.improvement}% TREND
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-500/20 text-rose-400 border-none font-black text-[10px] h-7 px-4">
                      <TrendingDown className="h-3 w-3 mr-2" /> {analytics?.improvement}% TREND
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {analytics && analytics.attempts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Performance Curve Analysis */}
            <div className="lg:col-span-8 space-y-8">
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group">
                <CardHeader className="px-8 pt-8 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-headline font-bold flex items-center gap-3">
                        <LineChart className="h-6 w-6 text-primary" /> Performance Curve
                      </CardTitle>
                      <CardDescription className="text-slate-500 font-medium">Tracking improvement across all {analytics.attempts.length} attempts.</CardDescription>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-2xl">
                      <Activity className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                        <XAxis 
                          dataKey="sequence" 
                          fontSize={10} 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontWeight: 'bold'}} 
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          fontSize={10} 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#94a3b8', fontWeight: 'bold'}} 
                        />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '5 5' }} />
                        <Area 
                          type="monotone" 
                          dataKey="score" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={5} 
                          fillOpacity={1} 
                          fill="url(#colorScore)" 
                          animationDuration={2000} 
                          activeDot={{ r: 8, fill: 'hsl(var(--primary))', stroke: 'white', strokeWidth: 3 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 flex justify-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t pt-6">
                    <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-primary" /> Exam Score (%)</div>
                    <div className="flex items-center gap-2 border-l pl-8"><Target className="h-3 w-3 text-primary" /> Target: 100%</div>
                  </div>
                </CardContent>
              </Card>

              {/* Strength & Weakness Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8 relative overflow-hidden transition-all hover:shadow-2xl">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <Zap className="h-24 w-24 text-emerald-600" />
                  </div>
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-50 rounded-2xl">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                      </div>
                      <h4 className="text-xl font-headline font-bold text-slate-900">Top Performer In</h4>
                    </div>
                    <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
                      <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em] mb-1">Highest Accuracy Subject</p>
                      <h5 className="text-3xl font-black text-slate-900 truncate">{analytics.strongest.name}</h5>
                      <div className="mt-6 space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-bold text-slate-500">Historical Precision</span>
                          <span className="text-2xl font-black text-emerald-600">{analytics.strongest.accuracy}%</span>
                        </div>
                        <div className="h-3 w-full bg-emerald-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${analytics.strongest.accuracy}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8 relative overflow-hidden transition-all hover:shadow-2xl">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <AlertTriangle className="h-24 w-24 text-rose-600" />
                  </div>
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-rose-50 rounded-2xl">
                        <Target className="h-6 w-6 text-rose-600" />
                      </div>
                      <h4 className="text-xl font-headline font-bold text-slate-900">Focus Needed In</h4>
                    </div>
                    <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100/50">
                      <p className="text-[10px] font-black text-rose-600/60 uppercase tracking-[0.2em] mb-1">Lowest Accuracy Subject</p>
                      <h5 className="text-3xl font-black text-slate-900 truncate">{analytics.weakest.name}</h5>
                      <div className="mt-6 space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-bold text-slate-500">Historical Precision</span>
                          <span className="text-2xl font-black text-rose-600">{analytics.weakest.accuracy}%</span>
                        </div>
                        <div className="h-3 w-full bg-rose-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${analytics.weakest.accuracy}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Right Column: Key Statistics & History */}
            <div className="lg:col-span-4 space-y-8">
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="bg-slate-50 p-8 border-b border-slate-100">
                  <CardTitle className="text-xl font-headline font-bold flex items-center gap-3">
                    <Award className="h-6 w-6 text-primary" /> Key Performance Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {[
                    { label: 'Highest Ever', value: `${analytics.peakScore}%`, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Avg. Accuracy', value: `${analytics.avgAccuracy}%`, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Growth Trend', value: `${analytics.improvement > 0 ? '+' : ''}${analytics.improvement}%`, icon: TrendingUp, color: analytics.improvement >= 0 ? 'text-emerald-600' : 'text-rose-600', bg: analytics.improvement >= 0 ? 'bg-emerald-50' : 'bg-rose-50' },
                    { label: 'Exams Taken', value: analytics.attempts.length, icon: History, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 group hover:bg-white hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-2xl shadow-inner", stat.bg, stat.color)}>
                          <stat.icon className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-bold text-slate-600">{stat.label}</p>
                      </div>
                      <p className="text-xl font-black text-slate-900">{stat.value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-headline font-bold flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" /> Attempt Feed
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-50">
                    {[...analytics.attempts].reverse().slice(0, 6).map((a) => (
                      <div key={a.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-default">
                        <div className="space-y-1">
                          <p className="text-sm font-black text-slate-900 truncate max-w-[180px] group-hover:text-primary transition-colors">
                            {exams?.find(e => e.id === a.examId)?.title || 'Exam Session'}
                          </p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{a.submittedAt?.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={cn(
                            "font-black text-[10px] h-7 px-4 rounded-full border-none shadow-sm",
                            (a.percentageScore || 0) >= 70 ? "bg-emerald-500 text-white" : (a.percentageScore || 0) >= 40 ? "bg-blue-500 text-white" : "bg-rose-500 text-white"
                          )}>
                            {a.percentageScore}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="p-8 pt-4">
                  <Link href="/center/results" className="w-full">
                    <Button variant="outline" className="w-full font-black text-xs uppercase tracking-widest h-12 rounded-2xl border-2 hover:bg-primary hover:text-white hover:border-primary transition-all">
                      View Global Ledger
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        ) : (
          <div className="py-40 text-center space-y-8 bg-white rounded-[4rem] shadow-2xl border-2 border-dashed border-slate-100 max-w-4xl mx-auto">
            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 border-4 border-white shadow-xl">
              <Activity className="h-16 w-16" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">No Audit Data Found</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto text-lg leading-relaxed">
                This student has not participated in any digital assessments yet.
              </p>
            </div>
            <Link href="/center/exams">
              <Button size="lg" className="font-black px-12 h-16 rounded-[1.5rem] shadow-2xl shadow-primary/30 text-lg uppercase tracking-widest">
                Schedule First Exam
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function StudentPerformancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>}>
      <PerformanceContent />
    </Suspense>
  );
}
