
"use client";

import { Suspense, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  User, 
  FileText, 
  Building, 
  Lightbulb, 
  Timer,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { 
  useDoc, 
  useCollection, 
  useFirestore, 
  useMemoFirebase,
  useUser,
  useAuth,
  initiateAnonymousSignIn
} from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function ScriptContent() {
  const { id: examId, attemptId } = useParams() as { id: string; attemptId: string };
  const db = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  // Restore anonymous session if refreshed
  useEffect(() => {
    if (!isUserLoading && !user) initiateAnonymousSignIn(auth);
  }, [user, isUserLoading, auth]);

  const attemptRef = useMemoFirebase(() => db && attemptId && user ? doc(db, 'exam_attempts', attemptId) : null, [db, attemptId, user]);
  const { data: attempt, isLoading: attemptLoading } = useDoc(attemptRef);

  const examRef = useMemoFirebase(() => db && examId && user ? doc(db, 'exams', examId) : null, [db, examId, user]);
  const { data: exam, isLoading: examLoading } = useDoc(examRef);

  const centerRef = useMemoFirebase(() => db && attempt?.coachingCenterId && user ? doc(db, 'coaching_centers', attempt.coachingCenterId) : null, [db, attempt?.coachingCenterId, user]);
  const { data: center } = useDoc(centerRef);

  const questionsRef = useMemoFirebase(() => db && examId && user ? query(collection(db, 'exams', examId, 'questions')) : null, [db, examId, user]);
  const { data: questions, isLoading: questionsLoading } = useCollection(questionsRef);

  const responsesRef = useMemoFirebase(() => db && attemptId && user ? query(collection(db, 'exam_attempts', attemptId, 'student_answers')) : null, [db, attemptId, user]);
  const { data: responses, isLoading: responsesLoading } = useCollection(responsesRef);

  const formatTime = (seconds: number) => {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const scriptData = useMemo(() => {
    if (!questions || !responses) return [];
    return questions.map(q => {
      const studentResp = responses.find(r => r.questionId === q.id);
      const studentAns = studentResp?.responseTextSingleChoice || null;
      const timeSpent = studentResp?.timeSpentSeconds || 0;
      return { 
        ...q, 
        studentAns, 
        timeSpent,
        isCorrect: studentAns === q.correctAnswerForSingleChoice, 
        isAttempted: !!studentAns 
      };
    });
  }, [questions, responses]);

  if (attemptLoading || questionsLoading || responsesLoading || examLoading || !attempt || !questions || !exam || !user) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><Shield className="h-12 w-12 text-primary animate-bounce mb-4" /><p className="font-bold uppercase tracking-widest text-[10px]">Generating Transcript...</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-100/50 py-12 px-4 md:px-8 select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center no-print">
          <div className="flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-headline font-bold text-lg">Transcript Panel</span></div>
          <Button onClick={() => window.print()} className="gap-2 font-bold shadow-lg h-11 px-6 rounded-xl"><Printer className="h-4 w-4" /> Print Script</Button>
        </div>

        <div className="bg-white md:rounded-[2.5rem] shadow-2xl overflow-hidden border-t-[16px] border-primary print:border-t-[8px]">
          <div className="px-6 md:px-12 pt-10 pb-6 flex flex-col md:flex-row justify-between items-center border-b border-slate-50 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-4 mb-2">
                {center?.logoUrl && <img src={center.logoUrl} className="h-12 w-auto object-contain" alt="Logo" />}
                <h2 className="text-3xl font-headline font-bold text-slate-900 tracking-tighter">{center?.name || 'Institutional Assessment'}</h2>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border">Official Evaluation Script</p>
            </div>
            <Avatar className="h-20 w-20 border-4 border-primary/10 shadow-sm"><AvatarImage src={attempt.studentPhotoUrl} className="object-cover" /><AvatarFallback className="bg-slate-50 text-slate-300 font-bold">{attempt.studentName?.substring(0, 2)}</AvatarFallback></Avatar>
          </div>

          <div className="p-8 grid grid-cols-2 lg:grid-cols-3 gap-6 bg-white border-b-2">
            <div><span className="text-[9px] font-black text-slate-400 uppercase">Candidate</span><p className="text-lg font-bold">{attempt.studentName}</p></div>
            <div><span className="text-[9px] font-black text-slate-400 uppercase">Roll ID</span><p className="text-lg font-bold">{attempt.studentRollNumber}</p></div>
            <div><span className="text-[9px] font-black text-slate-400 uppercase">Agg. Score</span><p className="text-lg font-black text-primary">{attempt.score} ({(attempt.percentageScore || 0)}%)</p></div>
          </div>

          <div className="p-6 md:p-12 space-y-12">
            {scriptData.map((q, idx) => (
              <div key={q.id} className={cn("border-2 rounded-[2.5rem] overflow-hidden shadow-sm", !q.isAttempted ? "border-slate-100" : q.isCorrect ? "border-green-100 bg-green-50/5" : "border-red-100 bg-red-50/5")}>
                <div className="py-4 px-8 bg-slate-50/50 border-b flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-slate-900 text-white font-black h-8 w-12 rounded-xl flex items-center justify-center text-xs">Q.{idx + 1}</div>
                    <Badge variant="outline" className="text-blue-600 flex items-center gap-1"><Timer className="h-3 w-3" /> {formatTime(q.timeSpent)} Invested</Badge>
                  </div>
                  {q.isAttempted ? (
                    q.isCorrect ? <Badge className="bg-green-100 text-green-700 font-black text-[9px] uppercase px-4 h-6"><CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Correct</Badge> : 
                    <Badge className="bg-red-100 text-red-700 font-black text-[9px] uppercase px-4 h-6"><XCircle className="h-3.5 w-3.5 mr-2" /> Incorrect</Badge>
                  ) : <Badge variant="outline" className="text-[9px] font-black uppercase px-4 h-6">Skipped</Badge>}
                </div>

                <div className="p-8 space-y-10">
                  <div className="space-y-6">
                    {q.questionImageUrl && <img src={q.questionImageUrl} alt="Ref" className="max-w-xl mx-auto border-8 border-white rounded-[2rem] shadow-2xl" />}
                    <h3 className="text-xl md:text-2xl font-bold text-slate-800 whitespace-pre-wrap">{q.questionText}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {q.options?.map((opt: any) => {
                      const isCorrectOption = q.correctAnswerForSingleChoice === opt.label;
                      const isStudentChoice = q.studentAns === opt.label;
                      return (
                        <div key={opt.label} className={cn("p-5 rounded-[2rem] border-2 flex flex-col gap-4", isCorrectOption ? "border-green-500 bg-green-50/30" : isStudentChoice ? "border-red-500 bg-red-50/30" : "border-slate-50")}>
                          <div className="flex items-start gap-4">
                            <span className={cn("h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0", isCorrectOption ? "bg-green-600 text-white" : isStudentChoice ? "bg-red-600 text-white" : "bg-white border text-slate-300")}>{opt.label}</span>
                            <div className="flex-1 space-y-3">
                              {opt.imageUrl && <img src={opt.imageUrl} className="max-w-[200px] border rounded-xl" />}
                              <span className={cn("text-base font-bold", isCorrectOption ? "text-green-900" : isStudentChoice ? "text-red-900" : "text-slate-500")}>{opt.text}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {q.solution && (
                    <div className="mt-8 p-8 bg-slate-900 text-white rounded-[2.5rem] relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Lightbulb className="h-24 w-24 text-primary" /></div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Academic Explanation</p>
                      <p className="text-base text-slate-300 italic whitespace-pre-wrap">"{q.solution}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScriptPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}><ScriptContent /></Suspense>;
}
