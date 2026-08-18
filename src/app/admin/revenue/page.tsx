
"use client";

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Building, 
  Settings, 
  Shield, 
  LogOut, 
  Zap,
  Menu,
  FileText,
  TrendingUp,
  CreditCard,
  DollarSign,
  PieChart,
  Calendar,
  Loader2,
  History,
  Wallet,
  Download,
  Filter,
  CalendarDays,
  Ticket,
  Globe,
  Trophy
} from 'lucide-react';
import { useCollection, useFirestore, useUser, useAuth, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

export default function AdminRevenuePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters State
  const [timeScope, setTimeScope] = useState<'all' | 'specific'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth()).toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [typeFilter, setTypeFilter] = useState<'all' | 'institutional' | 'global_exams'>('all');

  const ADMIN_EMAIL = 'kvikash@gmail.com';

  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router, ADMIN_EMAIL]);

  // Query for Institutional Credit Purchases
  const centersQuery = useMemoFirebase(() => {
    if (isUserLoading || !db || !user?.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
    return collection(db, 'coaching_centers');
  }, [db, user, isUserLoading, ADMIN_EMAIL]);
  const { data: centers, isLoading: centersLoading } = useCollection(centersQuery);

  // Query for Global Exam Attempts (to calculate student-paid revenue)
  const globalAttemptsQuery = useMemoFirebase(() => {
    if (!db || !user?.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
    return query(collection(db, 'exam_attempts'), where('coachingCenterOwnerUserId', '==', user.uid));
  }, [db, user, ADMIN_EMAIL]);
  const { data: globalAttempts, isLoading: attemptsLoading } = useCollection(globalAttemptsQuery);

  // Query for Global Exams (to get prices)
  const globalExamsQuery = useMemoFirebase(() => {
    if (!db || !user?.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
    return query(collection(db, 'exams'), where('isAdminExam', '==', true));
  }, [db, user, ADMIN_EMAIL]);
  const { data: globalExams } = useCollection(globalExamsQuery);

  const financialStats = useMemo(() => {
    if (!centers || !globalAttempts || !globalExams) return null;

    let totalFilteredRevenue = 0;
    let currentMonthTotal = 0;
    let pendingVerification = 0;
    let institutionalRevenue = 0;
    let globalExamRevenue = 0;
    
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const monthlyMap: Record<string, number> = {};
    let allTransactions: any[] = [];

    // Process Institutional Revenue (Credit Topups)
    if (typeFilter === 'all' || typeFilter === 'institutional') {
      centers.forEach(center => {
        if (center.paymentUtr) pendingVerification++;

        (center.paymentHistory || []).forEach((payment: any) => {
          if (payment.status === 'Verified') {
            const amt = Number(payment.amount) || 0;
            const vDate = new Date(payment.verifiedAt);

            // Apply Time Filter
            if (timeScope === 'specific') {
              if (vDate.getFullYear().toString() !== selectedYear || vDate.getMonth().toString() !== selectedMonth) return;
            }

            totalFilteredRevenue += amt;
            institutionalRevenue += amt;

            if (vDate.getFullYear() === thisYear && vDate.getMonth() === thisMonth) {
              currentMonthTotal += amt;
            }

            const monthKey = vDate.toLocaleString('default', { month: 'short', year: '2-digit' });
            monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + amt;

            allTransactions.push({
              ...payment,
              type: 'INSTITUTIONAL',
              source: center.name,
              sourceId: center.id,
              date: vDate
            });
          }
        });
      });
    }

    // Process Global Exam Revenue (Student Direct Payments)
    if (typeFilter === 'all' || typeFilter === 'global_exams') {
      globalAttempts.forEach(attempt => {
        const exam = globalExams.find(e => e.id === attempt.examId);
        if (exam && exam.isPaid && exam.price > 0) {
          const amt = Number(exam.price);
          const vDate = attempt.submittedAt?.toDate ? attempt.submittedAt.toDate() : new Date(attempt.startedAt);

          // Apply Time Filter
          if (timeScope === 'specific') {
            if (vDate.getFullYear().toString() !== selectedYear || vDate.getMonth().toString() !== selectedMonth) return;
          }

          totalFilteredRevenue += amt;
          globalExamRevenue += amt;

          if (vDate.getFullYear() === thisYear && vDate.getMonth() === thisMonth) {
            currentMonthTotal += amt;
          }

          const monthKey = vDate.toLocaleString('default', { month: 'short', year: '2-digit' });
          monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + amt;

          allTransactions.push({
            id: attempt.id,
            type: 'GLOBAL_EXAM',
            source: attempt.studentName,
            sourceId: attempt.studentRollNumber,
            amount: amt,
            utr: attempt.id.substring(0, 12).toUpperCase(), // Simplified for attempts
            date: vDate,
            description: exam.title
          });
        }
      });
    }

    const chartData = Object.entries(monthlyMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => {
        const dateA = new Date(a.name.split(' ')[0] + ' 1, 20' + a.name.split(' ')[1]);
        const dateB = new Date(b.name.split(' ')[0] + ' 1, 20' + b.name.split(' ')[1]);
        return dateA.getTime() - dateB.getTime();
      });

    const sortedTransactions = allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    return { 
      totalFilteredRevenue, 
      currentMonthTotal, 
      pendingVerification, 
      chartData, 
      institutionalRevenue,
      globalExamRevenue,
      transactions: sortedTransactions 
    };
  }, [centers, globalAttempts, globalExams, timeScope, selectedMonth, selectedYear, typeFilter]);

  const handleExport = () => {
    if (!financialStats?.transactions.length) {
      toast({ variant: "destructive", title: "No data to export" });
      return;
    }

    const headers = ["Date", "Type", "Source", "Identifier", "Description", "Amount (INR)"];
    const csvRows = financialStats.transactions.map(tx => [
      tx.date.toLocaleDateString(),
      tx.type,
      `"${tx.source}"`,
      tx.sourceId,
      `"${tx.description || tx.type}"`,
      tx.amount
    ].join(","));

    const fileName = `revenue_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Report Exported" });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth/login');
  };

  const AdminNav = () => (
    <nav className="flex-1 p-4 space-y-2">
      <Link href="/admin/dashboard"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><LayoutDashboard className="h-4 w-4" /> Overview</Button></Link>
      <Link href="/admin/centers"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Building className="h-4 w-4" /> Institutions</Button></Link>
      <Link href="/admin/exams"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Globe className="h-4 w-4" /> Global Exams</Button></Link>
      <Link href="/admin/revenue"><Button variant="secondary" className="w-full justify-start gap-3 text-white"><Wallet className="h-4 w-4" /> Revenue</Button></Link>
      <Link href="/admin/plans"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Zap className="h-4 w-4" /> Plans</Button></Link>
      <Link href="/admin/coupons"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Ticket className="h-4 w-4" /> Coupons</Button></Link>
      <Link href="/admin/pages"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><FileText className="h-4 w-4" /> Pages</Button></Link>
      <Link href="/admin/settings"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Settings className="h-4 w-4" /> Settings</Button></Link>
    </nav>
  );

  if (isUserLoading || centersLoading || attemptsLoading) {
    return <div className="min-h-screen flex items-center justify-center font-bold uppercase tracking-widest text-slate-400">Loading Financial Records...</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col sticky top-0 h-screen shadow-lg">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-headline font-bold text-xl text-primary">Admin Forge</span></div>
        <AdminNav />
        <div className="p-4 border-t border-slate-800"><Button variant="ghost" className="w-full justify-start gap-3 text-red-400" onClick={handleLogout}><LogOut className="h-4 w-4" /> Sign Out</Button></div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-slate-900 text-white flex md:hidden items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-headline font-bold text-lg">Get Exam Admin</span></div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="text-white"><Menu className="h-6 w-6" /></Button></SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-slate-800 text-white"><AdminNav /></SheetContent>
          </Sheet>
        </header>

        <main className="p-4 md:p-10 space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-headline font-bold text-slate-900 tracking-tight">Revenue Dashboard</h1>
              <p className="text-muted-foreground font-medium mt-1">Cross-platform verified payment records & analytics.</p>
            </div>
            <Button variant="outline" onClick={handleExport} className="gap-2 font-bold h-11 border-2 hover:bg-primary hover:text-white transition-all shadow-sm">
              <Download className="h-4 w-4" /> Export Ledger
            </Button>
          </div>

          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-4 flex flex-col xl:flex-row gap-6 items-center">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
                <Filter className="h-4 w-4" /> Filters:
              </div>
              <div className="flex flex-wrap items-center gap-4 flex-1">
                <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                   <SelectTrigger className="w-full md:w-48 font-bold h-11 bg-slate-50 border-none">
                     <SelectValue placeholder="All Revenue" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Total Revenue</SelectItem>
                     <SelectItem value="institutional">Institutional Credits</SelectItem>
                     <SelectItem value="global_exams">Global Test Series</SelectItem>
                   </SelectContent>
                </Select>

                <div className="h-6 w-[1px] bg-slate-200 hidden xl:block mx-2"></div>

                <Select value={timeScope} onValueChange={(v: any) => setTimeScope(v)}>
                  <SelectTrigger className="w-full md:w-40 font-bold h-11 bg-slate-50 border-none">
                    <SelectValue placeholder="Scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="specific">Specific Month</SelectItem>
                  </SelectContent>
                </Select>

                {timeScope === 'specific' && (
                  <div className="flex gap-2">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-36 font-bold h-11 bg-slate-50 border-none">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>{MONTHS.map((m, i) => (<SelectItem key={i} value={i.toString()}>{m}</SelectItem>))}</SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-28 font-bold h-11 bg-slate-50 border-none">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>{YEARS.map(y => (<SelectItem key={y} value={y}>{y}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Net Collection', value: `₹${financialStats?.totalFilteredRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Monthly Goal', value: `₹${financialStats?.currentMonthTotal.toLocaleString()}`, icon: CalendarDays, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Global Series', value: `₹${financialStats?.globalExamRevenue.toLocaleString()}`, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Pending UTR', value: financialStats?.pendingVerification, icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map((stat, i) => (
              <Card key={i} className="border-none shadow-sm rounded-3xl group hover:shadow-md transition-all">
                <CardContent className="p-8 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                    <p className="text-3xl font-headline font-bold text-slate-900 leading-tight">{stat.value}</p>
                  </div>
                  <div className={cn("p-4 rounded-2xl", stat.bg, stat.color)}>
                    <stat.icon className="h-7 w-7" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <Card className="lg:col-span-8 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
               <CardHeader className="p-8 pb-4">
                 <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-headline font-bold flex items-center gap-3">
                      <TrendingUp className="h-6 w-6 text-primary" /> Verified Growth Analysis
                    </CardTitle>
                    <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase text-[9px]">Live Registry</Badge>
                 </div>
               </CardHeader>
               <CardContent className="p-8 pt-0">
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={financialStats?.chartData || []}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8', fontWeight: 'bold'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8', fontWeight: 'bold'}} dx={-10} />
                        <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </CardContent>
            </Card>

            <Card className="lg:col-span-4 border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
               <CardHeader className="p-8">
                 <CardTitle className="text-xl font-headline font-bold flex items-center gap-3">
                   <PieChart className="h-6 w-6 text-primary" /> Source Split
                 </CardTitle>
                 <CardDescription className="text-slate-400">Institutional vs Global Student Payments</CardDescription>
               </CardHeader>
               <CardContent className="p-8 pt-0 space-y-10 relative z-10">
                  {[
                    { label: 'Institutional Credits', value: financialStats?.institutionalRevenue || 0, color: 'bg-primary' },
                    { label: 'Global Exam Sales', value: financialStats?.globalExamRevenue || 0, color: 'bg-emerald-400' }
                  ].map((src, i) => {
                    const pct = financialStats?.totalFilteredRevenue ? (src.value / financialStats.totalFilteredRevenue) * 100 : 0;
                    return (
                      <div key={i} className="space-y-3">
                        <div className="flex justify-between items-end">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{src.label}</p>
                          <p className="text-xl font-bold">₹{src.value.toLocaleString()}</p>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className={cn("h-full transition-all duration-1000", src.color)} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-10 mt-10 border-t border-white/5 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3">Total Verified Revenue</p>
                    <p className="text-6xl font-headline font-bold text-primary tracking-tighter">
                      ₹{financialStats?.totalFilteredRevenue.toLocaleString()}
                    </p>
                  </div>
               </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
               <CardTitle className="text-2xl font-headline font-bold flex items-center gap-3">
                 <History className="h-7 w-7 text-primary" /> Transaction Registry
               </CardTitle>
               <Badge variant="outline" className="h-8 px-4 font-black uppercase text-[10px] border-slate-200">
                  {financialStats?.transactions.length || 0} Entries
               </Badge>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto">
                 <Table>
                   <TableHeader>
                     <TableRow className="bg-slate-50/50">
                        <TableHead className="pl-8 py-5 font-black uppercase text-[10px]">Date</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Revenue Stream</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Source / Candidate</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Transaction (UTR/ID)</TableHead>
                        <TableHead className="text-right pr-8 font-black uppercase text-[10px]">Amount</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {financialStats?.transactions.map((tx, i) => (
                       <TableRow key={i} className="hover:bg-slate-50/30 transition-colors">
                         <TableCell className="pl-8 py-6 font-bold text-slate-900">{tx.date.toLocaleDateString()}</TableCell>
                         <TableCell>
                           <Badge variant="outline" className={cn(
                             "font-black text-[9px] uppercase",
                             tx.type === 'GLOBAL_EXAM' ? "border-emerald-200 text-emerald-600 bg-emerald-50" : "border-primary/20 text-primary bg-primary/5"
                           )}>
                             {tx.type === 'GLOBAL_EXAM' ? 'Student Payment' : 'Institutional Credit'}
                           </Badge>
                         </TableCell>
                         <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-slate-700">{tx.source}</span>
                              <span className="text-[10px] text-slate-400 font-medium uppercase">{tx.description || tx.sourceId?.substring(0, 10)}</span>
                            </div>
                         </TableCell>
                         <TableCell><code className="text-xs font-mono text-slate-500 font-bold bg-slate-50 px-2 py-1 rounded-md">{tx.utr}</code></TableCell>
                         <TableCell className="text-right pr-8"><span className="text-lg font-black text-slate-900">₹{tx.amount}</span></TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
