
"use client";

import { useState, useEffect } from 'react';
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
  Save,
  Loader2,
  Menu,
  Palette,
  Layout,
  Plus,
  Trash2,
  Info,
  Mail,
  ImageIcon,
  FileText,
  Wallet,
  Type,
  MousePointer2,
  ShieldAlert,
  Construction,
  Ticket,
  Scale,
  CalendarDays,
  FileSearch,
  CreditCard,
  QrCode,
  Globe,
  Key,
  CheckCircle2,
  Trophy,
  MessageCircle,
  Instagram,
  Facebook,
  Youtube,
  Share2
} from 'lucide-react';
import { useAuth, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminSettingsPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const ADMIN_EMAIL = 'kvikash@gmail.com';

  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router, ADMIN_EMAIL]);

  const configRef = useMemoFirebase(() => {
    if (!db || !user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
    return doc(db, 'platformConfig', 'settings');
  }, [db, user, ADMIN_EMAIL]);
  const { data: remoteConfig } = useDoc(configRef);

  const statusRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'platformConfig', 'status');
  }, [db]);
  const { data: systemStatus } = useDoc(statusRef);

  const termsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'platformConfig', 'terms');
  }, [db]);
  const { data: termsConfig } = useDoc(termsRef);

  const paymentRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, 'platformConfig', 'payments');
  }, [db]);
  const { data: paymentConfig } = useDoc(paymentRef);

  const [cmsData, setCmsData] = useState({
    siteName: 'Get Exam',
    heroBadgeText: 'STARTING @ ₹1',
    heroBadgeSubtext: 'Pay-Per-Student • Lifetime Validity',
    heroHeadline: 'Make your Coaching & Institute Digital & Paperless',
    heroSubheadline: 'The Next-Gen AI-Secured Exam Ecosystem for Institutes',
    heroCtaText: 'Start Your Institutional Portal',
    heroImageUrl: '',
    platformLogoUrl: '',
    primaryColor: '#2563eb',
    showFaq: true,
    showVisionGuard: true,
    showSteps: true,
    footerAboutText: "The most advanced and affordable AI-secured examination ecosystem for Bharat.",
    contactEmail: 'support@myexam.io',
    contactAddress: 'Bihar Educational Forge',
    whatsappUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    youtubeUrl: '',
    customLinks: [] as { label: string, url: string }[],
    banners: [] as any[]
  });

  const [termsData, setTermsData] = useState({
    effectiveDate: 'October 20, 2024',
    lastRevised: 'July 30, 2026',
    tosContent: '',
    privacyContent: '',
    grievanceEmail: 'legal@assessmentforge.com'
  });

  const [payConfig, setPayConfig] = useState({
    activeMode: 'manual' as 'manual' | 'automated',
    provider: 'razorpay' as 'razorpay' | 'paytm' | 'phonepe',
    manualUpiId: '9430214094@okbizaxis',
    manualUpiName: 'Vikash Kumar',
    razorpayKey: '',
    paytmMid: '',
    phonepeMid: ''
  });

  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('System is under scheduled maintenance. We will be back shortly.');

  useEffect(() => {
    if (remoteConfig) setCmsData({ ...cmsData, ...remoteConfig, customLinks: remoteConfig.customLinks || [], banners: remoteConfig.banners || [] });
  }, [remoteConfig]);

  useEffect(() => {
    if (systemStatus) {
      setIsMaintenanceActive(systemStatus.isMaintenanceActive ?? false);
      setMaintenanceMessage(systemStatus.maintenanceMessage || 'System is under scheduled maintenance.');
    }
  }, [systemStatus]);

  useEffect(() => {
    if (termsConfig) setTermsData({ effectiveDate: termsConfig.effectiveDate || 'October 20, 2024', lastRevised: termsConfig.lastRevised || 'July 30, 2026', tosContent: termsConfig.tosContent || '', privacyContent: termsConfig.privacyContent || '', grievanceEmail: termsConfig.grievanceEmail || 'legal@assessmentforge.com' });
  }, [termsConfig]);

  useEffect(() => {
    if (paymentConfig) setPayConfig({ ...payConfig, ...paymentConfig });
  }, [paymentConfig]);

  const handleLogout = async () => { await signOut(auth); router.push('/auth/login'); };

  const handleSave = () => {
    if (!configRef || !statusRef || !termsRef || !paymentRef) return;
    setSaving(true);
    setDocumentNonBlocking(configRef, { ...cmsData, updatedAt: serverTimestamp() }, { merge: true });
    setDocumentNonBlocking(statusRef, { isMaintenanceActive, maintenanceMessage, updatedAt: serverTimestamp() }, { merge: true });
    setDocumentNonBlocking(termsRef, { ...termsData, updatedAt: serverTimestamp() }, { merge: true });
    setDocumentNonBlocking(paymentRef, { ...payConfig, updatedAt: serverTimestamp() }, { merge: true });

    setTimeout(() => {
      setSaving(false);
      toast({ title: "Configuration Updated", description: "All changes, including branding and social links, are now live." });
    }, 1000);
  };

  const AdminNav = () => (
    <nav className="flex-1 p-4 space-y-2">
      <Link href="/admin/dashboard"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><LayoutDashboard className="h-4 w-4" /> Overview</Button></Link>
      <Link href="/admin/centers"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Building className="h-4 w-4" /> Institutions</Button></Link>
      <Link href="/admin/exams"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><Globe className="h-4 w-4" /> Global Exams</Button></Link>
      <Link href="/admin/revenue"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Wallet className="h-4 w-4" /> Revenue</Button></Link>
      <Link href="/admin/plans"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Zap className="h-4 w-4" /> Pricing & Credits</Button></Link>
      <Link href="/admin/coupons"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Ticket className="h-4 w-4" /> Coupons</Button></Link>
      <Link href="/admin/pages"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-slate-800"><FileText className="h-4 w-4" /> Pages</Button></Link>
      <Link href="/admin/settings"><Button variant="secondary" className="w-full justify-start gap-3 text-white"><Settings className="h-4 w-4" /> Settings</Button></Link>
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
          <div className="flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-headline font-bold text-lg text-primary">Get Exam Admin</span></div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="text-white"><Menu className="h-6 w-6" /></Button></SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-slate-800 text-white"><AdminNav /></SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div><h1 className="text-2xl md:text-3xl font-headline font-bold text-slate-900">Platform Builder</h1><p className="text-muted-foreground text-sm">Visual customization and global branding settings.</p></div>
            <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto gap-2 font-bold px-10 h-12 shadow-lg shadow-primary/20">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saving ? "Publishing..." : "Publish Live Changes"}</Button>
          </div>

          <Tabs defaultValue="home" className="space-y-8">
            <TabsList className="bg-white border p-1 rounded-2xl h-14 shadow-sm flex flex-wrap">
              <TabsTrigger value="home" className="rounded-xl font-bold px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white">Home Content</TabsTrigger>
              <TabsTrigger value="theme" className="rounded-xl font-bold px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white">Branding</TabsTrigger>
              <TabsTrigger value="payments" className="rounded-xl font-bold px-6 h-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Payment Logic</TabsTrigger>
              <TabsTrigger value="legal" className="rounded-xl font-bold px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white">Legal & Terms</TabsTrigger>
              <TabsTrigger value="system" className="rounded-xl font-bold px-6 h-full data-[state=active]:bg-red-600 data-[state=active]:text-white">System Status</TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm rounded-[2rem]">
                  <CardHeader><CardTitle className="text-lg font-headline flex items-center gap-2"><Layout className="h-5 w-5 text-primary" /> Hero Section</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-400">Headline</Label><Input value={cmsData.heroHeadline} onChange={(e) => setCmsData({...cmsData, heroHeadline: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-400">Subheadline</Label><Textarea value={cmsData.heroSubheadline} onChange={(e) => setCmsData({...cmsData, heroSubheadline: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-400">Badge Text</Label><Input value={cmsData.heroBadgeText} onChange={(e) => setCmsData({...cmsData, heroBadgeText: e.target.value})} /></div>
                      <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-400">Badge Subtext</Label><Input value={cmsData.heroBadgeSubtext} onChange={(e) => setCmsData({...cmsData, heroBadgeSubtext: e.target.value})} /></div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-slate-400">Hero CTA Button Text</Label>
                      <Input value={cmsData.heroCtaText} onChange={(e) => setCmsData({...cmsData, heroCtaText: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-slate-400">Background Image URL (Optional)</Label>
                      <Input placeholder="https://..." value={cmsData.heroImageUrl} onChange={(e) => setCmsData({...cmsData, heroImageUrl: e.target.value})} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="theme" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
                  <CardHeader><CardTitle className="text-lg font-headline flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Visual Identity</CardTitle></CardHeader>
                  <CardContent className="space-y-8 p-8">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Platform Site Name</Label>
                          <Input 
                            placeholder="e.g. Get Exam" 
                            value={cmsData.siteName} 
                            onChange={(e) => setCmsData({...cmsData, siteName: e.target.value})} 
                            className="h-12 rounded-xl bg-slate-50 border-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Platform Logo URL</Label>
                          <Input 
                            placeholder="https://your-server.com/logo.png" 
                            value={cmsData.platformLogoUrl} 
                            onChange={(e) => setCmsData({...cmsData, platformLogoUrl: e.target.value})} 
                            className="h-12 rounded-xl bg-slate-50 border-none"
                          />
                        </div>
                      </div>

                      <div className="p-8 bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                          {cmsData.platformLogoUrl ? (
                            <img 
                              src={cmsData.platformLogoUrl} 
                              alt="Logo" 
                              className="h-10 w-auto object-contain"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          ) : <Shield className="h-10 w-10 text-primary" />}
                          <span className="font-headline font-bold text-2xl text-white tracking-tight">{cmsData.siteName}</span>
                        </div>
                        <p className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Identity Preview</p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t">
                      <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Primary Brand Color</Label>
                      <div className="flex gap-4 items-center">
                        <Input 
                          type="color" 
                          className="h-12 w-20 p-1 cursor-pointer border-none bg-transparent"
                          value={cmsData.primaryColor}
                          onChange={(e) => setCmsData({...cmsData, primaryColor: e.target.value})} 
                        />
                        <code className="bg-slate-100 px-4 py-2 rounded-xl font-mono text-sm font-bold flex-1 text-center border uppercase">{cmsData.primaryColor}</code>
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t">
                      <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Section Visibility</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold">Vision Guard™ Section</p>
                            <p className="text-[10px] text-slate-500">Show security/proctoring info on home</p>
                          </div>
                          <Switch checked={cmsData.showVisionGuard} onCheckedChange={(v) => setCmsData({...cmsData, showVisionGuard: v})} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold">How it Works (Steps)</p>
                            <p className="text-[10px] text-slate-500">Show onboarding steps on home</p>
                          </div>
                          <Switch checked={cmsData.showSteps} onCheckedChange={(v) => setCmsData({...cmsData, showSteps: v})} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold">FAQ Section</p>
                            <p className="text-[10px] text-slate-500">Show common questions at bottom</p>
                          </div>
                          <Switch checked={cmsData.showFaq} onCheckedChange={(v) => setCmsData({...cmsData, showFaq: v})} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-8">
                  <Card className="border-none shadow-sm rounded-[2rem]">
                    <CardHeader><CardTitle className="text-lg font-headline flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Footer & Contact</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">About Platform (Footer)</Label>
                        <Textarea 
                          className="min-h-[100px]" 
                          value={cmsData.footerAboutText} 
                          onChange={(e) => setCmsData({...cmsData, footerAboutText: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">Support Email</Label>
                        <Input value={cmsData.contactEmail} onChange={(e) => setCmsData({...cmsData, contactEmail: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">Office Address / Team Name</Label>
                        <Input value={cmsData.contactAddress} onChange={(e) => setCmsData({...cmsData, contactAddress: e.target.value})} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b">
                      <CardTitle className="text-lg font-headline flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-primary" /> Social Connectivity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                          <MessageCircle className="h-3 w-3 text-green-500" /> WhatsApp Link
                        </Label>
                        <Input 
                          placeholder="https://wa.me/..." 
                          value={cmsData.whatsappUrl} 
                          onChange={(e) => setCmsData({...cmsData, whatsappUrl: e.target.value})} 
                          className="h-10 rounded-xl bg-slate-50 border-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                          <Instagram className="h-3 w-3 text-pink-500" /> Instagram URL
                        </Label>
                        <Input 
                          placeholder="https://instagram.com/..." 
                          value={cmsData.instagramUrl} 
                          onChange={(e) => setCmsData({...cmsData, instagramUrl: e.target.value})} 
                          className="h-10 rounded-xl bg-slate-50 border-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                          <Facebook className="h-3 w-3 text-blue-600" /> Facebook URL
                        </Label>
                        <Input 
                          placeholder="https://facebook.com/..." 
                          value={cmsData.facebookUrl} 
                          onChange={(e) => setCmsData({...cmsData, facebookUrl: e.target.value})} 
                          className="h-10 rounded-xl bg-slate-50 border-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                          <Youtube className="h-3 w-3 text-red-600" /> YouTube Channel
                        </Label>
                        <Input 
                          placeholder="https://youtube.com/..." 
                          value={cmsData.youtubeUrl} 
                          onChange={(e) => setCmsData({...cmsData, youtubeUrl: e.target.value})} 
                          className="h-10 rounded-xl bg-slate-50 border-none"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-8">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5">
                    <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden">
                       <CardHeader className="bg-emerald-600 p-8">
                          <CardTitle className="text-xl font-headline font-bold flex items-center gap-3">
                             <CreditCard className="h-6 w-6" /> Universal Switch
                          </CardTitle>
                          <CardDescription className="text-white/70">Toggle between Manual and Automated payment flows.</CardDescription>
                       </CardHeader>
                       <CardContent className="p-8 space-y-8">
                          <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10">
                             <div className="space-y-1">
                                <p className="font-bold">Manual Mode (QR)</p>
                                <p className="text-[10px] text-slate-400">Students submit UTR for verification.</p>
                             </div>
                             <Switch checked={payConfig.activeMode === 'automated'} onCheckedChange={(v) => setPayConfig({...payConfig, activeMode: v ? 'automated' : 'manual'})} />
                          </div>

                          <div className={cn("space-y-6 transition-opacity", payConfig.activeMode === 'manual' ? "opacity-100" : "opacity-30 pointer-events-none")}>
                             <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Manual UPI Details</Label>
                                <div className="space-y-4">
                                   <div className="space-y-2"><Label className="text-[9px]">UPI ID</Label><Input className="bg-white/5 border-none h-11" value={payConfig.manualUpiId} onChange={(e) => setPayConfig({...payConfig, manualUpiId: e.target.value})} /></div>
                                   <div className="space-y-2"><Label className="text-[9px]">Merchant Name</Label><Input className="bg-white/5 border-none h-11" value={payConfig.manualUpiName} onChange={(e) => setPayConfig({...payConfig, manualUpiName: e.target.value})} /></div>
                                </div>
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                  </div>

                  <div className="lg:col-span-7">
                    <Card className={cn("border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden transition-all", payConfig.activeMode === 'manual' && "opacity-40")}>
                       <CardHeader className="p-8 border-b">
                          <CardTitle className="text-xl font-headline font-bold flex items-center gap-3">
                             <Globe className="h-6 w-6 text-primary" /> Automated Gateways
                          </CardTitle>
                       </CardHeader>
                       <CardContent className="p-8 space-y-10">
                          <div className="space-y-4">
                             <Label className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Select Active Provider</Label>
                             <div className="grid grid-cols-3 gap-4">
                                {['razorpay', 'paytm', 'phonepe'].map(p => (
                                   <button 
                                      key={p} 
                                      onClick={() => setPayConfig({...payConfig, provider: p as any})}
                                      className={cn(
                                        "h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all",
                                        payConfig.provider === p ? "border-primary bg-primary/5 text-primary" : "border-slate-100 bg-slate-50 text-slate-400"
                                      )}
                                   >
                                      <p className="font-black uppercase text-[10px] tracking-widest">{p}</p>
                                      {payConfig.provider === p && <CheckCircle2 className="h-4 w-4" />}
                                   </button>
                                ))}
                             </div>
                          </div>

                          <div className="space-y-6 pt-6 border-t">
                             {payConfig.provider === 'razorpay' && (
                               <div className="space-y-4 animate-in slide-in-from-top-2">
                                  <div className="space-y-2"><Label className="font-bold flex items-center gap-2"><Key className="h-4 w-4" /> Razorpay Key ID</Label><Input placeholder="rzp_live_..." value={payConfig.razorpayKey} onChange={(e) => setPayConfig({...payConfig, razorpayKey: e.target.value})} /></div>
                               </div>
                             )}
                             {payConfig.provider === 'paytm' && (
                               <div className="space-y-4 animate-in slide-in-from-top-2">
                                  <div className="space-y-2"><Label className="font-bold flex items-center gap-2"><Key className="h-4 w-4" /> Paytm MID</Label><Input value={payConfig.paytmMid} onChange={(e) => setPayConfig({...payConfig, paytmMid: e.target.value})} /></div>
                               </div>
                             )}
                             {payConfig.provider === 'phonepe' && (
                               <div className="space-y-4 animate-in slide-in-from-top-2">
                                  <div className="space-y-2"><Label className="font-bold flex items-center gap-2"><Key className="h-4 w-4" /> PhonePe Merchant ID</Label><Input value={payConfig.phonepeMid} onChange={(e) => setPayConfig({...payConfig, phonepeMid: e.target.value})} /></div>
                               </div>
                             )}
                          </div>
                       </CardContent>
                    </Card>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="legal" className="space-y-8">
               <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
                 <CardHeader className="bg-slate-900 text-white p-8">
                   <div className="flex items-center gap-3">
                     <Scale className="h-8 w-8 text-primary" />
                     <CardTitle className="text-2xl font-headline font-bold uppercase">Legal & Compliance Editor</CardTitle>
                   </div>
                 </CardHeader>
                 <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2"><Label className="text-xs font-black uppercase tracking-widest text-slate-500">Effective Date</Label><Input value={termsData.effectiveDate} onChange={(e) => setTermsData({...termsData, effectiveDate: e.target.value})} /></div>
                       <div className="space-y-2"><Label className="text-xs font-black uppercase tracking-widest text-slate-500">Last Revised</Label><Input value={termsData.lastRevised} onChange={(e) => setTermsData({...termsData, lastRevised: e.target.value})} /></div>
                    </div>
                 </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-8">
               <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden border-2 border-red-100">
                  <CardHeader className="bg-red-50 p-8 border-b border-red-100">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-red-600">
                          <ShieldAlert className="h-8 w-8" />
                          <CardTitle className="text-2xl font-headline font-bold">System Status Control</CardTitle>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                     <div className="flex items-center justify-between p-6 bg-red-50/30 rounded-3xl">
                        <div className="space-y-1"><Label className="text-xl font-bold text-red-900">Maintenance Mode</Label><p className="text-sm font-medium text-red-600">Restrict access to students & centers globally.</p></div>
                        <Switch checked={isMaintenanceActive} onCheckedChange={setIsMaintenanceActive} className="scale-125 data-[state=checked]:bg-red-600" />
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

function hexToHsl(hex: string) {
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
