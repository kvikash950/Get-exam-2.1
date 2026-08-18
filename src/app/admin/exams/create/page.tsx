
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Globe,
  Zap,
  Clock,
  Calendar,
  Layers,
  FileText,
  Trophy,
  Loader2,
  ImageIcon,
  Tag,
  AlertTriangle,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { 
  useUser, 
  useFirestore, 
  addDocumentNonBlocking
} from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const EXAM_CATEGORIES = [
  "SSC",
  "Banking",
  "Railway",
  "UPSC",
  "Police/Defense",
  "Teaching",
  "JEE/NEET",
  "Insurance",
  "State PSC",
  "CUET",
  "Polytechnic",
  "Other"
];

export default function CreateGlobalExamPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState({
    title: '',
    subject: '',
    category: 'SSC',
    description: '',
    posterUrl: '',
    startTime: '',
    endTime: '',
    durationMinutes: 60,
    isPaid: false,
    price: 0,
    videoProctoringEnabled: true,
    negativeMarkingEnabled: false,
    negativeMarkingValue: 0.25,
    isAdminExam: true
  });

  const [questions, setQuestions] = useState<any[]>([
    { 
      type: 'MCQ',
      sectionName: 'General Awareness',
      questionText: '', 
      questionImageUrl: '',
      options: [
        { label: 'A', text: '', imageUrl: '' },
        { label: 'B', text: '', imageUrl: '' },
        { label: 'C', text: '', imageUrl: '' },
        { label: 'D', text: '', imageUrl: '' }
      ],
      correctAnswerForSingleChoice: 'A',
      marks: 1,
      solution: ''
    }
  ]);

  const ADMIN_EMAIL = 'kvikash@gmail.com';

  useEffect(() => {
    if (!isUserLoading && (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router]);

  const addQuestion = () => {
    const lastSection = questions[questions.length - 1]?.sectionName || 'General';
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
      marks: 1,
      solution: ''
    }]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length > 1) {
      setQuestions(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleQuestionChange = (idx: number, field: string, value: any) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx: number, oIdx: number, field: string, value: string) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx][field] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;

    setLoading(true);
    try {
      // 1. Calculate Section Summary for description and portal display
      const sectionMap: Record<string, { count: number, marks: number }> = {};
      questions.forEach(q => {
        const sec = q.sectionName || 'General';
        if (!sectionMap[sec]) sectionMap[sec] = { count: 0, marks: 0 };
        sectionMap[sec].count++;
        sectionMap[sec].marks += Number(q.marks) || 1;
      });

      const sectionList = Object.entries(sectionMap).map(([name, data]) => ({
        name,
        questionCount: data.count,
        totalMarks: data.marks
      }));

      // 2. Auto-generate Description if empty
      let finalDescription = examData.description;
      if (!finalDescription.trim()) {
        const sectionInfo = sectionList.map(s => `${s.name}: ${s.questionCount} Qs (${s.totalMarks} Marks)`).join(' | ');
        finalDescription = `Official ${examData.category} Test Series for ${examData.subject}. \n\nPaper Pattern: \n${sectionInfo}. \n\nDuration: ${examData.durationMinutes} Minutes. ${examData.negativeMarkingEnabled ? `Negative Marking: ${examData.negativeMarkingValue} per wrong answer.` : 'No Negative Marking.'}`;
      }

      const examRef = collection(db, 'exams');
      const finalDuration = parseInt(examData.durationMinutes.toString()) || 60;
      
      const examDoc = await addDocumentNonBlocking(examRef, {
        ...examData,
        description: finalDescription,
        sectionSummary: sectionList,
        durationMinutes: finalDuration,
        timeLimitMinutes: finalDuration,
        coachingCenterId: user.uid,
        coachingCenterOwnerUserId: user.uid,
        status: 'Active',
        totalQuestions: questions.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (examDoc) {
        for (const q of questions) {
          const qRef = collection(db, 'exams', examDoc.id, 'questions');
          addDocumentNonBlocking(qRef, {
            ...q,
            marks: Number(q.marks) || 1,
            examId: examDoc.id,
            coachingCenterId: user.uid,
            createdAt: serverTimestamp()
          });
        }
        toast({ title: "Series Published Successfully" });
        router.push('/admin/exams');
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="h-16 bg-white border-b flex items-center px-4 md:px-8 sticky top-0 z-50 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/exams"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="font-headline font-bold text-xl flex items-center gap-2 text-primary"><Globe className="h-5 w-5" /> Design Test Series</h1>
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="gap-2 font-black shadow-lg h-11 px-8 rounded-xl">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Publish Global Series
        </Button>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
             <Card className="border-none shadow-sm rounded-[2rem]">
               <CardHeader><CardTitle className="font-headline text-xl">General Configuration</CardTitle></CardHeader>
               <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label>Exam Title</Label><Input required placeholder="e.g. SSC CGL 2024 Tier 1 - Mock 1" value={examData.title} onChange={(e) => setExamData({...examData, title: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Subject</Label><Input required placeholder="e.g. Comprehensive" value={examData.subject} onChange={(e) => setExamData({...examData, subject: e.target.value})} /></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Tag className="h-4 w-4 text-slate-400" /> Exam Category</Label>
                      <select 
                        className="flex h-12 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={examData.category} 
                        onChange={(e) => setExamData({...examData, category: e.target.value})}
                      >
                          {EXAM_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-slate-400" /> Poster Image URL</Label>
                      <Input placeholder="https://..." value={examData.posterUrl} onChange={(e) => setExamData({...examData, posterUrl: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Exam Description</Label>
                      <span className="text-[10px] font-bold text-slate-400 uppercase italic">Leave blank to auto-generate based on sections</span>
                    </div>
                    <Textarea placeholder="Highlights and rules..." className="min-h-[120px]" value={examData.description} onChange={(e) => setExamData({...examData, description: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2"><Label>Start Date/Time</Label><Input type="datetime-local" required value={examData.startTime} onChange={(e) => setExamData({...examData, startTime: e.target.value})} /></div>
                    <div className="space-y-2"><Label>End Date/Time</Label><Input type="datetime-local" required value={examData.endTime} onChange={(e) => setExamData({...examData, endTime: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Duration (Min)</Label><Input type="number" required value={examData.durationMinutes} onChange={(e) => setExamData({...examData, durationMinutes: parseInt(e.target.value) || 0})} /></div>
                  </div>
               </CardContent>
             </Card>
          </div>

          <div className="lg:col-span-4 space-y-8">
             <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Evaluation Rules</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                        <Label className="font-bold">Negative Marking</Label>
                        <Switch checked={examData.negativeMarkingEnabled} onCheckedChange={(v) => setExamData({...examData, negativeMarkingEnabled: v})} />
                      </div>
                      {examData.negativeMarkingEnabled && (
                        <div className="space-y-2 animate-in zoom-in-95">
                          <Label className="text-[10px] font-black text-slate-500 uppercase">Penalty per wrong answer</Label>
                          <Input type="number" step="0.25" className="bg-slate-800 border-none h-11 text-primary font-black" value={examData.negativeMarkingValue} onChange={(e) => setExamData({...examData, negativeMarkingValue: parseFloat(e.target.value) || 0})} />
                        </div>
                      )}
                   </div>

                   <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <Label className="font-bold">Paid Assessment</Label>
                      <Switch checked={examData.isPaid} onCheckedChange={(v) => setExamData({...examData, isPaid: v})} />
                   </div>
                   {examData.isPaid && (
                     <div className="space-y-2 animate-in zoom-in-95">
                        <Label className="text-[10px] font-black text-slate-500 uppercase">Exam Price (INR)</Label>
                        <Input type="number" className="bg-slate-800 border-none h-12 text-2xl font-black text-primary" value={examData.price} onChange={(e) => setExamData({...examData, price: parseInt(e.target.value) || 0})} />
                     </div>
                   )}
                </CardContent>
             </Card>
          </div>
        </div>

        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-headline font-bold">Question Paper Layout</h2>
              <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black px-4 py-1">{questions.length} TOTAL QUESTIONS</Badge>
           </div>
           
           {questions.map((q, idx) => (
             <Card key={idx} className="border-none shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-shadow">
                <CardHeader className="bg-slate-50/50 pb-4 flex flex-row items-center justify-between">
                   <div className="flex items-center gap-4 flex-1">
                     <Badge className="bg-primary h-8 w-12 flex items-center justify-center font-black">Q. {idx + 1}</Badge>
                     <div className="flex-1 max-w-[200px]">
                        <Input placeholder="Section (e.g. Reasoning)" className="h-8 text-[10px] font-black uppercase bg-white" value={q.sectionName} onChange={(e) => handleQuestionChange(idx, 'sectionName', e.target.value)} />
                     </div>
                     <div className="flex items-center gap-2">
                        <Trophy className="h-3 w-3 text-amber-500" />
                        <Input type="number" className="w-16 h-8 text-xs font-bold bg-white" value={q.marks} onChange={(e) => handleQuestionChange(idx, 'marks', e.target.value)} placeholder="Marks" />
                     </div>
                   </div>
                   <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-red-50" onClick={() => removeQuestion(idx)}><Trash2 className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase">Question Text</Label>
                            <Textarea placeholder="Type the question..." className="min-h-[100px] font-medium" value={q.questionText} onChange={(e) => handleQuestionChange(idx, 'questionText', e.target.value)} />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><ImageIcon className="h-3 w-3" /> Question Image URL (Optional)</Label>
                            <Input placeholder="https://..." className="bg-slate-50 border-none" value={q.questionImageUrl} onChange={(e) => handleQuestionChange(idx, 'questionImageUrl', e.target.value)} />
                         </div>
                      </div>
                      
                      <div className="space-y-4">
                         <div className="flex items-center justify-between px-1">
                            <Label className="text-[10px] font-black text-slate-400 uppercase">Options Configuration</Label>
                            <Badge variant="outline" className="text-[8px] font-black uppercase">Exactly 4 Options Required</Badge>
                         </div>
                         <div className="grid grid-cols-1 gap-4">
                            {q.options.map((opt: any, oIdx: number) => (
                              <div key={opt.label} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                                 <div className="flex items-center gap-2">
                                    <span className="h-6 w-6 rounded-lg bg-white border flex items-center justify-center font-black text-[10px]">{opt.label}</span>
                                    <Input placeholder={`Option ${opt.label} text`} className="h-9 bg-white text-sm" value={opt.text} onChange={(e) => handleOptionChange(idx, oIdx, 'text', e.target.value)} />
                                 </div>
                                 <Input placeholder="Image URL (optional)" className="h-7 text-[8px] bg-white italic" value={opt.imageUrl} onChange={(e) => handleOptionChange(idx, oIdx, 'imageUrl', e.target.value)} />
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                      <div className="space-y-3 p-5 bg-primary/5 rounded-2xl border border-primary/10">
                         <Label className="font-bold flex items-center gap-2 text-primary"><CheckCircle2 className="h-4 w-4" /> Correct Answer Key</Label>
                         <div className="flex gap-4">
                            {['A','B','C','D'].map(l => (
                              <button 
                                key={l}
                                type="button"
                                onClick={() => handleQuestionChange(idx, 'correctAnswerForSingleChoice', l)}
                                className={cn(
                                  "flex-1 h-12 rounded-xl font-black text-lg transition-all",
                                  q.correctAnswerForSingleChoice === l ? "bg-primary text-white shadow-lg" : "bg-white text-slate-400 border border-slate-200 hover:bg-slate-50"
                                )}
                              >
                                {l}
                              </button>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-3 p-5 bg-slate-900 rounded-2xl text-white">
                         <Label className="font-bold flex items-center gap-2 text-primary"><Lightbulb className="h-4 w-4" /> Solution / Academic Explanation</Label>
                         <Textarea placeholder="Explain why the answer is correct..." className="bg-slate-800 border-none text-slate-300 text-xs min-h-[80px]" value={q.solution} onChange={(e) => handleQuestionChange(idx, 'solution', e.target.value)} />
                      </div>
                   </div>
                </CardContent>
             </Card>
           ))}
           <Button variant="outline" onClick={addQuestion} className="w-full h-16 border-dashed border-2 border-slate-300 rounded-2xl font-bold bg-white hover:bg-primary/5 hover:border-primary/40 transition-all">
             <Plus className="h-5 w-5 mr-2" /> Add Next Question
           </Button>
        </div>
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
