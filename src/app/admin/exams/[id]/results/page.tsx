
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Search, 
  Trophy, 
  FileText, 
  Award, 
  Loader2, 
  Download,
  Shield,
  Clock,
  User,
  Fingerprint,
  TrendingUp,
  LineChart,
  ChevronRight,
  Users,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { 
  useDoc, 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase 
} from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminGlobalExamResultsPage() {
  const { id: examId } = useParams() as { id: string };
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');

  const ADMIN_EMAIL = 'kvikash@gmail.com';

  useEffect(() => {
    if (!isUserLoading && (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router, ADMIN_EMAIL]);

  const examRef = useMemoFirebase(() => db && examId ? doc(db, 'exams', examId) : null, [db, examId]);
  const { data: exam, isLoading: examLoading } = useDoc(examRef);

  const attemptsQuery = useMemoFirebase(() => {
    if (!db || !examId || !user) return null;
    return query(collection(db, 'exam_attempts'), where('examId', '==', examId));
  }, [db, examId, user]);
  const { data: attempts, isLoading: attemptsLoading } = useCollection(attemptsQuery);

  const filteredAttempts = useMemo(() => {
    if (!attempts) return [];
    return attempts
      .filter(a => 
        a.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.studentRollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [attempts, searchTerm]);

  const handleExport = () => {
    if (!filteredAttempts.length) return;
    
    const headers = ["Rank", "Student Name", "Roll Number", "Score", "Accuracy (%)", "Payment UTR", "Amount", "Date"];
    const csvContent = [
      headers.join(","),
      ...filteredAttempts.map((a, i) => [
        i + 1,
        `"${a.studentName}"`,
        `"${a.studentRollNumber}"`,
        a.score,
        `"${a.percentageScore}%"`,
        `"${a.paymentUtr || 'N/A'}"`,
        a.paidAmount || 0,
        `"${a.submittedAt?.toDate ? a.submittedAt.toDate().toLocaleString() : 'N/A'}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `results_${exam?.title?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Ledger Exported" });
  };

  if (examLoading || attemptsLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="h-20 bg-slate-900 text-white flex items-center px-4 md:px-12 sticky top-0 z-50 justify-between shadow-xl">
        <div className="flex items-center gap-6">
          <Link href="/admin/exams">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="font-headline font-bold text-xl text-primary flex items-center gap-2"><Trophy className="h-6 w-6" /> Evaluation Center</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate max-w-[300px]">{exam?.title}</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExport} className="bg-white/5 border-white/10 text-white font-bold h-11 px-8 rounded-xl gap-2 hover:bg-white/10">
          <Download className="h-4 w-4" /> Export Result Ledger
        </Button>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                <Users className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Candidates</p>
                <p className="text-3xl font-black text-slate-900">{attempts?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                <TrendingUp className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Avg. Precision</p>
                <p className="text-3xl font-black text-slate-900">
                  {attempts?.length ? Math.round(attempts.reduce((acc, curr) => acc + (curr.percentageScore || 0), 0) / attempts.length) : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <Award className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pass Rate (40%+)</p>
                <p className="text-3xl font-black text-slate-900">
                  {attempts?.length ? Math.round((attempts.filter(a => (a.percentageScore || 0) >= 40).length / attempts.length) * 100) : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b bg-slate-50/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
               <CardTitle className="text-xl font-headline font-bold flex items-center gap-3">
                 <FileText className="h-6 w-6 text-primary" /> Candidate Ledger
               </CardTitle>
               <div className="relative w-full md:w-80">
                 <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                 <Input placeholder="Search name or roll ID..." className="pl-10 h-11 bg-white border-none rounded-xl shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
               </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredAttempts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="pl-8 font-black uppercase text-[10px] py-5">Rank / Candidate</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Payment Audit</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Performance</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Submission Time</TableHead>
                      <TableHead className="text-right pr-8 font-black uppercase text-[10px]">Audit View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttempts.map((a, i) => (
                      <TableRow key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                        <TableCell className="pl-8 py-5">
                           <div className="flex items-center gap-4">
                             <span className="text-xs font-black text-slate-400 w-6">#{i+1}</span>
                             <div className="flex items-center gap-3">
                               <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-black text-xs">
                                 {a.studentName?.substring(0, 2).toUpperCase()}
                               </div>
                               <div className="flex flex-col">
                                 <span className="font-bold text-slate-900">{a.studentName}</span>
                                 <span className="text-[8px] font-black text-slate-400 uppercase">{a.studentRollNumber}</span>
                               </div>
                             </div>
                           </div>
                        </TableCell>
                        <TableCell>
                          {a.paymentUtr ? (
                            <div className="flex flex-col">
                              <Badge variant="outline" className="w-fit bg-emerald-50 text-emerald-700 border-emerald-100 text-[8px] font-black uppercase px-2 h-5">
                                Paid ₹{a.paidAmount || 0}
                              </Badge>
                              <span className="text-[10px] font-mono font-bold text-slate-500 mt-1">{a.paymentUtr}</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[8px] font-black uppercase text-slate-400">No Record</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-slate-900">{a.score} pts</span>
                              <Badge className={cn(
                                "text-[9px] font-black h-5",
                                (a.percentageScore || 0) >= 70 ? "bg-emerald-500" : (a.percentageScore || 0) >= 40 ? "bg-blue-500" : "bg-red-500"
                              )}>
                                {a.percentageScore}%
                              </Badge>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                             <Clock className="h-3.5 w-3.5" />
                             {a.submittedAt?.toDate ? a.submittedAt.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                           </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                           <div className="flex justify-end gap-2">
                             <Link href={`/exam/${examId}/result?attempt=${a.id}`} target="_blank">
                               <Button variant="ghost" size="sm" className="h-8 gap-2 text-[10px] font-black uppercase text-primary hover:bg-primary/5">
                                 <Award className="h-3.5 w-3.5" /> Scorecard
                               </Button>
                             </Link>
                             <Link href={`/exam/${examId}/script/${a.id}`} target="_blank">
                               <Button variant="ghost" size="sm" className="h-8 gap-2 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100">
                                 <FileText className="h-3.5 w-3.5" /> Script
                               </Button>
                             </Link>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-24 text-center space-y-4 px-8">
                 <Shield className="h-12 w-12 text-slate-200 mx-auto" />
                 <div>
                    <h3 className="text-xl font-bold text-slate-900">No Attempts Found</h3>
                    <p className="text-slate-400 font-medium">Student responses will appear here as soon as they are submitted.</p>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
