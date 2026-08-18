
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  BarChart, 
  Shield, 
  Search, 
  Download, 
  LogOut,
  TrendingUp,
  Target,
  Trophy,
  Menu,
  Eye,
  Award,
  Loader2,
  LineChart
} from 'lucide-react';
import { useCollection, useFirestore, useUser, useAuth, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export default function ResultsPage() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const examsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, 'exams'), where('coachingCenterId', '==', user.uid));
  }, [db, user?.uid]);
  const { data: exams } = useCollection(examsQuery);

  const attemptsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, 'exam_attempts'), 
      where('coachingCenterOwnerUserId', '==', user.uid)
    );
  }, [db, user?.uid]);
  const { data: attempts, isLoading: attemptsLoading } = useCollection(attemptsQuery);

  // Cross-reference with students to get enrollment IDs for analysis links
  const studentsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, 'coaching_centers', user.uid, 'student_enrollments');
  }, [db, user?.uid]);
  const { data: students } = useCollection(studentsQuery);

  const filteredAttempts = attempts ? attempts
    .filter(attempt => {
      const matchesSearch = attempt.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           attempt.studentRollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesExam = selectedExamId === 'all' || attempt.examId === selectedExamId;
      return matchesSearch && matchesExam;
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0)) : [];

  const handleExport = () => {
    if (!filteredAttempts.length) {
      toast({ variant: "destructive", title: "No data to export" });
      return;
    }

    const headers = ["Rank", "Student Name", "Roll Number", "Exam Title", "Score", "Accuracy (%)", "Submission Date"];
    const csvContent = [
      headers.join(","),
      ...filteredAttempts.map((attempt, idx) => {
        const examTitle = exams?.find(e => e.id === attempt.examId)?.title || 'N/A';
        const date = attempt.submittedAt?.toDate ? attempt.submittedAt.toDate().toLocaleString() : 'N/A';
        return [
          idx + 1,
          `"${attempt.studentName}"`,
          `"${attempt.studentRollNumber}"`,
          `"${examTitle}"`,
          attempt.score,
          `"${attempt.percentageScore}%"`,
          `"${date}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `evaluation_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Export Complete", description: "CSV ledger has been generated successfully." });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth/login');
  };

  const NavItems = () => (
    <nav className="flex-1 p-4 space-y-2">
      <Link href="/center/dashboard"><Button variant="ghost" className="w-full justify-start gap-3"><LayoutDashboard className="h-4 w-4" /> Console Home</Button></Link>
      <Link href="/center/students"><Button variant="ghost" className="w-full justify-start gap-3"><Users className="h-4 w-4" /> Students</Button></Link>
      <Link href="/center/exams"><Button variant="ghost" className="w-full justify-start gap-3"><FileText className="h-4 w-4" /> Exams</Button></Link>
      <Link href="/center/results"><Button variant="secondary" className="w-full justify-start gap-3"><BarChart className="h-4 w-4" /> Reports</Button></Link>
      <Link href="/center/profile"><Button variant="ghost" className="w-full justify-start gap-3"><Settings className="h-4 w-4" /> Profile</Button></Link>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col sticky top-0 h-screen shadow-sm">
        <div className="p-6 border-b flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-headline font-bold text-xl">My Exam</span></div>
        <NavItems />
        <div className="p-4 border-t"><Button variant="ghost" className="w-full justify-start gap-3 text-red-600" onClick={handleLogout}><LogOut className="h-4 w-4" /> Logout</Button></div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex md:hidden items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-headline font-bold text-lg">My Exam</span></div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu className="h-6 w-6" /></Button></SheetTrigger>
            <SheetContent side="left" className="p-0 w-72"><NavItems /></SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-headline font-bold">Evaluation Ledger</h1>
              <p className="text-muted-foreground text-sm">Automated rank list and performance analytics.</p>
            </div>
            <Button variant="outline" onClick={handleExport} className="gap-2 font-bold h-11 shadow-sm w-full md:w-auto">
              <Download className="h-4 w-4" /> Export Results (CSV)
            </Button>
          </div>

          <Card className="border-none shadow-sm mb-8"><CardContent className="p-4 md:p-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Search name or roll..." className="pl-10 h-11" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            <Select value={selectedExamId} onValueChange={setSelectedExamId}><SelectTrigger className="w-full md:w-64 h-11 font-bold"><SelectValue placeholder="All Assessments" /></SelectTrigger><SelectContent><SelectItem value="all">All Exams</SelectItem>{exams?.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}</SelectContent></Select>
          </CardContent></Card>

          <Card className="border-none shadow-sm overflow-hidden rounded-2xl"><CardContent className="p-0">
            {attemptsLoading ? <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div> : filteredAttempts.length > 0 ? (
              <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-slate-50/50"><TableHead className="w-16 pl-6">Rank</TableHead><TableHead>Student</TableHead><TableHead>Exam</TableHead><TableHead>Score</TableHead><TableHead>Accuracy</TableHead><TableHead className="text-right pr-6">Management</TableHead></TableRow></TableHeader>
                <TableBody>{filteredAttempts.map((attempt, idx) => {
                  const studentEnrollment = students?.find(s => s.rollNumber === attempt.studentRollNumber);
                  return (
                    <TableRow key={attempt.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-6 font-bold">{idx <= 2 ? <Trophy className={cn("h-4 w-4", idx===0 ? "text-yellow-500" : idx===1 ? "text-slate-400" : "text-orange-400")} /> : `#${idx+1}`}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{attempt.studentName}</span>
                          <span className="text-[9px] uppercase text-muted-foreground">{attempt.studentRollNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-600">{exams?.find(e => e.id === attempt.examId)?.title || 'Assessment'}</TableCell>
                      <TableCell className="font-black text-primary">{attempt.score} pts</TableCell>
                      <TableCell><Badge variant="outline" className="font-bold text-[10px]">{attempt.percentageScore}%</Badge></TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2">
                          {studentEnrollment && (
                            <Link href={`/center/students/${studentEnrollment.id}/performance`}>
                              <Button variant="ghost" size="sm" className="h-8 gap-2 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50">
                                <LineChart className="h-3.5 w-3.5" /> Analysis
                              </Button>
                            </Link>
                          )}
                          <Link href={`/exam/${attempt.examId}/result?attempt=${attempt.id}`} target="_blank"><Button variant="ghost" size="sm" className="h-8 gap-2 text-[10px] font-bold text-green-600 hover:bg-green-50"><Award className="h-3.5 w-3.5" /> Certificate</Button></Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}</TableBody></Table></div>
            ) : <div className="py-20 text-center text-slate-400 italic">No evaluation records.</div>}
          </CardContent></Card>
        </main>
      </div>
    </div>
  );
}
