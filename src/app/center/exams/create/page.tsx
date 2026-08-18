"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  Layers,
  AlertCircle,
  Users,
  Loader2,
  Trophy,
  Zap,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  Info,
  FileImage,
  Timer,
  Clock,
  Calendar,
  FileText,
  MinusCircle,
  Languages,
  Sparkles,
  BookOpen,
  Minus
} from 'lucide-react';
import { 
  useUser, 
  useFirestore, 
  addDocumentNonBlocking,
  useCollection,
  useMemoFirebase,
  useDoc,
  updateDocumentNonBlocking
} from '@/firebase';
import { collection, serverTimestamp, query, where, doc, getDocs, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activity-logger';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type QuestionType = 'MCQ' | 'MCQ_IMAGE';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function CreateExamPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [minDateTime, setMinDateTime] = useState('');

  const [examData, setExamData] = useState({
    title: '',
    subject: '',
    description: '',
    negativeMarkingEnabled: false,
    negativeMarkingValue: 0.25,
    startTime: '',
    endTime: '',
    durationMinutes: 60,
    studentCapacity: 49,
    videoProctoringEnabled: true,
    voiceEnabled: true,
    primaryLanguage: 'English',
    assignmentType: 'all', 
    assignedBatches: [] as string[],
    assignedRollNumbers: [] as string[]
  });

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    setMinDateTime(`${year}-${month}-${day}T${hours}:${mins}`);
  }, []);

  useEffect(() => {
    if (examData.startTime && examData.durationMinutes) {
      const start = new Date(examData.startTime);
      const end = new Date(start.getTime() + examData.durationMinutes * 60000);
      
      const year = end.getFullYear();
      const month = String(end.getMonth() + 1).padStart(2, '0');
      const day = String(end.getDate()).padStart(2, '0');
      const hours = String(end.getHours()).padStart(2, '0');
      const mins = String(end.getMinutes()).padStart(2, '0');
      
      const formattedEnd = `${year}-${month}-${day}T${hours}:${mins}`;
      setExamData(prev => ({ ...prev, endTime: formattedEnd }));
    }
  }, [examData.startTime, examData.durationMinutes]);

  const [rollNumbersInput, setRollNumbersInput] = useState('');

  const [questions, setQuestions] = useState<any[]>([
    { 
      type: 'MCQ',
      sectionName: '',
      questionText: '', 
      questionImageUrl: '',
      options: [
        { label: 'A', text: '', imageUrl: '' },
        { label: 'B', text: '', imageUrl: '' },
        { label: 'C', text: '', imageUrl: '' },
        { label: 'D', text: '', imageUrl: '' }
      ],
      correctAnswerForSingleChoice: 'A',
      solution: '',
      marks: 1
    }
  ]);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'coaching_centers', user.uid);
  }, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const availableCredits = profile?.availableCredits || 0;

  const examsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, 'exams'), where('coachingCenterId', '==', user.uid));
  }, [db, user?.uid]);
  const { data: existingExams, isLoading: examsLoading } = useCollection(examsQuery);

  const studentsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, 'coaching_centers', user.uid, 'student_enrollments');
  }, [db, user?.uid]);
  const { data: students } = useCollection(studentsQuery);

  const uniqueBatches = useMemo(() => {
    if (!students) return [];
    const batches = Array.from(new Set(students.map(s => s.batchName || 'General'))).filter(Boolean);
    return batches.sort();
  }, [students]);

  const isInsufficientCredits = useMemo(() => {
    return examData.studentCapacity > availableCredits;
  }, [examData.studentCapacity, availableCredits]);

  const addQuestion = () => {
    const lastSection = questions[questions.length - 1]?.sectionName || '';
    setQuestions(prev => [...prev, { 
      type: 'MCQ',
      sectionName: lastSection,
      questionText: '', 
      questionImageUrl: '',
      options: [
        { label: 'A', text: '', imageUrl: '' },
        { label: 'B', text: '', imageUrl: '' },
        { label: 'C', text: '', imageUrl: '' },
        { label: 'D', text: '', imageUrl: '' }
      ],
      correctAnswerForSingleChoice: 'A',
      solution: '',
      marks: 1
    }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = useCallback((index: number, field: string, value: any) => {
    setQuestions(prev => {
      if (prev[index][field] === value) return prev;
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const addOption = (qIdx: number) => {
    setQuestions(prev => {
      const updated = [...prev];
      const q = { ...updated[qIdx] };
      const options = Array.isArray(q.options) ? [...q.options] : [];
      if (options.length < 6) {
        const nextLabel = OPTION_LABELS[options.length];
        options.push({ label: nextLabel, text: '', imageUrl: '' });
        q.options = options;
        updated[qIdx] = q;
      }
      return updated;
    });
  };

  const removeOption = (qIdx: number) => {
    setQuestions(prev => {
      const updated = [...prev];
      const q = { ...updated[qIdx] };
      const options = Array.isArray(q.options) ? [...q.options] : [];
      if (options.length > 2) {
        options.pop();
        q.options = options;
        const labels = options.map((o: any) => o.label);
        if (!labels.includes(q.correctAnswerForSingleChoice)) {
          q.correctAnswerForSingleChoice = 'A';
        }
        updated[qIdx] = q;
      }
      return updated;
    });
  };

  const handleOptionChange = (qIdx: number, oIdx: number, field: string, value: string) => {
    setQuestions(prev => {
      const updated = [...prev];
      const q = { ...updated[qIdx] };
      const options = Array.isArray(q.options) ? [...q.options] : [];
      if (options[oIdx]) {
        options[oIdx] = { ...options[oIdx], [field]: value };
        q.options = options;
        updated[qIdx] = q;
      }
      return updated;
    });
  };

  const handleImportQuestions = async (targetExamId: string) => {
    if (!db) return;
    setLoading(true);
    try {
      const qSnap = await getDocs(collection(db, 'exams', targetExamId, 'questions'));
      const imported = qSnap.docs.map(doc => {
        const data = doc.data();
        
        let options = Array.isArray(data.options) ? [...data.options] : [];
        if (options.length === 0 && (data.optionA || data.optionB)) {
          options = [
            { label: 'A', text: data.optionA || '', imageUrl: '' },
            { label: 'B', text: data.optionB || '', imageUrl: '' },
            { label: 'C', text: data.optionC || '', imageUrl: '' },
            { label: 'D', text: data.optionD || '', imageUrl: '' }
          ].filter(o => o.text !== '');
        }

        return {
          ...data,
          id: `imp_${doc.id}_${Date.now()}`,
          questionText: data.questionText || data.question || '',
          options: options,
          correctAnswerForSingleChoice: data.correctAnswerForSingleChoice || data.correctAnswer || 'A',
          marks: Number(data.marks) || 1,
          type: data.type || 'MCQ',
          sectionName: data.sectionName || '',
          solution: data.solution || ''
        };
      });

      if (imported.length > 0) {
        setQuestions(imported);
        toast({ title: "Import Successful", description: `${imported.length} questions loaded.` });
      }
      setIsImportOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Import Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || isInsufficientCredits) {
       if (isInsufficientCredits) toast({ variant: "destructive", title: "Insufficient Credits", description: "Please top-up student credits to create this exam." });
       return;
    }

    if (examData.studentCapacity < 49) {
      toast({ variant: "destructive", title: "Minimum Capacity", description: "Each exam must have a minimum capacity of 49 students." });
      return;
    }
    
    const start = new Date(examData.startTime);
    const end = new Date(examData.endTime);
    
    if (end <= start) {
      toast({ variant: "destructive", title: "Invalid Timeline", description: "Exam must end after it starts." });
      return;
    }

    setLoading(true);
    try {
      const examRef = collection(db, 'exams');
      const payload = {
        ...examData,
        assignedRollNumbers: rollNumbersInput.split(',').map(r => r.trim().toUpperCase()).filter(Boolean),
        timeLimitMinutes: examData.durationMinutes,
        coachingCenterId: user.uid,
        coachingCenterOwnerUserId: user.uid,
        status: 'Active',
        totalQuestions: questions.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const examDoc = await addDocumentNonBlocking(examRef, payload);

      if (examDoc) {
        for (const q of questions) {
          const qRef = collection(db, 'exams', examDoc.id, 'questions');
          addDocumentNonBlocking(qRef, {
            ...q,
            marks: Number(q.marks) || 1,
            examId: examDoc.id,
            coachingCenterId: user.uid,
            coachingCenterOwnerUserId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        
        if (profileRef) {
           updateDocumentNonBlocking(profileRef, {
              availableCredits: increment(-Number(examData.studentCapacity)),
              updatedAt: serverTimestamp()
           });
        }

        logActivity(db, user.uid, profile?.name || 'Institutional User', 'EXAM_CREATE', `Published new assessment: ${examData.title} with ${examData.studentCapacity} capacity.`);
        toast({ title: "Assessment Published", description: `${examData.studentCapacity} credits deducted.` });
        router.push('/center/exams');
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Publishing Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case 'MCQ_IMAGE': return <FileImage className="h-4 w-4" />;
      default: return <Layers className="h-4 w-4" />;
    }
  };

  if (examsLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="h-16 bg-white border-b flex items-center px-4 md:px-8 sticky top-0 z-50 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/center/exams"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="font-headline font-bold text-xl text-primary">New Assessment</h1>
          </div>
        </div>
        <Button 
          type="submit" 
          form="create-exam-form" 
          disabled={loading || isInsufficientCredits} 
          className={cn("gap-2 font-black shadow-lg px-6 h-11", isInsufficientCredits && "bg-slate-300")}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {loading ? "Publishing..." : "Publish Exam"}
        </Button>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
        <Card className="border-none shadow-sm rounded-[2rem] bg-slate-900 text-white overflow-hidden">
           <CardContent className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Zap className="h-8 w-8" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Account Balance</p>
                    <p className="text-3xl font-black">{availableCredits} Student Credits</p>
                 </div>
              </div>
              <Link href="/pricing">
                 <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold h-11 px-8 rounded-xl">Buy Credits</Button>
              </Link>
           </CardContent>
        </Card>

        <form id="create-exam-form" onSubmit={handleSubmit} className={cn("space-y-8", isInsufficientCredits && "opacity-60")}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
              <Card className="border-none shadow-sm">
                <CardHeader><CardTitle className="font-headline text-xl">Exam Overview</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>Exam Title</Label><Input required placeholder="Mock Exam" value={examData.title} onChange={(e) => setExamData(prev => ({...prev, title: e.target.value}))} /></div>
                    <div className="space-y-2"><Label>Overall Subject</Label><Input required placeholder="Overall Subject Name" value={examData.subject} onChange={(e) => setExamData(prev => ({...prev, subject: e.target.value}))} /></div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">Student Limit (Credits) <TooltipProvider><Tooltip><TooltipTrigger><Info className="h-3 w-3 text-slate-400" /></TooltipTrigger><TooltipContent>Number of student credits to deduct.</TooltipContent></Tooltip></TooltipProvider></Label>
                    <Input type="number" required min="49" value={examData.studentCapacity} onChange={(e) => setExamData(prev => ({...prev, studentCapacity: parseInt(e.target.value) || 0}))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Instructions</Label>
                    <p className="text-[10px] font-black text-primary uppercase tracking-tight mb-1">ADD YOUR CUSTOM INSTRUCTIONS HERE, OTHERWISE OUR SYSTEM WILL AUTOMATICALLY INCLUDE THE DEFAULT ONES.</p>
                    <Textarea placeholder="Rules for students..." value={examData.description} onChange={(e) => setExamData(prev => ({...prev, description: e.target.value}))} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="flex items-center gap-2 font-bold"><Calendar className="h-3 w-3 text-primary" /> Start Date & Time</Label>
                      <input type="datetime-local" className="flex h-12 w-full rounded-xl border-2 border-slate-200 bg-background px-4 py-2 text-base font-medium" required min={minDateTime} value={examData.startTime} onChange={(e) => setExamData(prev => ({...prev, startTime: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 font-bold"><Clock className="h-3 w-3 text-primary" /> Duration (Minutes)</Label>
                      <Input type="number" min="1" required className="h-12 rounded-xl border-2" value={examData.durationMinutes} onChange={(e) => setExamData(prev => ({...prev, durationMinutes: parseInt(e.target.value) || 0}))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="opacity-50 flex items-center gap-2 font-bold"><Clock className="h-3 w-3" /> End Time (Auto)</Label>
                      <input type="datetime-local" className="flex h-12 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-2 text-base text-slate-400 cursor-not-allowed" readOnly value={examData.endTime} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-8">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-900 text-white pb-6"><CardTitle className="text-lg font-headline flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Assignment Settings</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <Label className="font-bold text-xs uppercase tracking-widest text-slate-500">Student Eligibility</Label>
                    <Select value={examData.assignmentType} onValueChange={(v) => setExamData(prev => ({...prev, assignmentType: v}))}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Registered Students</SelectItem>
                        <SelectItem value="batch">Specific Batches</SelectItem>
                        <SelectItem value="specific">Specific Roll Numbers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {examData.assignmentType === 'batch' && (
                    <div className="space-y-3 pt-4 border-t animate-in fade-in slide-in-from-top-2">
                      <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Select Target Batches</Label>
                      <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                        {uniqueBatches.length > 0 ? uniqueBatches.map(batch => (
                          <div key={batch} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white transition-all">
                            <Checkbox 
                              id={`batch-${batch}`} 
                              checked={examData.assignedBatches.includes(batch)}
                              onCheckedChange={(checked) => {
                                setExamData(prev => ({
                                  ...prev,
                                  assignedBatches: checked 
                                    ? [...prev.assignedBatches, batch]
                                    : prev.assignedBatches.filter(b => b !== batch)
                                }))
                              }}
                            />
                            <Label htmlFor={`batch-${batch}`} className="text-xs font-bold cursor-pointer truncate flex-1">{batch}</Label>
                          </div>
                        )) : (
                          <div className="p-4 text-center border-2 border-dashed rounded-xl">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">No Batches Found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {examData.assignmentType === 'specific' && (
                    <div className="space-y-2 pt-4 border-t animate-in fade-in slide-in-from-top-2">
                      <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Roll Numbers (Comma Separated)</Label>
                      <Textarea 
                        placeholder="e.g. ROLL001, ROLL002, ROLL005" 
                        value={rollNumbersInput}
                        onChange={(e) => setRollNumbersInput(e.target.value)}
                        className="min-h-[100px] rounded-xl bg-slate-50 border-none font-mono text-xs"
                      />
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold">Vision Guard™ AI Proctoring</Label>
                      <Switch checked={examData.videoProctoringEnabled} onCheckedChange={(v) => setExamData(prev => ({...prev, videoProctoringEnabled: v}))} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-900 text-white pb-6">
                  <CardTitle className="text-lg font-headline flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" /> Marking Scheme
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                      <Label className="font-bold text-slate-900">Negative Marking</Label>
                      <p className="text-[10px] text-slate-500 font-medium">Deduct marks for wrong answers</p>
                    </div>
                    <Switch checked={examData.negativeMarkingEnabled} onCheckedChange={(v) => setExamData({...examData, negativeMarkingEnabled: v})} />
                  </div>
                  
                  {examData.negativeMarkingEnabled && (
                    <div className="space-y-2 animate-in zoom-in-95">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                        <Minus className="h-3 w-3" /> Penalty Value (Marks)
                      </Label>
                      <Input 
                        type="number" 
                        step="0.25" 
                        min="0" 
                        className="h-12 rounded-xl border-2 border-primary/20 bg-white font-black text-primary text-center text-lg" 
                        value={examData.negativeMarkingValue} 
                        onChange={(e) => setExamData({...examData, negativeMarkingValue: parseFloat(e.target.value) || 0})} 
                      />
                      <p className="text-[9px] text-slate-400 italic text-center">Value to be deducted per incorrect response.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-headline font-bold">Question Bank ({questions.length})</h2>
              <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogTrigger asChild><Button variant="outline" className="gap-2 font-bold border-2 border-primary/20"><FileText className="h-4 w-4" /> Import Question Paper</Button></DialogTrigger>
                <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden">
                  <div className="bg-slate-900 p-6 text-white shrink-0"><DialogHeader><DialogTitle className="text-white text-xl">Import Paper</DialogTitle></DialogHeader></div>
                  <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {existingExams?.map((e) => (
                      <div key={e.id} onClick={() => handleImportQuestions(e.id)} className="p-4 bg-slate-50 border rounded-2xl hover:bg-white hover:border-primary/40 transition-all cursor-pointer flex justify-between items-center group">
                        <div><p className="font-bold">{e.title}</p><p className="text-[10px] uppercase font-bold text-slate-400">{e.subject} • {e.totalQuestions || 0} Qs</p></div>
                        <ChevronRight className="h-5 w-5 text-slate-300" />
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-8">
              {questions.map((q, idx) => (
                <Card key={idx} className="relative border-2 border-primary/5 hover:border-primary/20 transition-all shadow-sm">
                  <CardHeader className="pb-4 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex flex-wrap items-center gap-4">
                      <Badge className="bg-primary text-white font-black">Q. {idx + 1}</Badge>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <Input 
                          placeholder="Subject/Section (e.g. Mathematics)" 
                          className="h-9 w-64 bg-white font-bold text-sm" 
                          value={q.sectionName || ''} 
                          onChange={(e) => handleQuestionChange(idx, 'sectionName', e.target.value)} 
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200">
                        <Trophy className="h-3 w-3 text-amber-500" />
                        <input type="number" className="h-6 w-12 bg-transparent p-0 text-[10px] font-bold outline-none" value={q.marks || 1} onChange={(e) => handleQuestionChange(idx, 'marks', e.target.value)} />
                      </div>
                      <Select value={q.type || 'MCQ'} onValueChange={(v) => handleQuestionChange(idx, 'type', v)}>
                        <SelectTrigger className="h-8 w-44 bg-white text-[10px] font-bold gap-2"><div className="flex items-center gap-2">{getQuestionTypeIcon(q.type as QuestionType)}<SelectValue /></div></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MCQ">Standard MCQ</SelectItem>
                          <SelectItem value="MCQ_IMAGE">MCQ (Image Based)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeQuestion(idx)}><Trash2 className="h-4 w-4" /></Button>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-primary font-bold">Question Text</Label>
                        <Textarea required placeholder="Enter question..." className="min-h-[100px] font-medium" value={q.questionText || ''} onChange={(e) => handleQuestionChange(idx, 'questionText', e.target.value)} />
                      </div>
                      {(q.type === 'MCQ_IMAGE' || q.questionImageUrl) && (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-slate-500"><ImageIcon className="h-3.5 w-3.5" /> Question Image URL</Label>
                          <Input placeholder="https://..." value={q.questionImageUrl || ''} onChange={(e) => handleQuestionChange(idx, 'questionImageUrl', e.target.value)} />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex justify-between items-center px-2">
                        <Label className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Question Options ({q.options?.length || 0})</Label>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" className="h-8 text-[10px] font-black border-dashed" onClick={() => removeOption(idx)} disabled={q.options?.length <= 2}><MinusCircle className="h-3 w-3 mr-1" /> REMOVE OPTION</Button>
                          <Button type="button" variant="outline" size="sm" className="h-8 text-[10px] font-black border-dashed" onClick={() => addOption(idx)} disabled={q.options?.length >= 6}><Plus className="h-3 w-3 mr-1" /> ADD OPTION</Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {q.options?.map((opt: any, oIdx: number) => (
                          <div key={oIdx} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                            <div className="flex items-center gap-2"><Badge variant="outline" className="h-6 w-6 rounded-full font-bold bg-white">{opt.label}</Badge><span className="text-[10px] font-bold text-slate-400 uppercase">Option {opt.label}</span></div>
                            <div className="space-y-4">
                                <Input required placeholder={`Text for Option ${opt.label}`} value={opt.text} onChange={(e) => handleOptionChange(idx, oIdx, 'text', e.target.value)} />
                                {(q.type === 'MCQ_IMAGE') && (
                                  <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Image URL</Label>
                                    <Input placeholder="https://..." className="h-8 text-xs" value={opt.imageUrl} onChange={(e) => handleOptionChange(idx, oIdx, 'imageUrl', e.target.value)} />
                                  </div>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between p-5 bg-primary/5 rounded-2xl border border-primary/10">
                        <Label className="font-bold">Correct Choice</Label>
                        <Select value={q.correctAnswerForSingleChoice || 'A'} onValueChange={(v) => handleQuestionChange(idx, 'correctAnswerForSingleChoice', v)}>
                          <SelectTrigger className="w-[140px] border-2 border-primary/20 bg-white font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent>{q.options?.map((o: any) => <SelectItem key={o.label} value={o.label}>Option {o.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2 p-5 bg-slate-900 rounded-[2rem] border-2 border-slate-800">
                      <Label className="text-primary font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><Lightbulb className="h-3 w-3" /> Academic Solution / Hint</Label>
                      <Textarea placeholder="Explain the logic..." className="bg-slate-800 border-slate-700 text-slate-300 min-h-[100px] text-xs rounded-xl" value={q.solution || ''} onChange={(e) => handleQuestionChange(idx, 'solution', e.target.value)} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-center pt-8"><Button type="button" variant="outline" size="lg" onClick={addQuestion} className="w-full md:auto gap-3 font-bold border-2 border-dashed border-slate-300 h-14 px-12 transition-all rounded-2xl"><Plus className="h-5 w-5" /> Add Another Question</Button></div>
          </div>
        </form>
      </main>
    </div>
  );
}

function hexToHsl(hex: string) {
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
