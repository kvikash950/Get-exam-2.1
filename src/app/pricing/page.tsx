
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Shield, 
  Zap, 
  Smartphone, 
  Info,
  Loader2,
  Users,
  BarChart3,
  FileText,
  Video,
  Settings,
  ShieldCheck,
  Award,
  Download,
  Layers,
  WifiOff,
  Volume2,
  Ticket,
  ArrowRight,
  UserPlus,
  HelpCircle,
  Lightbulb,
  PlusSquare,
  LineChart,
  Trophy,
  Activity,
  UserCheck,
  Globe,
  Wallet
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

export default function PricingPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [studentCount, setStudentCount] = useState([500]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'coaching_centers', user.uid);
  }, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const paymentConfigRef = useMemoFirebase(() => db ? doc(db, 'platformConfig', 'payments') : null, [db]);
  const { data: payConfig } = useDoc(paymentConfigRef);

  const OWNER_UPI_ID = payConfig?.manualUpiId || '9430214094@okbizaxis'; 
  const OWNER_NAME = payConfig?.manualUpiName || 'Vikash Kumar';

  const handleApplyCoupon = async () => {
    if (!db || !couponCode.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', couponCode.trim().toUpperCase()), where('isActive', '==', true));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast({ variant: "destructive", title: "Invalid Coupon" });
        setAppliedCoupon(null);
      } else {
        const couponData = snap.docs[0].data();
        setAppliedCoupon(couponData);
        toast({ title: "Coupon Applied!" });
      }
    } finally { setIsValidatingCoupon(false); }
  };

  const currentStudents = studentCount[0];
  const basePrice = currentStudents * 1;
  const discountAmount = appliedCoupon ? Math.round((basePrice * appliedCoupon.discountPercent) / 100) : 0;
  const finalPrice = basePrice - discountAmount;

  const handleOpenPayment = () => {
    if (!user) { router.push('/auth/register'); return; }
    setIsPaymentOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!utrNumber || utrNumber.length < 6) {
      toast({ variant: "destructive", title: "Invalid UTR" });
      return;
    }
    setIsVerifying(true);
    if (profileRef) {
      updateDocumentNonBlocking(profileRef, {
        paymentUtr: utrNumber,
        appliedCouponCode: appliedCoupon?.code || null,
        paymentRequestedAt: serverTimestamp(),
        requestedCredits: Number(currentStudents),
        requestedFinalAmount: Number(finalPrice),
        paymentStatus: 'Pending Verification',
        updatedAt: serverTimestamp()
      });
    }
    setTimeout(() => {
      setIsVerifying(false);
      setIsPaymentOpen(false);
      toast({ title: "Request Submitted" });
      router.push('/center/dashboard');
    }, 1500);
  };

  const handleOnlinePayment = () => {
     setIsVerifying(true);
     toast({ title: "Initiating Gateway", description: `Processing via ${payConfig?.provider.toUpperCase()}...` });
     // Gateway simulation
     setTimeout(() => {
        if (profileRef) {
           updateDocumentNonBlocking(profileRef, {
              paymentStatus: 'Verified',
              paymentHistory: [{ type: 'GATEWAY_PURCHASE', credits: Number(currentStudents), amount: Number(finalPrice), verifiedAt: new Date().toISOString(), status: 'Verified' }],
              availableCredits: (profile?.availableCredits || 0) + Number(currentStudents),
              updatedAt: serverTimestamp()
           });
        }
        setIsVerifying(false);
        setIsPaymentOpen(false);
        toast({ title: "Credits Activated", description: "Automated gateway payment successful." });
        router.push('/center/dashboard');
     }, 2000);
  };

  const upiUrl = `upi://pay?pa=${OWNER_UPI_ID}&pn=${encodeURIComponent(OWNER_NAME)}&am=${finalPrice}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] font-body selection:bg-primary/10">
      <header className="px-4 md:px-12 h-16 md:h-20 flex items-center border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <Link className="flex items-center gap-2" href="/">
          <div className="bg-primary p-1.5 md:p-2 rounded-xl text-white shadow-lg"><Shield className="h-5 w-5" /></div>
          <span className="font-headline font-bold text-xl md:text-2xl text-slate-900 tracking-tight">My Exam</span>
        </Link>
        <nav className="ml-auto flex gap-4">
          <Link href={user ? "/center/dashboard" : "/auth/login"}><Button variant="ghost" className="font-bold text-sm h-10 px-6">{user ? "Dashboard" : "Login"}</Button></Link>
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 md:py-24">
        <div className="text-center max-w-4xl mx-auto mb-16 md:mb-24 space-y-6">
          <Badge className="bg-primary text-white font-black px-5 py-1.5 rounded-full text-[10px] tracking-[0.2em] mb-4 shadow-xl">LIFETIME VALIDITY</Badge>
          <h1 className="text-4xl md:text-7xl font-headline font-bold tracking-tight text-slate-900 leading-[1.1]">Pay Per <span className="text-primary">Student</span></h1>
          <p className="text-lg md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto">₹1 per student. No monthly fees. No expiry dates.</p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <Card className="border-none shadow-2xl rounded-[3rem] p-8 md:p-10 bg-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5"><Users className="h-48 w-48 text-primary" /></div>
               <CardHeader className="p-0 mb-8 relative z-10"><CardTitle className="text-3xl font-headline font-bold text-slate-900">Choose Volume</CardTitle></CardHeader>
               <CardContent className="p-0 space-y-10 relative z-10">
                  <div className="space-y-6">
                     <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-6xl font-black font-headline text-primary tracking-tighter">{currentStudents}</p>
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Student Credits</p>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black px-4 py-1.5 h-auto mb-2">₹1 / CANDIDATE</Badge>
                     </div>
                     <Slider value={studentCount} onValueChange={setStudentCount} max={10000} min={49} step={1} className="py-4" />
                  </div>
                  <div className="p-10 bg-slate-900 text-white rounded-[2.5rem] relative overflow-hidden">
                     <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Total One-Time Payment</p>
                     <p className="text-6xl font-black font-headline text-white tracking-tighter">₹{finalPrice}</p>
                  </div>
                  <Button onClick={handleOpenPayment} className="w-full h-20 rounded-[1.5rem] font-black text-xl shadow-2xl shadow-primary/30 group">
                     Buy Credits Now <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
               </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-10">
             <div className="space-y-3"><h3 className="text-3xl font-headline font-bold text-slate-900">Platform Features</h3><p className="text-slate-500 font-medium text-lg">Every proctoring tool is included by default.</p></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['AI Video Proctoring', 'Auto-Rank Generation', 'White-labeling', 'PDF Reports', 'Offline Mode', 'Voice Support'].map((f, i) => (
                  <div key={i} className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all hover:border-primary/40 group">
                     <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all"><Zap className="h-5 w-5" /></div>
                     <p className="font-bold text-slate-800 text-sm">{f}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-md rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-slate-900 p-10 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><Shield className="h-32 w-32 text-primary" /></div>
              <DialogHeader className="relative z-10">
                <DialogTitle className="text-white text-3xl font-headline font-bold tracking-tight">Checkout</DialogTitle>
                <DialogDescription className="text-slate-400 text-sm font-medium mt-2">Activating {currentStudents} Student Credits</DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="p-10 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar bg-white">
              {payConfig?.activeMode === 'automated' ? (
                <div className="space-y-8 animate-in zoom-in-95">
                   <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Automated Online Payment</p>
                      <p className="text-5xl font-black text-primary tracking-tighter">₹{finalPrice}</p>
                      <p className="text-[10px] text-slate-500 font-bold mt-4">Safe & Encrypted Gateway</p>
                   </div>
                   <Button className="w-full h-16 rounded-2xl font-black text-lg gap-2" onClick={handleOnlinePayment} disabled={isVerifying}>
                      {isVerifying ? <Loader2 className="animate-spin" /> : <><Wallet className="h-5 w-5" /> Pay with {payConfig.provider.toUpperCase()}</>}
                   </Button>
                </div>
              ) : (
                <div className="space-y-8 animate-in zoom-in-95">
                  <div className="text-center space-y-6">
                    <div className="bg-white p-6 rounded-[3.5rem] border-[10px] border-slate-50 inline-block shadow-2xl">
                      <img src={qrUrl} alt="UPI QR" className="w-52 h-52 mx-auto" />
                    </div>
                    <code className="bg-slate-900 text-primary-foreground px-8 py-3 rounded-2xl text-sm font-mono font-bold block shadow-xl">{OWNER_UPI_ID}</code>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block text-center">Submit Transaction ID (UTR)</Label>
                    <Input placeholder="ENTER 12 DIGIT UTR..." value={utrNumber} onChange={(e) => setUtrNumber(e.target.value.replace(/\s/g, ''))} className="h-16 rounded-2xl text-center font-black text-2xl" />
                    <Button className="w-full h-18 rounded-[1.5rem] font-black text-xl shadow-2xl h-16" onClick={handleConfirmPayment} disabled={isVerifying || utrNumber.length < 6}>
                      {isVerifying ? <Loader2 className="animate-spin" /> : "CONFIRM DEPOSIT"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
