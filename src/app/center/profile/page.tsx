
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  BarChart, 
  Shield, 
  Crown, 
  User, 
  Building, 
  Phone, 
  Save,
  CheckCircle2,
  LogOut,
  Palette,
  Fingerprint,
  Zap,
  CreditCard,
  Clock,
  History,
  AlertCircle,
  Users,
  Image as ImageIcon,
  Loader2,
  FileSearch,
  CheckCircle,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { 
  useDoc, 
  useFirestore, 
  useUser, 
  useAuth, 
  useMemoFirebase, 
  updateDocumentNonBlocking,
  useCollection
} from '@/firebase';
import { doc, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function CenterProfilePage() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const profileQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'coaching_centers', user.uid);
  }, [db, user?.uid]);
  const { data: profile, isLoading: profileLoading } = useDoc(profileQuery);

  const examsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, 'exams'), where('coachingCenterId', '==', user.uid));
  }, [db, user?.uid]);
  const { data: exams } = useCollection(examsQuery);

  const [formData, setFormData] = useState({
    name: '', 
    ownerName: '', 
    mobileNumber: '', 
    address: '', 
    logoUrl: '', 
    brandColor: '#2563eb'
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '', 
        ownerName: profile.ownerName || '', 
        mobileNumber: profile.mobileNumber || '', 
        address: profile.address || '', 
        logoUrl: profile.logoUrl || '', 
        brandColor: profile.brandColor || '#2563eb'
      });
    }
  }, [profile]);

  const sortedExams = useMemo(() => {
    if (!exams) return [];
    return [...exams].sort((a, b) => {
      const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return dateB - dateA;
    });
  }, [exams]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileQuery) return;
    setIsSaving(true);
    updateDocumentNonBlocking(profileQuery, { 
      ...formData, 
      updatedAt: new Date().toISOString() 
    });
    
    setTimeout(() => { 
      setIsSaving(false); 
      toast({ title: "Institutional Profile Synced", description: "Branding and identity data updated successfully." }); 
    }, 800);
  };

  const handleLogout = async () => { 
    await signOut(auth); 
    router.push('/auth/login'); 
  };

  if (profileLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>;
  }
  
  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col sticky top-0 h-screen shadow-sm">
        <div className="p-6 border-b flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-headline font-bold text-xl text-primary">Get Exam</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/center/dashboard"><Button variant="ghost" className="w-full justify-start gap-3"><LayoutDashboard className="h-4 w-4" /> Console Home</Button></Link>
          <Link href="/center/students"><Button variant="ghost" className="w-full justify-start gap-3"><Users className="h-4 w-4" /> Students</Button></Link>
          <Link href="/center/exams"><Button variant="ghost" className="w-full justify-start gap-3"><FileText className="h-4 w-4" /> Exams</Button></Link>
          <Link href="/center/results"><Button variant="ghost" className="w-full justify-start gap-3"><BarChart className="h-4 w-4" /> Results</Button></Link>
          <Link href="/center/profile"><Button variant="secondary" className="w-full justify-start gap-3 bg-primary/10 text-primary"><Settings className="h-4 w-4" /> Profile</Button></Link>
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold text-slate-900">Institutional Identity</h1>
              <p className="text-muted-foreground font-medium">Manage organization branding and contact details.</p>
            </div>
            <Button onClick={handleSave} className="gap-2 font-black h-12 px-10 shadow-xl shadow-primary/20" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Syncing...' : 'Publish Profile'}
            </Button>
          </div>

          <Tabs defaultValue="billing" className="space-y-8">
            <TabsList className="bg-white border p-1 rounded-2xl h-14 shadow-sm flex flex-wrap">
              <TabsTrigger value="billing" className="font-bold px-8 rounded-xl h-full data-[state=active]:bg-primary data-[state=active]:text-white">Asset & Billing History</TabsTrigger>
              <TabsTrigger value="identity" className="font-bold px-8 rounded-xl h-full data-[state=active]:bg-primary data-[state=active]:text-white">Identity & Branding</TabsTrigger>
            </TabsList>

            <TabsContent value="billing" className="space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                 <div className="md:col-span-8 p-10 bg-slate-900 text-white rounded-[3rem] flex flex-col md:flex-row justify-between items-center gap-10 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
                     <Zap className="h-64 w-64 text-primary" />
                   </div>
                   <div className="space-y-3 relative z-10 text-center md:text-left">
                     <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-1.5 rounded-full border border-primary/30">
                       <Crown className="h-3.5 w-3.5 text-primary" />
                       <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Active Account Status</span>
                     </div>
                     <p className="text-lg font-bold text-slate-400">
                       Institutional Credit Model (Lifetime)
                     </p>
                   </div>
                   <div className="relative z-10 flex flex-col gap-3 w-full md:w-auto">
                      <Link href="/pricing" className="w-full md:w-auto">
                          <Button className="w-full rounded-2xl h-16 px-12 font-black text-xl shadow-2xl shadow-primary/40 bg-primary hover:bg-primary/90 text-white">
                          <Zap className="h-6 w-6 mr-3 fill-current" /> Purchase Credits
                          </Button>
                      </Link>
                   </div>
                 </div>

                 <div className="md:col-span-4 p-8 bg-white rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Available Credits</p>
                    <p className="text-7xl font-headline font-bold text-primary tracking-tighter">{profile?.availableCredits || 0}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Student Attempts Left</p>
                 </div>
               </div>

               {profile?.paymentUtr && (
                  <Card className="border-none shadow-xl rounded-[2.5rem] bg-orange-50 border-2 border-orange-100 overflow-hidden">
                    <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 animate-pulse">
                          <Clock className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xl font-black text-orange-900 uppercase">Verification Pending</h4>
                          <p className="text-sm font-medium text-orange-700">Transaction ID (UTR): <span className="font-black underline">{profile.paymentUtr}</span></p>
                          <p className="text-[10px] font-bold text-orange-600/60 uppercase mt-1">Requested for {profile.requestedCredits} credits • Amount: ₹{profile.requestedFinalAmount}</p>
                          <p className="text-sm font-bold text-orange-800 mt-2">Your credits will be added to your account shortly.</p>
                        </div>
                      </div>
                      <Badge className="bg-orange-600 text-white font-black px-6 py-2 rounded-xl text-xs">AWAITING ADMIN ACTION</Badge>
                    </CardContent>
                  </Card>
               )}

               <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
                 <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
                   <div className="flex items-center gap-3">
                     <History className="h-6 w-6 text-primary" />
                     <CardTitle className="text-xl font-headline font-bold">Credit Purchase Ledger</CardTitle>
                   </div>
                   <Badge variant="outline" className="font-bold border-primary/20 text-primary uppercase text-[10px]">Settled Top-ups</Badge>
                 </CardHeader>
                 <CardContent className="p-0">
                    {profile?.paymentHistory && profile.paymentHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50/50">
                              <TableHead className="pl-8 py-5 text-[10px] font-black uppercase">Verification Date</TableHead>
                              <TableHead className="text-[10px] font-black uppercase">Top-up Type</TableHead>
                              <TableHead className="text-[10px] font-black uppercase">Credits Added</TableHead>
                              <TableHead className="text-[10px] font-black uppercase">Transaction UTR</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-right pr-8">Net Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {profile.paymentHistory.map((h: any, i: number) => {
                               return (
                                <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                                  <TableCell className="pl-8 py-6">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      <span className="font-bold text-slate-900">{new Date(h.verifiedAt).toLocaleDateString()}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="font-black text-[9px] uppercase border-primary/20 text-primary">
                                      {h.type || 'CREDIT_TOPUP'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm font-black text-emerald-600">+{h.credits || 0}</span>
                                  </TableCell>
                                  <TableCell>
                                    <code className="text-xs font-mono bg-slate-100 px-3 py-1 rounded-lg text-slate-600 font-bold">{h.utr}</code>
                                  </TableCell>
                                  <TableCell className="text-right pr-8">
                                    <div className="flex flex-col items-end">
                                      <span className="text-sm font-black text-slate-900">₹{h.amount || 0}</span>
                                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Verified</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="py-24 text-center space-y-4">
                        <FileSearch className="h-12 w-12 text-slate-200 mx-auto" />
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900">No Settled Purchases</h4>
                          <p className="text-sm text-slate-500 font-medium">Your historical transaction ledger will appear here.</p>
                        </div>
                      </div>
                    )}
                 </CardContent>
               </Card>

               <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
                 <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
                   <div className="flex items-center gap-3">
                     <TrendingUp className="h-6 w-6 text-rose-500" />
                     <CardTitle className="text-xl font-headline font-bold">Asset Consumption Ledger (Exams)</CardTitle>
                   </div>
                   <Badge variant="outline" className="font-bold border-rose-200 text-rose-600 uppercase text-[10px]">Credits Spent</Badge>
                 </CardHeader>
                 <CardContent className="p-0">
                    {sortedExams && sortedExams.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50/50">
                              <TableHead className="pl-8 py-5 text-[10px] font-black uppercase">Publish Date</TableHead>
                              <TableHead className="text-[10px] font-black uppercase">Exam Title</TableHead>
                              <TableHead className="text-[10px] font-black uppercase">Subject</TableHead>
                              <TableHead className="text-[10px] font-black uppercase text-right pr-8">Credits Kharch (Spent)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedExams.map((exam, i) => {
                               return (
                                <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                                  <TableCell className="pl-8 py-6">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-slate-400" />
                                      <span className="font-bold text-slate-600">
                                        {exam.createdAt?.toMillis ? new Date(exam.createdAt.toMillis()).toLocaleDateString() : 'N/A'}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-bold text-slate-900">{exam.title}</span>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className="text-[9px] font-bold uppercase">{exam.subject}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right pr-8">
                                    <div className="flex items-center justify-end gap-2 text-rose-600 font-black">
                                       <span>-{exam.studentCapacity || 0}</span>
                                       <Zap className="h-3 w-3 fill-current" />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="py-24 text-center space-y-4">
                        <Activity className="h-12 w-12 text-slate-200 mx-auto" />
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900">No Credit Consumption History</h4>
                          <p className="text-sm text-slate-500 font-medium">Create your first exam to see credit usage records.</p>
                        </div>
                      </div>
                    )}
                 </CardContent>
                 <CardFooter className="bg-slate-50 p-6 flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary/40" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Credit deduction occurs instantly upon publishing an assessment paper.</p>
                 </CardFooter>
               </Card>
            </TabsContent>

            <TabsContent value="identity" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-8">
                  <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b">
                      <CardTitle className="font-headline flex items-center gap-3">
                        <Building className="h-5 w-5 text-primary" /> Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="font-bold text-slate-500">Center Name</Label>
                          <Input 
                            className="h-12 rounded-xl bg-slate-50 border-none"
                            placeholder="e.g. Imperial Science Academy"
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold text-slate-500">Owner/Principal Name</Label>
                          <Input 
                            className="h-12 rounded-xl bg-slate-50 border-none"
                            placeholder="Full Name"
                            value={formData.ownerName} 
                            onChange={(e) => setFormData({...formData, ownerName: e.target.value})} 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-slate-500">Contact Number</Label>
                        <Input 
                          className="h-12 rounded-xl bg-slate-50 border-none"
                          placeholder="+91 XXXXX XXXXX"
                          value={formData.mobileNumber} 
                          onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-slate-500">Official Address</Label>
                        <Textarea 
                          className="rounded-2xl bg-slate-50 border-none min-h-[120px]"
                          placeholder="Complete institutional address"
                          value={formData.address} 
                          onChange={(e) => setFormData({...formData, address: e.target.value})} 
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-5 space-y-8">
                  <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b">
                      <CardTitle className="font-headline flex items-center gap-3">
                        <Palette className="h-5 w-5 text-primary" /> Visual Branding
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="font-bold text-slate-500">Institutional Logo URL</Label>
                          <div className="relative">
                            <ImageIcon className="absolute left-3 top-3.5 h-5 w-5 text-slate-300" />
                            <Input 
                              className="pl-10 h-12 rounded-xl bg-slate-50 border-none"
                              placeholder="https://example.com/logo.png"
                              value={formData.logoUrl} 
                              onChange={(e) => setFormData({...formData, logoUrl: e.target.value})} 
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium italic">Recommended: Transparent PNG, 400x400px.</p>
                        </div>
                        
                        <div className="p-6 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                          {formData.logoUrl ? (
                            <div className="relative group">
                              <img 
                                src={formData.logoUrl} 
                                alt="Logo Preview" 
                                className="h-24 w-auto object-contain drop-shadow-md"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            </div>
                          ) : (
                            <div className="space-y-2 opacity-30">
                              <ImageIcon className="h-10 w-10 mx-auto" />
                              <p className="text-[10px] font-bold uppercase tracking-widest">No Logo Set</p>
                            </div>
                          )}
                          <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo Display Preview</p>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <Label className="font-bold text-slate-500">Primary Brand Color</Label>
                          <div className="h-10 w-10 rounded-xl shadow-lg ring-2 ring-white" style={{ backgroundColor: formData.brandColor }}></div>
                        </div>
                        <div className="flex gap-4 items-center">
                          <Input 
                            type="color" 
                            className="h-12 w-20 p-1 cursor-pointer border-none bg-transparent"
                            value={formData.brandColor}
                            onChange={(e) => setFormData({...formData, brandColor: e.target.value})} 
                          />
                          <code className="bg-slate-100 px-4 py-2 rounded-xl font-mono text-sm font-bold flex-1 text-center border uppercase">{formData.brandColor}</code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
