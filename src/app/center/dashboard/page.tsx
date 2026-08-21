
"use client";

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Plus, 
  BarChart, 
  Shield, 
  LogOut,
  Menu,
  Loader2,
  ChevronRight,
  Activity,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  UserPlus,
  Megaphone,
  X,
  Bell
} from 'lucide-react';
import { 
  useCollection, 
  useDoc, 
  useFirestore, 
  useUser, 
  useAuth, 
  useMemoFirebase,
  updateDocumentNonBlocking
} from '@/firebase';
import { collection, query, where, doc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CenterDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dismissedBroadcasts, setDismissedBroadcasts] = useState<string[]>([]);

  const centerId = user?.uid;

  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous)) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router]);

  const configRef = useMemoFirebase(() => db ? doc(db, 'platformConfig', 'settings') : null, [db]);
  const { data: config } = useDoc(configRef);
  const siteName = config?.siteName || "Get Exam";

  // Center Profile
  const centerProfileRef = useMemoFirebase(() => {
    if (!db || !centerId) return null;
    return doc(db, 'coaching_centers', centerId);
  }, [db, centerId]);
  const { data: centerProfile, isLoading: profileLoading } = useDoc(centerProfileRef);

  // Exams Query
  const examsQuery = useMemoFirebase(() => {
    if (!db || !centerId) return null;
    return query(collection(db, 'exams'), where('coachingCenterId', '==', centerId));
  }, [db, centerId]);
  const { data: exams, isLoading: examsLoading } = useCollection(examsQuery);

  // Broadcasts Query (Global Alerts & Private Notices)
  const broadcastsQuery = useMemoFirebase(() => {
    if (!db || !centerId) return null;
    return query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'), limit(5));
  }, [db, centerId]);
  const { data: allBroadcasts } = useCollection(broadcastsQuery);

  const activeBroadcasts = useMemo(() => {
    if (!allBroadcasts) return [];
    return allBroadcasts.filter(b => {
      const isDismissed = dismissedBroadcasts.includes(b.id);
      const isGlobal = b.type === 'global-alert';
      const isTargeted = b.type === 'private-notice' && b.targetCenterId === centerId;
      return !isDismissed && (isGlobal || isTargeted);
    });
  }, [allBroadcasts, dismissedBroadcasts, centerId]);

  const handleDismissBroadcast = (id: string) => {
    setDismissedBroadcasts(prev => [...prev, id]);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth/login');
  };

  const NavItems = () => (
    <nav className="flex-1 p-4 space-y-1.5">
      <Link href="/center/dashboard"><Button variant="secondary" className="w-full justify-start gap-3 bg-primary/10 text-primary"><LayoutDashboard className="h-4 w-4" /> Console Home</Button></Link>
      <Link href="/center/students"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-600"><Users className="h-4 w-4" /> Student Manager</Button></Link>
      <Link href="/center/exams"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-600"><FileText className="h-4 w-4" /> Exam Manager</Button></Link>
      <Link href="/center/results"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-600"><BarChart className="h-4 w-4" /> Reports</Button></Link>
      <Link href="/center/profile"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-600"><Settings className="h-4 w-4" /> Center Profile</Button></Link>
    </nav>
  );

  if (isUserLoading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>;
  }

  const credits = centerProfile?.availableCredits || 0;

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col sticky top-0 h-screen shadow-sm">
        <div className="p-6 border-b flex items-center gap-3">
          {config?.platformLogoUrl ? (
            <img src={config.platformLogoUrl} alt="Logo" className="h-8 w-auto object-contain" />
          ) : <Shield className="h-5 w-5 text-primary" />}
          <span className="font-headline font-bold text-xl">{siteName}</span>
        </div>
        <NavItems />
        <div className="mt-auto p-4 border-t"><Button variant="ghost" className="w-full justify-start gap-3 text-red-600" onClick={handleLogout}><LogOut className="h-4 w-4" /> Log Out</Button></div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex md:hidden items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            {config?.platformLogoUrl ? (
              <img src={config.platformLogoUrl} alt="Logo" className="h-6 w-auto object-contain" />
            ) : <Shield className="h-5 w-5 text-primary" />}
            <span className="font-headline font-bold text-lg">{siteName}</span>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu className="h-6 w-6" /></Button></SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <div className="p-6 border-b flex items-center gap-3">
                {config?.platformLogoUrl ? (
                  <img src={config.platformLogoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                ) : <Shield className="h-5 w-5 text-primary" />}
                <span className="font-headline font-bold text-xl">{siteName}</span>
              </div>
              <NavItems />
            </SheetContent>
          </Sheet>
        </header>

        <main className="p-4 md:p-10 max-w-[1600px] mx-auto w-full space-y-8">
          
          {/* Admin Broadcasts Section */}
          {activeBroadcasts.length > 0 && (
            <div className="space-y-3">
              {activeBroadcasts.map((b) => (
                <div 
                  key={b.id} 
                  className={cn(
                    "relative overflow-hidden rounded-3xl border-2 p-6 flex flex-col md:flex-row items-center gap-4 transition-all animate-in slide-in-from-top-4",
                    b.type === 'global-alert' ? "bg-indigo-50 border-indigo-100 text-indigo-900" : "bg-orange-50 border-orange-100 text-orange-900"
                  )}
                >
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                    b.type === 'global-alert' ? "bg-indigo-600 text-white" : "bg-orange-600 text-white"
                  )}>
                    {b.type === 'global-alert' ? <Megaphone className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
                  </div>
                  <div className="flex-1 text-center md:text-left space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                      {b.type === 'global-alert' ? 'System Announcement' : 'Institutional Notice'}
                    </p>
                    <p className="text-sm md:text-base font-bold leading-relaxed">{b.message}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 hover:bg-black/5 rounded-full" 
                    onClick={() => handleDismissBroadcast(b.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {centerProfile?.paymentStatus === 'Pending Verification' && (
            <div className="bg-orange-50 rounded-3xl p-6 border-2 border-orange-100 flex items-center justify-between shadow-sm">
               <div className="flex gap-4 items-center">
                 <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                   <Clock className="h-8 w-8" />
                 </div>
                 <div>
                   <h4 className="text-xl font-black text-orange-900 uppercase">Verification Pending</h4>
                   <p className="text-sm font-medium text-orange-700">Transaction ID (UTR): <span className="font-black underline">{centerProfile.paymentUtr}</span></p>
                   <p className="text-[10px] font-bold text-orange-600/60 uppercase mt-1">Requested for {centerProfile.requestedCredits} credits • Amount: ₹{centerProfile.requestedFinalAmount}</p>
                   <p className="text-sm font-bold text-orange-800 mt-2">Your credits will be added to your account shortly.</p>
                 </div>
               </div>
               <Badge className="bg-orange-600 text-white font-black px-6 py-2 rounded-xl text-xs">AWAITING ADMIN ACTION</Badge>
            </div>
          )}

          {credits < 50 && (
            <Alert className="rounded-3xl border-2 shadow-sm bg-orange-50 border-orange-200">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-6 w-6 text-orange-600" />
                <div className="flex-1">
                  <AlertTitle className="font-bold">Low Credit Balance</AlertTitle>
                  <AlertDescription className="text-sm font-medium opacity-80">
                    You have only {credits} student credits left. Top-up now to avoid disruption in upcoming exams.
                  </AlertDescription>
                </div>
                <Link href="/pricing"><Button variant="default" size="sm" className="rounded-xl font-bold bg-orange-600 hover:bg-orange-700">Top-up Now</Button></Link>
              </div>
            </Alert>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-4xl font-headline font-bold text-slate-900">Console Dashboard</h1>
              <p className="text-slate-500 font-medium">Managing <b>{centerProfile?.name || 'Your Institutional'}</b> Portal.</p>
            </div>
            <Link href="/center/exams/create">
              <Button className="font-bold gap-2 h-12 px-8 rounded-xl shadow-lg shadow-primary/20"><Plus className="h-5 w-5" /> New Assessment</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <Card className="md:col-span-4 border-none shadow-xl rounded-[2rem] bg-slate-900 text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                   <Zap className="h-32 w-32 text-primary" />
                </div>
                <CardHeader className="relative z-10">
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Student Balance</p>
                   <CardTitle className="text-5xl font-headline font-bold tracking-tighter">{credits}</CardTitle>
                   <CardDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Available Credits</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 pt-4">
                   <Link href="/pricing" className="block w-full">
                      <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl h-12 shadow-xl shadow-primary/20">
                         Purchase Credits <TrendingUp className="ml-2 h-4 w-4" />
                      </Button>
                   </Link>
                </CardContent>
                <div className="p-4 bg-white/5 border-t border-white/5 text-[9px] font-bold text-center text-slate-500 uppercase tracking-widest">
                   Lifetime Validity Enabled
                </div>
            </Card>

            <Card className="md:col-span-8 border-none shadow-sm overflow-hidden rounded-[2rem] bg-white">
              <CardHeader className="border-b py-6 px-8 flex flex-row items-center justify-between">
                <CardTitle className="font-headline font-bold text-xl flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Recent Assessments</CardTitle>
                <Badge variant="outline" className="font-bold border-primary/20 text-primary">{exams?.length || 0} Total</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {examsLoading ? <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div> : exams && exams.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow className="bg-slate-50/50"><TableHead className="px-8">Title</TableHead><TableHead>Capacity</TableHead><TableHead className="text-right pr-8">Audit</TableHead></TableRow></TableHeader>
                    <TableBody>{exams.slice(0, 5).map(e => (
                      <TableRow key={e.id} className="hover:bg-slate-50 border-b">
                        <TableCell className="px-8 font-bold text-slate-900">{e.title}</TableCell>
                        <TableCell>
                           <Badge variant="outline" className="text-[10px] font-bold">{e.studentCapacity || 'N/A'} Slots</Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8"><Link href={`/center/exams/${e.id}/monitoring`}><Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary"><ChevronRight className="h-5 w-5" /></Button></Link></TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                ) : (
                  <div className="py-20 text-center text-slate-400 italic space-y-4">
                     <FileText className="h-10 w-10 mx-auto opacity-10" />
                     <p>No assessments available. Start by creating one.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                   <UserPlus className="h-7 w-7" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrolled Students</p>
                   <p className="text-2xl font-black text-slate-900">{centerProfile?.totalStudents || 0}</p>
                </div>
             </div>
             <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                   <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exams Conducted</p>
                   <p className="text-2xl font-black text-slate-900">{exams?.length || 0}</p>
                </div>
             </div>
             <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-inner">
                   <Shield className="h-7 w-7" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Sessions</p>
                   <p className="text-2xl font-black text-slate-900">{exams?.filter(e => e.videoProctoringEnabled).length || 0}</p>
                </div>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}
