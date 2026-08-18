
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  LayoutDashboard, 
  Building, 
  Settings, 
  Shield, 
  LogOut, 
  Zap,
  Plus,
  FileText,
  Search,
  Globe,
  Users,
  Activity,
  ChevronRight,
  Eye,
  EyeOff,
  Ticket,
  Wallet,
  Menu,
  Loader2,
  Trophy
} from 'lucide-react';
import { 
  useCollection, 
  useFirestore, 
  useAuth, 
  useUser,
  useMemoFirebase,
  updateDocumentNonBlocking
} from '@/firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export default function AdminExamsPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const ADMIN_EMAIL = 'kvikash@gmail.com';

  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router, ADMIN_EMAIL]);

  const examsQuery = useMemoFirebase(() => {
    if (!db || !user?.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
    return query(collection(db, 'exams'), where('isAdminExam', '==', true));
  }, [db, user, ADMIN_EMAIL]);
  
  const { data: exams, isLoading } = useCollection(examsQuery);

  const allAttemptsQuery = useMemoFirebase(() => {
    if (!db || !user?.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
    return query(collection(db, 'exam_attempts'), where('coachingCenterOwnerUserId', '==', user.uid));
  }, [db, user, ADMIN_EMAIL]);
  const { data: allAttempts } = useCollection(allAttemptsQuery);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth/login');
  };

  const toggleVisibility = (id: string, currentStatus: string) => {
    if (!db || !id) return;
    
    const newStatus = currentStatus === 'Active' ? 'Draft' : 'Active';
    const examRef = doc(db, 'exams', id);
    
    updateDocumentNonBlocking(examRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    toast({ 
      title: newStatus === 'Active' ? "Exam Published" : "Exam Hidden", 
      description: newStatus === 'Active' ? "Now visible on public portal." : "Hidden from public and links disabled." 
    });
  };

  const filteredExams = useMemo(() => {
    if (!exams) return [];
    return exams.filter(e => 
      e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [exams, searchTerm]);

  const AdminNav = () => (
    <nav className="flex-1 p-4 space-y-2">
      <Link href="/admin/dashboard"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><LayoutDashboard className="h-4 w-4" /> Overview</Button></Link>
      <Link href="/admin/centers"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Building className="h-4 w-4" /> Institutions</Button></Link>
      <Link href="/admin/exams"><Button variant="secondary" className="w-full justify-start gap-3 text-white"><Globe className="h-4 w-4" /> Global Exams</Button></Link>
      <Link href="/admin/revenue"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Wallet className="h-4 w-4" /> Revenue</Button></Link>
      <Link href="/admin/plans"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Zap className="h-4 w-4" /> Plans</Button></Link>
      <Link href="/admin/coupons"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Ticket className="h-4 w-4" /> Coupons</Button></Link>
      <Link href="/admin/pages"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><FileText className="h-4 w-4" /> Pages</Button></Link>
      <Link href="/admin/settings"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Settings className="h-4 w-4" /> Settings</Button></Link>
    </nav>
  );

  if (isUserLoading || !user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return <div className="min-h-screen flex items-center justify-center font-bold uppercase tracking-widest text-slate-400">Verifying Authority...</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col sticky top-0 h-screen shadow-lg">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-headline font-bold text-xl text-primary">Admin Forge</span></div>
        <AdminNav />
        <div className="p-4 border-t border-slate-800"><Button variant="ghost" className="w-full justify-start gap-3 text-red-400" onClick={handleLogout}><LogOut className="h-4 w-4" /> Sign Out</Button></div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-slate-900 text-white flex md:hidden items-center justify-between px-4 sticky top-0 z-40 shadow-md">
          <div className="flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-headline font-bold text-lg">Admin Console</span></div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="text-white"><Menu className="h-6 w-6" /></Button></SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-slate-800 text-white"><AdminNav /></SheetContent>
          </Sheet>
        </header>

        <main className="p-4 md:p-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold text-slate-900">Global Assessments</h1>
              <p className="text-muted-foreground font-medium">Manage visibility, monitoring and student results of board exams.</p>
            </div>
            <Link href="/admin/exams/create">
              <Button className="gap-2 font-black h-12 px-8 rounded-xl shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Create Global Exam
              </Button>
            </Link>
          </div>

          <Card className="border-none shadow-sm mb-6">
            <CardHeader className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input placeholder="Filter by title or subject..." className="pl-10 h-12 bg-slate-50 border-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </CardHeader>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden rounded-[2rem] bg-white">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
              ) : filteredExams.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="pl-8 font-black uppercase text-[10px] py-5">Assessment</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Pricing</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Portal Visibility</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Attempts</TableHead>
                        <TableHead className="text-right pr-8 font-black uppercase text-[10px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExams.map((e) => {
                        const attemptCount = allAttempts?.filter(a => a.examId === e.id).length || 0;
                        return (
                        <TableRow key={e.id} className="hover:bg-slate-50/50 transition-colors group">
                          <TableCell className="pl-8 py-5">
                             <div className="flex flex-col">
                               <span className="font-bold text-slate-900">{e.title}</span>
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{e.subject}</span>
                             </div>
                          </TableCell>
                          <TableCell>
                             {e.isPaid ? (
                               <Badge className="bg-emerald-500 text-white font-black">₹{e.price}</Badge>
                             ) : (
                               <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 font-black">FREE</Badge>
                             )}
                          </TableCell>
                          <TableCell>
                             {e.status === 'Active' ? (
                               <Badge className="bg-green-50 text-green-700 border-green-200 font-bold uppercase text-[9px] tracking-widest px-3 h-6"><Eye className="h-3 w-3 mr-1.5" /> Published</Badge>
                             ) : (
                               <Badge variant="outline" className="text-slate-400 font-bold uppercase text-[9px] tracking-widest px-3 h-6"><EyeOff className="h-3 w-3 mr-1.5" /> Hidden</Badge>
                             )}
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-2">
                               <Users className="h-3 w-3 text-primary" />
                               <span className="text-sm font-black text-slate-900">{attemptCount}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <div className="flex justify-end gap-2">
                               <Link href={`/admin/exams/${e.id}/results`}>
                                 <Button variant="ghost" size="sm" title="View Student Results" className="text-blue-600 hover:bg-blue-50 h-9 gap-2 font-bold text-[10px] uppercase">
                                   <Trophy className="h-3.5 w-3.5" /> Results
                                 </Button>
                               </Link>
                               <Link href={`/admin/exams/${e.id}/monitoring`}>
                                 <Button variant="ghost" size="icon" title="Live Monitoring" className="text-orange-500 hover:bg-orange-50 h-9 w-9">
                                   <Activity className="h-4 w-4" />
                                 </Button>
                               </Link>
                               <Button 
                                 type="button"
                                 variant="ghost" 
                                 size="icon" 
                                 title={e.status === 'Active' ? "Hide Exam" : "Publish Exam"}
                                 className={cn(
                                   "h-9 w-9 transition-colors",
                                   e.status === 'Active' ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"
                                 )}
                                 onClick={() => toggleVisibility(e.id, e.status)}
                               >
                                 {e.status === 'Active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                               </Button>
                             </div>
                          </TableCell>
                        </TableRow>
                      )})}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-24 text-center text-slate-400 italic">No global exams found. Create your first one above.</div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
