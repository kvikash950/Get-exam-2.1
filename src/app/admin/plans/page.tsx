
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  Building, 
  Settings, 
  Shield, 
  LogOut, 
  Zap,
  Plus,
  CheckCircle2,
  Trash2,
  Pencil,
  Menu,
  ShieldCheck,
  Users,
  FileText,
  Wallet,
  Ticket,
  Coins,
  Infinity,
  Sparkles,
  Loader2
} from 'lucide-react';
import { 
  useAuth, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  setDocumentNonBlocking,
  deleteDocumentNonBlocking, 
  useUser
} from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';

const CORE_FEATURES = [
  "AI Video Proctoring",
  "Vocal Question Support",
  "Auto-Rank Generation",
  "Detailed PDF Reports",
  "White-labeling & Branding",
  "Bulk Question Upload",
  "Offline Resiliency Mode",
  "Certificate Download",
  "Question Paper Download",
  "Live Doubt Alerts",
  "Step-by-Step Hints"
];

export default function AdminPlansPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const ADMIN_EMAIL = 'kvikash@gmail.com';

  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router, ADMIN_EMAIL]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: 'Standard Credit Model',
    description: 'Pay-per-student model with lifetime validity.',
    pricePerStudent: 1,
    featuresIncluded: CORE_FEATURES
  });

  const plansQuery = useMemoFirebase(() => {
    if (!db || !user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
    return collection(db, 'subscriptionPlans');
  }, [db, user, ADMIN_EMAIL]);
  const { data: plans, isLoading: plansLoading } = useCollection(plansQuery);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/auth/login');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Logout failed", description: error.message });
    }
  };

  const handleOpenEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || 'Standard Credit Model',
      description: plan.description || '',
      pricePerStudent: plan.pricePerStudent ?? 1,
      featuresIncluded: plan.featuresIncluded || CORE_FEATURES
    });
    setIsDialogOpen(true);
  };

  const toggleFeature = (feature: string) => {
    setFormData(prev => {
      const isSelected = prev.featuresIncluded.includes(feature);
      const newFeatures = isSelected 
        ? prev.featuresIncluded.filter(f => f !== feature)
        : [...prev.featuresIncluded, feature];
      return { ...prev, featuresIncluded: newFeatures };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setLoading(true);

    const payload = {
      ...formData,
      pricePerStudent: Number(formData.pricePerStudent) || 1,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingPlan) {
        const planRef = doc(db, 'subscriptionPlans', editingPlan.id);
        setDocumentNonBlocking(planRef, payload, { merge: true });
        toast({ title: "Model Updated", description: "Pricing configuration has been modified." });
      } else {
        const plansRef = collection(db, 'subscriptionPlans');
        addDocumentNonBlocking(plansRef, {
          ...payload,
          createdAt: serverTimestamp()
        });
        toast({ title: "Model Created" });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const AdminNav = () => (
    <nav className="flex-1 p-4 space-y-2">
      <Link href="/admin/dashboard"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><LayoutDashboard className="h-4 w-4" /> Overview</Button></Link>
      <Link href="/admin/centers"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Building className="h-4 w-4" /> Institutions</Button></Link>
      <Link href="/admin/revenue"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Wallet className="h-4 w-4" /> Revenue</Button></Link>
      <Link href="/admin/plans"><Button variant="secondary" className="w-full justify-start gap-3 text-white"><Zap className="h-4 w-4" /> Pricing & Credits</Button></Link>
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
          <div className="flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-headline font-bold text-lg text-primary">Get Exam</span></div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="text-white"><Menu className="h-6 w-6" /></Button></SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-slate-800 text-white"><AdminNav /></SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-headline font-bold text-slate-900">Pricing Control</h1>
              <p className="text-muted-foreground text-sm">Configure the universal pay-per-student credit model features.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 max-w-4xl gap-8">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
                <Coins className="h-64 w-64 text-primary" />
              </div>
              <CardHeader className="p-10 pb-6">
                <div className="flex justify-between items-start">
                   <div className="p-4 rounded-3xl bg-primary/10 text-primary">
                     <Sparkles className="h-8 w-8" />
                   </div>
                   <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-black uppercase text-[10px] tracking-widest px-4 py-1.5">Active Model</Badge>
                </div>
                <CardTitle className="text-4xl font-headline font-bold mt-6">Institutional Credit Model</CardTitle>
                <CardDescription className="text-lg font-medium">Standard ₹1 per student attempt with lifetime validity.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-10 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Credit Price</p>
                      <p className="text-3xl font-black text-primary">₹1 <span className="text-sm text-slate-400 font-bold">/Student</span></p>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Validity</p>
                      <div className="flex items-center gap-2 text-primary">
                        <Infinity className="h-6 w-6" />
                        <p className="text-xl font-black">Lifetime</p>
                      </div>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Access</p>
                      <p className="text-xl font-black text-slate-900">All Centers</p>
                   </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Included Platform Features
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {plans?.[0]?.featuresIncluded?.map((feat: string, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-700">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <div className="p-10 border-t bg-slate-50/50 flex justify-between items-center">
                 <p className="text-xs font-medium text-slate-400 italic">This model is globally applied to all registered institutions.</p>
                 <Button className="font-black px-10 h-12 rounded-2xl shadow-xl shadow-primary/20" onClick={() => handleOpenEdit(plans?.[0])}>
                    Edit Configuration <Pencil className="ml-2 h-4 w-4" />
                 </Button>
              </div>
            </Card>

            <div className="p-8 border-4 border-dashed rounded-[3rem] text-center space-y-2 opacity-40">
               <Plus className="h-10 w-10 mx-auto text-slate-300" />
               <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Tiered Subscription Plans are currently disabled</p>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-white text-2xl font-headline flex items-center gap-3">
                <Coins className="h-6 w-6 text-primary" /> Model Configuration
              </DialogTitle>
              <DialogDescription className="text-slate-400">Configure feature access for the Standard per-student model.</DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Model Name</Label>
                <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Price per Credit (₹)</Label>
                <Input type="number" required value={formData.pricePerStudent} onChange={(e) => setFormData({...formData, pricePerStudent: parseInt(e.target.value) || 1})} className="h-12 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Description</Label>
              <Textarea required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="rounded-xl min-h-[80px]" />
            </div>
            
            <div className="space-y-4">
              <Label className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Toggle Unlocked Features</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CORE_FEATURES.map(f => (
                  <div key={f} className="flex items-center justify-between p-4 border rounded-2xl hover:bg-slate-50 transition-colors">
                    <span className="text-[11px] font-bold text-slate-700">{f}</span>
                    <Switch checked={formData.featuresIncluded.includes(f)} onCheckedChange={() => toggleFeature(f)} />
                  </div>
                ))}
              </div>
            </div>
          </form>
          <DialogFooter className="p-6 bg-slate-50 border-t">
             <Button type="submit" onClick={handleSubmit} disabled={loading} className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">
               {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Save Changes"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
