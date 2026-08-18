
"use client";

import { useState, useEffect } from 'react';
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
  Plus,
  Trash2,
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  Menu,
  FileText,
  Wallet,
  Loader2,
  Calendar
} from 'lucide-react';
import { 
  useCollection, 
  useFirestore, 
  useAuth, 
  useUser,
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase';
import { collection, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function AdminCouponsPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discountPercent: 10,
    expiryDate: '',
    isActive: true
  });

  const ADMIN_EMAIL = 'kvikash@gmail.com';

  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router, ADMIN_EMAIL]);

  const couponsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
  }, [db, user]);
  
  const { data: coupons, isLoading } = useCollection(couponsQuery);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.code.trim()) return;

    setLoading(true);
    try {
      const colRef = collection(db, 'coupons');
      await addDocumentNonBlocking(colRef, {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        discountPercent: Number(formData.discountPercent),
        createdAt: serverTimestamp(),
      });
      toast({ title: "Coupon Created", description: `Code ${formData.code.toUpperCase()} is now live.` });
      setIsAddOpen(false);
      setFormData({ code: '', discountPercent: 10, expiryDate: '', isActive: true });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (id: string, current: boolean) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'coupons', id), { isActive: !current });
    toast({ title: "Status Updated" });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    if (confirm("Delete this coupon permanently?")) {
      deleteDocumentNonBlocking(doc(db, 'coupons', id));
      toast({ title: "Coupon Removed" });
    }
  };

  const AdminNav = () => (
    <nav className="flex-1 p-4 space-y-2">
      <Link href="/admin/dashboard"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><LayoutDashboard className="h-4 w-4" /> Overview</Button></Link>
      <Link href="/admin/centers"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Building className="h-4 w-4" /> Institutions</Button></Link>
      <Link href="/admin/revenue"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Wallet className="h-4 w-4" /> Revenue</Button></Link>
      <Link href="/admin/plans"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Zap className="h-4 w-4" /> Plans</Button></Link>
      <Link href="/admin/coupons"><Button variant="secondary" className="w-full justify-start gap-3 text-white"><Ticket className="h-4 w-4" /> Coupons</Button></Link>
      <Link href="/admin/pages"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><FileText className="h-4 w-4" /> Pages</Button></Link>
      <Link href="/admin/settings"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Settings className="h-4 w-4" /> Settings</Button></Link>
    </nav>
  );

  if (isUserLoading || !user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return <div className="min-h-screen flex items-center justify-center font-bold uppercase tracking-widest text-slate-400">Verifying Authority...</div>;

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

        <main className="p-4 md:p-10 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold">Discount Management</h1>
              <p className="text-muted-foreground font-medium">Create promotional codes for festival seasons or institutional offers.</p>
            </div>
            <Button onClick={() => setIsAddOpen(true)} className="gap-2 font-black h-12 px-8 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Create Coupon
            </Button>
          </div>

          <Card className="border-none shadow-sm overflow-hidden rounded-[2rem] bg-white">
            <CardContent className="p-0">
              {isLoading ? <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div> : (coupons || []).length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="pl-8 font-black uppercase text-[10px]">Coupon Code</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Discount</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Valid Until</TableHead>
                        <TableHead className="font-black uppercase text-[10px]">Status</TableHead>
                        <TableHead className="text-right pr-8 font-black uppercase text-[10px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coupons!.map((c) => {
                        const isExpired = c.expiryDate ? new Date(c.expiryDate) < new Date() : false;
                        return (
                          <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="pl-8 py-5">
                               <div className="flex items-center gap-3">
                                 <div className="p-2 bg-primary/10 rounded-lg text-primary"><Ticket className="h-4 w-4" /></div>
                                 <code className="text-sm font-black tracking-widest bg-slate-50 px-3 py-1 rounded-md border">{c.code}</code>
                               </div>
                            </TableCell>
                            <TableCell>
                               <Badge className="bg-emerald-500 text-white font-black">{c.discountPercent}% OFF</Badge>
                            </TableCell>
                            <TableCell>
                               <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                 <Calendar className="h-3.5 w-3.5" />
                                 {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'Forever'}
                                 {isExpired && <Badge variant="destructive" className="ml-2 text-[8px] h-4">EXPIRED</Badge>}
                               </div>
                            </TableCell>
                            <TableCell>
                               {c.isActive && !isExpired ? (
                                 <Badge className="bg-green-50 text-green-700 border-green-200 font-bold">ACTIVE</Badge>
                               ) : (
                                 <Badge variant="outline" className="text-slate-400 font-bold">DISABLED</Badge>
                               )}
                            </TableCell>
                            <TableCell className="text-right pr-8">
                               <div className="flex justify-end gap-2">
                                 <Button variant="ghost" size="icon" onClick={() => toggleStatus(c.id, c.isActive)} className={c.isActive ? "text-slate-400" : "text-green-500"}>
                                   {c.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                 </Button>
                                 <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(c.id)}>
                                   <Trash2 className="h-4 w-4" />
                                 </Button>
                               </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-24 text-center text-slate-400 italic">No coupons found. Create your first promotion above.</div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 p-8 text-white text-center">
            <DialogHeader>
              <DialogTitle className="text-white text-2xl font-headline flex items-center justify-center gap-2"><Ticket className="h-6 w-6 text-primary" /> New Promotion</DialogTitle>
              <DialogDescription className="text-slate-400 font-medium">Create a code to attract more institutions.</DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
             <div className="space-y-2">
               <Label className="text-xs font-black uppercase text-slate-500">Coupon Code</Label>
               <Input required placeholder="e.g. WELCOME50" className="h-12 rounded-xl bg-slate-50 border-none font-black tracking-widest uppercase" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} />
             </div>
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500">Discount (%)</Label>
                  <Input type="number" min="1" max="100" required className="h-12 rounded-xl bg-slate-50 border-none font-bold" value={formData.discountPercent} onChange={(e) => setFormData({...formData, discountPercent: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500">Expiry Date</Label>
                  <Input type="date" className="h-12 rounded-xl bg-slate-50 border-none font-bold" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} />
                </div>
             </div>
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-dashed">
                <div className="space-y-0.5">
                   <Label className="font-bold">Active Immediately</Label>
                   <p className="text-[10px] text-muted-foreground font-medium">Coupons can be disabled any time.</p>
                </div>
                <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({...formData, isActive: v})} />
             </div>
             <DialogFooter>
               <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">
                 {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Launch Promotion"}
               </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
