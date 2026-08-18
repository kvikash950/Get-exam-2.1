
"use client";

import { useState, useEffect } from 'react';
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
  Search,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Zap,
  Menu,
  Fingerprint,
  Calendar,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Loader2,
  Wallet,
  AlertCircle,
  Ticket
} from 'lucide-react';
import { 
  useCollection, 
  useFirestore, 
  useAuth, 
  useUser,
  useMemoFirebase,
  updateDocumentNonBlocking
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export default function AdminCentersPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const ADMIN_EMAIL = 'kvikash@gmail.com';

  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router, ADMIN_EMAIL]);

  const centersQuery = useMemoFirebase(() => {
    if (isUserLoading || !db || !user?.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
    return collection(db, 'coaching_centers');
  }, [db, user, isUserLoading, ADMIN_EMAIL]);
  
  const { data: centers, isLoading } = useCollection(centersQuery);

  const plansQuery = useMemoFirebase(() => db ? collection(db, 'subscriptionPlans') : null, [db]);
  const { data: globalPlans } = useCollection(plansQuery);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/auth/login');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Logout failed", description: error.message });
    }
  };

  const toggleCenterStatus = (centerId: string, currentStatus: boolean) => {
    if (!db) return;
    const centerRef = doc(db, 'coaching_centers', centerId);
    updateDocumentNonBlocking(centerRef, {
      isActive: !currentStatus,
      updatedAt: new Date().toISOString()
    });
    toast({ title: !currentStatus ? "Center Activated" : "Center Suspended" });
  };

  const filteredCenters = centers?.filter(center => {
    const effectiveCode = center.centerCode || `MX-${center.id.substring(0, 6).toUpperCase()}`;
    const matchesSearch = 
      center.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      center.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      effectiveCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = center.isActive;
    else if (statusFilter === 'suspended') matchesStatus = !center.isActive;
    else if (statusFilter === 'pending') matchesStatus = !!center.paymentUtr;

    return matchesSearch && matchesStatus;
  }) || [];

  const pendingCount = centers?.filter(c => !!c.paymentUtr).length || 0;

  const AdminNav = () => (
    <nav className="flex-1 p-4 space-y-2">
      <Link href="/admin/dashboard"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><LayoutDashboard className="h-4 w-4" /> Overview</Button></Link>
      <Link href="/admin/centers"><Button variant="secondary" className="w-full justify-start gap-3 text-white"><Building className="h-4 w-4" /> Institutions</Button></Link>
      <Link href="/admin/revenue"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Wallet className="h-4 w-4" /> Revenue</Button></Link>
      <Link href="/admin/plans"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Zap className="h-4 w-4" /> Plans</Button></Link>
      <Link href="/admin/coupons"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Ticket className="h-4 w-4" /> Coupons</Button></Link>
      <Link href="/admin/pages"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><FileText className="h-4 w-4" /> Pages</Button></Link>
      <Link href="/admin/settings"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Settings className="h-4 w-4" /> Settings</Button></Link>
    </nav>
  );

  if (isUserLoading || !user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-slate-400">Authenticating Authority...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col sticky top-0 h-screen">
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

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div><h1 className="text-2xl md:text-3xl font-headline font-bold text-slate-900">Institutional Audit</h1><p className="text-muted-foreground text-sm">Review registries, verify payments, and manage center access.</p></div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 px-4 py-1 font-bold">{centers?.length || 0} Global Entries</Badge>
          </div>

          <Card className="border-none shadow-sm mb-8">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name, email or MX code..." className="pl-10 h-11 bg-slate-50 border-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')} className="font-bold h-11 px-6">All</Button>
                  
                  <Button 
                    variant={statusFilter === 'pending' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setStatusFilter('pending')} 
                    className={cn(
                      "font-black h-11 px-6 gap-2",
                      statusFilter === 'pending' ? "bg-orange-600 hover:bg-orange-700" : "text-orange-600 border-orange-200 hover:bg-orange-50"
                    )}
                  >
                    <AlertCircle className="h-4 w-4" /> 
                    Verification Req. 
                    {pendingCount > 0 && <Badge className="bg-white text-orange-600 ml-1 h-5 min-w-[20px] p-0 flex items-center justify-center font-black">{pendingCount}</Badge>}
                  </Button>

                  <Button variant={statusFilter === 'active' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('active')} className="font-bold h-11 px-6">Active</Button>
                  <Button variant={statusFilter === 'suspended' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('suspended')} className="font-bold h-11 px-6 text-destructive">Suspended</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden"><CardContent className="p-0">
            {isLoading ? <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div> : filteredCenters.length > 0 ? (
              <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-slate-50/50"><TableHead className="pl-6">Institution / Owner</TableHead><TableHead>Tier</TableHead><TableHead>Plan Expiry</TableHead><TableHead>Payment Status</TableHead><TableHead>Account Status</TableHead><TableHead className="text-right pr-6">Audit View</TableHead></TableRow></TableHeader><TableBody>{filteredCenters.map((center) => {
                const planDoc = globalPlans?.find(p => p.id === center.subscriptionPlanId);
                const planDisplayName = planDoc?.name || center.subscriptionPlanId?.replace('-tier', '').toUpperCase() || 'STARTER';
                return (
                <TableRow key={center.id} className="hover:bg-slate-50/50 group">
                  <TableCell className="pl-6"><div className="flex flex-col"><span className="font-bold text-slate-900 text-sm">{center.name}</span><div className="flex items-center gap-2 text-[10px] text-muted-foreground"><Fingerprint className="h-2 w-2" /> {center.centerCode || 'MX-N/A'} • {center.ownerName}</div></div></TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary">{planDisplayName}</Badge></TableCell>
                  <TableCell>
                    {center.planExpiresAt ? (
                      <div className={cn(
                        "text-[10px] font-bold flex items-center gap-1",
                        new Date(center.planExpiresAt) < new Date() ? "text-red-500" : "text-slate-600"
                      )}>
                        <Clock className="h-3 w-3" />
                        {new Date(center.planExpiresAt).toLocaleDateString()}
                      </div>
                    ) : <span className="text-[10px] text-slate-400">Lifetime</span>}
                  </TableCell>
                  <TableCell>
                    {center.paymentUtr ? (
                      <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                         <span className="text-[10px] font-black text-orange-600 uppercase">Verification Req.</span>
                      </div>
                    ) : (
                      <span className={`text-[10px] font-bold uppercase ${center.paymentStatus === 'Verified' ? 'text-green-600' : 'text-slate-400'}`}>{center.paymentStatus || 'No Request'}</span>
                    )}
                  </TableCell>
                  <TableCell>{center.isActive ? <div className="text-green-600 text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Active</div> : <div className="text-red-500 text-[10px] font-bold flex items-center gap-1"><XCircle className="h-3 w-3" /> Suspended</div>}</TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end items-center gap-2">
                      <Link href={`/admin/centers/${center.id}`}>
                        <Button variant="ghost" size="sm" className="gap-2 font-bold text-[10px] uppercase text-primary hover:bg-primary/5">
                          Audit Profile <ChevronRight className="h-3 w-3" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className={center.isActive ? "text-destructive font-bold" : "text-green-600 font-bold"} onClick={() => toggleCenterStatus(center.id, center.isActive)}>{center.isActive ? "Suspend Access" : "Restore Access"}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )})}</TableBody></Table></div>
            ) : <div className="py-24 text-center italic text-slate-400">No institutions found for the current filter.</div>}
          </CardContent></Card>
        </main>
      </div>
    </div>
  );
}
