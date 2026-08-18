"use client";

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Building, 
  Settings, 
  Shield, 
  LogOut, 
  Zap,
  Menu,
  Activity,
  Loader2,
  TrendingUp,
  CreditCard,
  DollarSign,
  Calendar,
  Wallet,
  FileText,
  MessageSquare,
  Trash2,
  Clock,
  Globe,
  Ticket
} from 'lucide-react';
import { useCollection, useFirestore, useUser, useAuth, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, serverTimestamp, query, orderBy, limit, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [isBroadcasting, setIsBroadcastLoading] = useState(false);

  const ADMIN_EMAIL = 'kvikash@gmail.com';

  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router, ADMIN_EMAIL]);

  const configRef = useMemoFirebase(() => {
    if (!db || !user?.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
    return doc(db, 'platformConfig', 'settings');
  }, [db, user, ADMIN_EMAIL]);
  const { data: config } = useDoc(configRef);
  const siteName = config?.siteName || "Get Exam";

  const centersQuery = useMemoFirebase(() => {
    if (isUserLoading || !db || !user?.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
    return collection(db, 'coaching_centers');
  }, [db, user, isUserLoading, ADMIN_EMAIL]);
  const { data: centers } = useCollection(centersQuery);

  const broadcastsQuery = useMemoFirebase(() => {
    if (!db || !user?.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
    return query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'), limit(10));
  }, [db, user, ADMIN_EMAIL]);
  const { data: recentBroadcasts, isLoading: broadcastsLoading } = useCollection(broadcastsQuery);

  const financialData = useMemo(() => {
    if (!centers) return null;

    let totalAllTime = 0;
    let currentMonth = 0;
    let pendingVerification = 0;
    
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const monthlyBreakdown: Record<string, number> = {};

    centers.forEach(center => {
      if (center.paymentUtr) pendingVerification++;

      (center.paymentHistory || []).forEach((payment: any) => {
        if (payment.status === 'Verified') {
          const amt = Number(payment.amount) || 0;
          const vDate = new Date(payment.verifiedAt);
          
          totalAllTime += amt;

          if (vDate.getFullYear() === thisYear && vDate.getMonth() === thisMonth) {
            currentMonth += amt;
          }

          const monthKey = vDate.toLocaleString('default', { month: 'short', year: '2-digit' });
          monthlyBreakdown[monthKey] = (monthlyBreakdown[monthKey] || 0) + amt;
        }
      });
    });

    const chartData = Object.entries(monthlyBreakdown)
      .map(([name, total]) => ({ name, total }))
      .slice(-6);

    return { totalAllTime, currentMonth, pendingVerification, chartData };
  }, [centers]);

  const handleBroadcast = async () => {
    if (!broadcastText.trim() || !db || !user) return;
    setIsBroadcastLoading(true);
    try {
      addDocumentNonBlocking(collection(db, 'broadcasts'), {
        message: broadcastText,
        authorId: user.uid,
        authorEmail: user.email,
        type: 'global-alert',
        createdAt: serverTimestamp(),
      });
      toast({ title: "Broadcast Sent" });
      setBroadcastText('');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    } finally {
      setIsBroadcastLoading(false);
    }
  };

  const deleteBroadcast = (id: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'broadcasts', id));
    toast({ title: "Broadcast Removed" });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth/login');
  };

  const AdminNav = () => (
    <nav className="flex-1 p-4 space-y-2">
      <Link href="/admin/dashboard"><Button variant="secondary" className="w-full justify-start gap-3 text-white"><LayoutDashboard className="h-4 w-4" /> Overview</Button></Link>
      <Link href="/admin/centers"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Building className="h-4 w-4" /> Institutions</Button></Link>
      <Link href="/admin/exams"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Globe className="h-4 w-4" /> Global Exams</Button></Link>
      <Link href="/admin/revenue"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Wallet className="h-4 w-4" /> Revenue</Button></Link>
      <Link href="/admin/plans"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Zap className="h-4 w-4" /> Plans</Button></Link>
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
        <div className="p-6 border-b border-slate-800 flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-headline font-bold text-xl text-primary">{siteName} Admin</span></div>
        <AdminNav />
        <div className="p-4 border-t border-slate-800"><Button variant="ghost" className="w-full justify-start gap-3 text-red-400" onClick={handleLogout}><LogOut className="h-4 w-4" /> Sign Out</Button></div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-slate-900 text-white flex md:hidden items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-headline font-bold text-lg">{siteName} Admin</span></div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="text-white"><Menu className="h-6 w-6" /></Button></SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-slate-800 text-white"><AdminNav /></SheetContent>
          </Sheet>
        </header>

        <main className="p-4 md:p-8 overflow-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-headline font-bold">Platform Overview</h1>
              <p className="text-muted-foreground text-sm">Welcome back, Administrator.</p>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-600">Period: FY {new Date().getFullYear()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Institutions', value: centers?.length.toString() || '0', icon: Building, color: 'text-blue-600' },
              { label: 'Total Revenue', value: `₹${financialData?.totalAllTime.toLocaleString() || '0'}`, icon: DollarSign, color: 'text-green-600' },
              { label: 'Monthly Goal', value: `₹${financialData?.currentMonth.toLocaleString() || '0'}`, icon: TrendingUp, color: 'text-purple-600' },
              { label: 'Pending UTR', value: financialData?.pendingVerification.toString() || '0', icon: CreditCard, color: 'text-orange-600' },
            ].map((stat, i) => (
              <Card key={i} className="border-none shadow-sm group hover:shadow-md transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-headline font-bold mt-1 text-slate-900">{stat.value}</p>
                  </div>
                  <div className={cn("p-3 rounded-2xl bg-slate-50", stat.color)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-headline flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" /> Verified Collections
                  </CardTitle>
                  <Link href="/admin/revenue"><Button variant="ghost" size="sm" className="text-xs font-bold text-primary">View Deep Analytics</Button></Link>
                </div>
              </CardHeader>
              <CardContent className="p-8 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financialData?.chartData || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-primary text-primary-foreground rounded-[2rem] relative overflow-hidden flex flex-col justify-center">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Activity className="h-32 w-32" /></div>
               <CardHeader>
                 <CardTitle className="font-headline font-bold">Admin Broadcast</CardTitle>
                 <CardDescription className="text-primary-foreground/70">Update all institutes globally</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4 relative z-10">
                 <textarea 
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 rounded-xl p-4 text-sm min-h-[100px] outline-none" 
                    placeholder="System alert text..." 
                    value={broadcastText} 
                    onChange={(e) => setBroadcastText(e.target.value)} 
                 />
                 <Button className="w-full bg-white text-primary hover:bg-slate-50 font-black h-11" onClick={handleBroadcast} disabled={isBroadcasting || !broadcastText.trim()}>
                   {isBroadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Dispatch Global Alert"}
                 </Button>
               </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-8">
             <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                <CardHeader className="p-8 border-b bg-slate-50/50">
                   <div className="flex items-center justify-between">
                     <CardTitle className="text-lg font-headline flex items-center gap-2">
                       <MessageSquare className="h-5 w-5 text-primary" /> System Broadcast Ledger
                     </CardTitle>
                     <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest border-primary/20 text-primary">Announcement Archive</Badge>
                   </div>
                   <CardDescription>Recently dispatched system-wide announcements and alerts.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                   {broadcastsLoading ? (
                     <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
                   ) : recentBroadcasts && recentBroadcasts.length > 0 ? (
                     <div className="divide-y">
                        {recentBroadcasts.map((b) => (
                          <div key={b.id} className="p-6 flex items-start justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex gap-4">
                               <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                 <Activity className="h-5 w-5" />
                               </div>
                               <div className="space-y-1">
                                  <p className="text-sm font-medium text-slate-900 leading-relaxed">{b.message}</p>
                                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <Clock className="h-3 w-3" /> 
                                    {b.createdAt?.toMillis ? new Date(b.createdAt.toMillis()).toLocaleString() : 'Just now'}
                                    <span>•</span>
                                    <span>Global Alert</span>
                                  </div>
                               </div>
                            </div>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 h-8 w-8" onClick={() => deleteBroadcast(b.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div className="py-20 text-center text-slate-400 italic font-medium">No global broadcasts found in registry.</div>
                   )}
                </CardContent>
             </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
