"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Lock, 
  AlertTriangle, 
  Image as ImageIcon, 
  Layers, 
  AlertCircle,
  Trophy,
  Lightbulb,
  Users,
  FileImage,
  Timer,
  Clock,
  Calendar,
  MinusCircle,
  FileText,
  Sparkles,
  Loader2,
  BookOpen,
  Minus
} from 'lucide-react';
import { 
  useUser, 
  useFirestore, 
  useDoc, 
  useCollection, 
  useMemoFirebase, 
  updateDocumentNonBlocking, 
  setDocumentNonBlocking 
} from '@/firebase';
import { doc, collection, query, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

type QuestionType = 'MCQ' | 'MCQ_IMAGE';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function EditExamPage() {
  const router = useRouter();
  const { id: examId } = useParams() as { id: string };
  const userHook = useUser();
  const user = userHook.user;
  const db = useFirestore();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [rollNumbersInput, setRollNumbersInput] = useState('');
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
    status: 'Active',
    videoProctoringEnabled: false,
    voiceEnabled: false,
    primaryLanguage: 'English',
    assignmentType: 'all',
    assignedBatches: [] as string[],
    assignedRollNumbers: [] as string[]
  });

  const [questions, setQuestions] = useState<any[]>([]);

  const examQuery = useMemoFirebase(() => {
    if (!db || !examId) return null;
    return doc(db, 'exams', examId);
  }, [db, examId]);
  const { data: existingExam, isLoading: examLoading } = useDoc(examQuery);

  const questionsQuery = useMemoFirebase(() => {
    if (!db || !examId) return null;
    return query(collection(db, 'exams', examId, 'questions'));
  }, [db, examId]);
  const { data: existingQuestions, isLoading: questionsLoading } = useCollection(questionsQuery);

  const studentsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, 'coaching_centers', user.uid, 'student_enrollments');
  }, [db, user?.uid]);
  const { data: students } = useCollection(studentsQuery);

  const uniqueBatches = useMemo(() => {
    if (!students) return [];
    return Array.from(new Set(students.map(s => s.batchName || 'General'))).filter(Boolean).sort();
  }, [students]);

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
    if (existingExam) {
      setExamData({
        title: existingExam.title || '',
        subject: existingExam.subject || '',
        description: existingExam.description || '',
        negativeMarkingEnabled: existingExam.negativeMarkingEnabled || false,
        negativeMarkingValue: existingExam.negativeMarkingValue ?? 0.25,
        startTime: existingExam.startTime || '',
        endTime: existingExam.endTime || '',
        durationMinutes: existingExam.timeLimitMinutes || 60,
        status: existingExam.status || 'Active',
        videoProctoringEnabled: existingExam.videoProctoringEnabled || false,
        voiceEnabled: existingExam.voiceEnabled || false,
        primaryLanguage: existingExam.primaryLanguage || 'English',
        assignmentType: existingExam.assignmentType || 'all',
        assignedBatches: existingExam.assignedBatches || [],
        assignedRollNumbers: existingExam.assignedRollNumbers || []
      });
      
      if (existingExam.assignedRollNumbers) {
        setRollNumbersInput(existingExam.assignedRollNumbers.join(', '));
      }
      
      const now = new Date();
      const startTime = new Date(existingExam.startTime);
      if (now >= startTime || existingExam.status === 'Completed') {
        setIsLocked(true);
      }
    }
  }, [existingExam]);

  useEffect(() => {
    if (existingQuestions) {
      setQuestions(existingQuestions.map(q => ({
        ...q,
        type: q.type || 'MCQ',
        marks: q.marks || 1,
        sectionName: q.sectionName || '',
        options: Array.isArray(q.options) ? q.options : [
          { label: 'A', text: '', imageUrl: '' },
          { label: 'B', text: '', imageUrl: '' },
          { label: 'C', text: '', imageUrl: '' },
          { label: 'D', text: '', imageUrl: '' }
        ]
      })));
    }
  }, [existingQuestions]);

  const addQuestion = () => {
    if (isLocked) return;
    const lastSection = questions[questions.length - 1]?.sectionName || '';
    setQuestions(prev => [...prev, { 
      id: `new_${Date.now()}`,
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
    if (isLocked || questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = useCallback((index: number, field: string, value: any) => {
    if (isLocked) return;
    setQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, [isLocked]);

  const addOption = (qIdx: number) => {
    if (isLocked) return;
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
    if (isLocked) return;
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
    if (isLocked) return;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !examQuery || isLocked) return;

    setLoading(true);
    try {
      updateDocumentNonBlocking(examQuery, {
        ...examData,
        assignedRollNumbers: rollNumbersInput.split(',').map(r => r.trim().toUpperCase()).filter(Boolean),
        timeLimitMinutes: examData.durationMinutes,
        totalQuestions: questions.length,
        updatedAt: serverTimestamp(),
      });

      for (const q of questions) {
        const qId = q.id.startsWith('new_') ? doc(collection(db, 'exams', examId, 'questions')).id : q.id;
        const qRef = doc(db, 'exams', examId, 'questions', qId);
        setDocumentNonBlocking(qRef, { 
          ...q, 
          id: qId, 
          examId, 
          coachingCenterId: user.uid, 
          updatedAt: serverTimestamp() 
        }, { merge: true });
      }
      toast({ title: "Updated", description: "Assessment has been synced." });
      router.push('/center/exams');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
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

  if (examLoading || questionsLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Shield className="h-12 w-12 text-primary animate-pulse" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="h-16 bg-white border-b flex items-center px-4 md:px-8 sticky top-0 z-50 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/center/exams"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="font-headline font-bold text-xl">Edit Assessment</h1>
        </div>
        <Button onClick={handleSubmit} disabled={loading || isLocked} className="gap-2 font-bold shadow-lg shadow-primary/20 px-6">
          {isLocked ? <Lock className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {loading ? "Saving..." : isLocked ? "Locked" : "Save Changes"}
        </Button>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8">
        {isLocked && (
          <Alert className="mb-8 bg-orange-50 text-orange-900 border-orange-200">
            <Lock className="h-4 w-4" />
            <AlertTitle className="font-bold">Exam is Locked</AlertTitle>
            <AlertDescription>Live or completed assessments cannot be edited for audit integrity.</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
              <Card className={cn(isLocked && "opacity-80 pointer-events-none")}>
                <CardHeader><CardTitle className="font-headline text-xl">Configuration</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>Title</Label><Input value={examData.title} onChange={(e) => setExamData(prev => ({...prev, title: e.target.value}))} disabled={isLocked} /></div>
                    <div className="space-y-2"><Label>Overall Subject</Label><Input value={examData.subject} onChange={(e) => setExamData(prev => ({...prev, subject: e.target.value}))} disabled={isLocked} /></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Instructions</Label>
                    <p className="text-[10px] font-black text-primary uppercase tracking-tight mb-1">ADD YOUR CUSTOM INSTRUCTIONS HERE, OTHERWISE OUR SYSTEM WILL AUTOMATICALLY INCLUDE THE DEFAULT ONES.</p>
                    <Textarea value={examData.description} onChange={(e) => setExamData(prev => ({...prev, description: e.target.value}))} disabled={isLocked} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="flex items-center gap-2 font-bold"><Calendar className="h-3 w-3 text-primary" /> Start Date & Time</Label>
                      <input type="datetime-local" className="flex h-12 w-full rounded-xl border-2 border-slate-200 bg-background px-4 py-2" min={minDateTime} value={examData.startTime} onChange={(e) => setExamData(prev => ({...prev, startTime: e.target.value}))} disabled={isLocked} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 font-bold"><Timer className="h-3 w-3 text-primary" /> Duration (Min)</Label>
                      <Input type="number" min="1" disabled={isLocked} className="h-12 rounded-xl" value={examData.durationMinutes} onChange={(e) => setExamData(prev => ({...prev, durationMinutes: parseInt(e.target.value) || 0}))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="opacity-50 flex items-center gap-2 font-bold"><Clock className="h-3 w-3" /> End Time (Auto)</Label>
                      <input type="datetime-local" className="flex h-12 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-2 text-slate-400" readOnly value={examData.endTime} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5 space-y-8">
              <Card className={cn("border-none shadow-sm bg-white overflow-hidden", isLocked && "opacity-80 pointer-events-none")}>
                <CardHeader className="bg-slate-900 text-white pb-6"><CardTitle className="text-lg font-headline flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Assignment</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3">
                    <Label className="font-bold text-xs uppercase tracking-widest text-slate-500">Student Eligibility</Label>
                    <Select value={examData.assignmentType} onValueChange={(v) => setExamData(prev => ({...prev, assignmentType: v}))} disabled={isLocked}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
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
                              disabled={isLocked}
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
                        disabled={isLocked}
                        placeholder="e.g. ROLL001, ROLL002, ROLL005" 
                        value={rollNumbersInput}
                        onChange={(e) => setRollNumbersInput(e.target.value)}
                        className="min-h-[100px] rounded-xl bg-slate-50 border-none font-mono text-xs"
                      />
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold">Vision Guard™ AI</Label>
                      <Switch checked={examData.videoProctoringEnabled} onCheckedChange={(v) => setExamData(prev => ({...prev, videoProctoringEnabled: v}))} disabled={isLocked} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={cn("border-none shadow-sm bg-white overflow-hidden", isLocked && "opacity-80 pointer-events-none")}>
                <CardHeader className="bg-slate-900 text-white pb-6">
                  <CardTitle className="text-lg font-headline flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" /> Marking Scheme
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                      <Label className="font-bold text-slate-900">Negative Marking</Label>
                      <p className="text-[10px] text-slate-500 font-medium">Deduct marks for errors</p>
                    </div>
                    <Switch 
                      disabled={isLocked}
                      checked={examData.negativeMarkingEnabled} 
                      onCheckedChange={(v) => setExamData({...examData, negativeMarkingEnabled: v})} 
                    />
                  </div>
                  
                  {examData.negativeMarkingEnabled && (
                    <div className="space-y-2 animate-in zoom-in-95">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                        <Minus className="h-3 w-3" /> Penalty Per Wrong Answer
                      </Label>
                      <Input 
                        disabled={isLocked}
                        type="number" 
                        step="0.25" 
                        min="0" 
                        className="h-12 rounded-xl border-2 border-primary/20 bg-white font-black text-primary text-center text-lg" 
                        value={examData.negativeMarkingValue} 
                        onChange={(e) => setExamData({...examData, negativeMarkingValue: parseFloat(e.target.value) || 0})} 
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-headline font-bold">Question Set</h2>
            <div className="space-y-8">
              {questions.map((q, idx) => (
                <Card key={idx} className={cn("relative group border-2 border-primary/5 shadow-sm", isLocked && "pointer-events-none opacity-90")}>
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
                          disabled={isLocked}
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200">
                        <Trophy className="h-3 w-3 text-amber-500" />
                        <input type="number" className="h-6 w-12 bg-transparent p-0 text-[10px] font-bold outline-none" value={q.marks || 1} onChange={(e) => handleQuestionChange(idx, 'marks', e.target.value)} disabled={isLocked} />
                      </div>
                      <Select value={q.type || 'MCQ'} onValueChange={(v) => handleQuestionChange(idx, 'type', v)} disabled={isLocked}>
                        <SelectTrigger className="h-8 w-44 bg-white text-[10px] font-bold gap-2"><div className="flex items-center gap-2">{getQuestionTypeIcon(q.type as QuestionType)}<SelectValue /></div></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MCQ">Standard MCQ</SelectItem>
                          <SelectItem value="MCQ_IMAGE">MCQ (Image Based)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {!isLocked && <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeQuestion(idx)}><Trash2 className="h-4 w-4" /></Button>}
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-primary font-bold">Question Text</Label>
                        <Textarea required className="min-h-[100px]" value={q.questionText || ''} onChange={(e) => handleQuestionChange(idx, 'questionText', e.target.value)} disabled={isLocked} />
                      </div>
                      {(q.type === 'MCQ_IMAGE' || q.questionImageUrl) && (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-slate-500"><ImageIcon className="h-3.5 w-3.5" /> Question Image URL</Label>
                          <Input placeholder="https://..." value={q.questionImageUrl || ''} onChange={(e) => handleQuestionChange(idx, 'questionImageUrl', e.target.value)} disabled={isLocked} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="flex justify-between items-center px-2">
                        <Label className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Options ({q.options?.length || 0})</Label>
                        {!isLocked && (
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" className="h-8 text-[10px] font-black" onClick={() => removeOption(idx)} disabled={q.options?.length <= 2}><MinusCircle className="h-3 w-3 mr-1" /> REMOVE</Button>
                            <Button type="button" variant="outline" size="sm" className="h-8 text-[10px] font-black" onClick={() => addOption(idx)} disabled={q.options?.length >= 6}><Plus className="h-3 w-3 mr-1" /> ADD</Button>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {q.options?.map((opt: any, oIdx: number) => (
                          <div key={oIdx} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4 shadow-inner">
                            <div className="flex items-center gap-2"><Badge variant="outline" className="h-6 w-6 rounded-full font-bold bg-white">{opt.label}</Badge><span className="text-[10px] font-bold text-slate-400 uppercase">Option {opt.label}</span></div>
                            <div className="space-y-4">
                              <Input placeholder={`Text for Option ${opt.label}`} value={opt.text} onChange={(e) => handleOptionChange(idx, oIdx, 'text', e.target.value)} disabled={isLocked} />
                              {(q.type === 'MCQ_IMAGE' || opt.imageUrl) && (
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Image URL</Label>
                                  <Input placeholder="https://..." className="h-8 text-xs" value={opt.imageUrl} onChange={(e) => handleOptionChange(idx, oIdx, 'imageUrl', e.target.value)} disabled={isLocked} />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between p-5 bg-primary/5 rounded-2xl border border-primary/10">
                        <Label className="font-bold">Correct Choice</Label>
                        <Select value={q.correctAnswerForSingleChoice || 'A'} onValueChange={(v) => handleQuestionChange(idx, 'correctAnswerForSingleChoice', v)} disabled={isLocked}>
                          <SelectTrigger className="w-[140px] border-2 border-primary/20 bg-white font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent>{q.options?.map((o: any) => <SelectItem key={o.label} value={o.label}>Option {o.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2 p-5 bg-slate-900 rounded-[2rem] border-2 border-slate-800">
                      <Label className="text-primary font-black uppercase text-[10px] tracking-widest flex items-center gap-2"><Lightbulb className="h-3 w-3" /> Solution / Hint</Label>
                      <Textarea className="bg-slate-800 border-slate-700 text-slate-300 min-h-[100px] text-xs rounded-xl" value={q.solution || ''} onChange={(e) => handleQuestionChange(idx, 'solution', e.target.value)} disabled={isLocked} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {!isLocked && <div className="flex justify-center pt-8"><Button type="button" variant="outline" size="lg" onClick={addQuestion} className="w-full md:auto gap-3 font-bold border-2 border-dashed border-slate-300 h-14 px-12 transition-all rounded-2xl"><Plus className="h-5 w-5" /> Add Question</Button></div>}
          </div>
        </form>
      </main>
    </div>
  );
}
