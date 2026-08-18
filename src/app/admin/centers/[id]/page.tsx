
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building, 
  Shield, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Fingerprint, 
  Clock, 
  History, 
  Zap, 
  CreditCard, 
  AlertTriangle, 
  Copy, 
  CheckCircle2, 
  XCircle, 
  Send, 
  Loader2,
  Lock,
  Crown,
  Calendar,
  Ticket,
  ChevronRight,
  TrendingDown,
  ArrowUpRight,
  PlusCircle,
  Users,
  Briefcase
} from 'lucide-react';
import { 
  useDoc, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
  updateDocumentNonBlocking,
  addDocumentNonBlocking,
  useCollection
} from '@/firebase';
import { doc, arrayUnion, serverTimestamp, collection, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function CenterAuditPage() {
  const { id } = useParams() as { id: string };
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const ADMIN_EMAIL = 'kvikash@gmail.com';

  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router, ADMIN_EMAIL]);

  const centerRef = useMemoFirebase(() => db && id ? doc(db, 'coaching_centers', id) : null, [db, id]);
  const { data: center, isLoading: centerLoading } = useDoc(centerRef);

  // Manual Credit addition state
  const [creditsToAdd, setCreditsToAdd] = useState('0');
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Messaging state
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (center?.requestedCredits) {
      setCreditsToAdd(center.requestedCredits.toString());
    }
  }, [center]);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: `${label} Copied` });
  };

  const handleManualCreditTopup = () => {
    if (!centerRef || !center) return;
    const finalAmount = Number(center.requestedFinalAmount) || 0;
    const count = Number(creditsToAdd);

    if (count <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Credit count must be greater than 0." });
      return;
    }

    setIsUpgrading(true);
    
    const historyEntry = {
      type: 'CREDIT_TOPUP',
      credits: count,
      utr: center.paymentUtr || 'ADMIN_MANUAL',
      amount: finalAmount,
      verifiedAt: new Date().toISOString(),
      status: 'Verified'
    };

    updateDocumentNonBlocking(centerRef, {
      availableCredits: increment(count),
      paymentStatus: 'Verified',
      paymentHistory: arrayUnion(historyEntry),
      paymentUtr: null,
      paymentRequestedAt: null,
      requestedCredits: null,
      requestedBaseAmount: null,
      requestedDiscountAmount: null,
      requestedFinalAmount: null,
      appliedCouponCode: null,
      updatedAt: serverTimestamp()
    });

    toast({ title: "Credits Added", description: `${count} student credits activated.` });
    setIsUpgrading(false);
  };

  const handleSendMessage = async () => {
    if (!db || !user || !center || !messageText.trim()) return;
    setIsSending(true);
    try {
      const broadcastRef = collection(db, 'broadcasts');
      addDocumentNonBlocking(broadcastRef, {
        message: messageText,
        authorId: user.uid,
        targetCenterId: center.id,
        targetCenterName: center.name,
        type: 'private-notice',
        createdAt: serverTimestamp(),
      });
      toast({ title: "Notice Dispatched" });
      setMessageText('');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSending(false);
    }
  };

  if (centerLoading || isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-slate-400">Retrieving Registry...</div>;
  }

  if (!center) return <div className="min-h-screen flex items-center justify-center">Record Not Found</div>;

  const renderRequestDate = () => {
    const rawDate = center.paymentRequestedAt;
    if (!rawDate) return 'N/A';
    const dateObj = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    return dateObj.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const renderRegistrationDate = () => {
    const rawDate = center.createdAt;
    if (!rawDate) return 'N/A';
    const dateObj = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="h-20 bg-white border-b px-4 md:px-12 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/admin/centers">
            <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl font-headline font-bold text-slate-900 flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" /> {center.name}
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutional Audit ID: {center.id.substring(0, 12)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={center.isActive ? "bg-green-500" : "bg-red-500"}>
            {center.isActive ? "ACCOUNT ACTIVE" : "ACCOUNT SUSPENDED"}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Profile Details Column */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
            <CardHeader className="border-b border-white/5 pb-8">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Access Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="p-5 bg-white/5 rounded-3xl border border-white/10 relative group">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Audit Code</p>
                <p className="text-xl font-black text-primary">{center.centerCode || 'PENDING'}</p>
                <Button variant="ghost" size="icon" className="absolute right-4 bottom-4 h-8 w-8 text-white/20 group-hover:text-primary transition-colors" onClick={() => copyToClipboard(center.centerCode, "Code")}><Copy className="h-4 w-4" /></Button>
              </div>

              <div className="p-5 bg-primary/10 rounded-3xl border border-primary/20">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Available Student Credits</p>
                <p className="text-3xl font-black text-white">{center.availableCredits || 0}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">LIFETIME VALIDITY</p>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-white/5 rounded-3xl border border-white/10 relative group">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Registration Email</p>
                  <p className="text-sm font-bold text-white break-all">{center.email}</p>
                </div>
                <div className="p-5 bg-white/5 rounded-3xl border border-white/10 relative group">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">System Password</p>
                  <p className="text-sm font-mono font-bold text-primary tracking-widest">{center.registrationPassword || '••••••'}</p>
                  <Button variant="ghost" size="icon" className="absolute right-4 bottom-4 h-8 w-8 text-white/20" onClick={() => copyToClipboard(center.registrationPassword, "Password")}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem]">
            <CardHeader><CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Institutional Notice</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Send specific audit notice to this center..." 
                className="bg-slate-50 border-none min-h-[120px] rounded-2xl"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <Button className="w-full h-12 rounded-xl font-bold gap-2" onClick={handleSendMessage} disabled={isSending || !messageText.trim()}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Dispatch Alert
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Audit Data Column */}
        <div className="lg:col-span-8 space-y-8">
          
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 p-8 border-b border-slate-100">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Briefcase className="h-5 w-5" />
                 </div>
                 <CardTitle className="text-xl font-headline font-bold">Registration Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Building className="h-3 w-3" /> Institution Name</p>
                     <p className="text-sm font-black text-slate-900">{center.name}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><User className="h-3 w-3" /> Authorized Owner</p>
                     <p className="text-sm font-bold text-slate-900">{center.ownerName || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Mail className="h-3 w-3" /> Contact Email</p>
                     <p className="text-sm font-bold text-slate-900 break-all">{center.email}</p>
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Phone className="h-3 w-3" /> Mobile Number</p>
                     <p className="text-sm font-bold text-slate-900">{center.mobileNumber || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Onboarding Date</p>
                     <p className="text-sm font-bold text-slate-900">{renderRegistrationDate()}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Physical Address</p>
                     <p className="text-sm font-medium text-slate-600 leading-relaxed italic">{center.address || 'Address not provided during registration.'}</p>
                  </div>
               </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="bg-primary text-white p-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Credit Top-up Tool</p>
                    <CardTitle className="text-3xl font-headline font-bold uppercase">ADD CREDITS</CardTitle>
                  </div>
                  <PlusCircle className="h-8 w-8 text-white/30" />
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 <div className="space-y-4">
                    <Label className="text-xs font-black uppercase text-slate-500">Manual Credit Assignment</Label>
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Number of Students</p>
                        <Input 
                          type="number" 
                          className="h-12 rounded-xl bg-slate-50 border-none text-lg font-black" 
                          value={creditsToAdd} 
                          onChange={(e) => setCreditsToAdd(e.target.value)} 
                        />
                    </div>
                    <Button className="w-full h-12 rounded-xl font-black shadow-lg shadow-primary/20" onClick={handleManualCreditTopup} disabled={isUpgrading}>
                      {isUpgrading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />} Assign & Activate Credits
                    </Button>
                    <p className="text-[9px] text-slate-400 italic text-center">Note: This will add to existing credits and mark the request as verified.</p>
                 </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
              <CardHeader className="bg-slate-50 p-8 border-b border-slate-100 shrink-0">
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                     <CreditCard className="h-5 w-5" />
                   </div>
                   <CardTitle className="text-lg font-headline font-bold">Transaction Verifier</CardTitle>
                 </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6 flex-1 flex flex-col justify-center">
                {center.paymentUtr ? (
                  <div className="space-y-6 animate-in zoom-in-95">
                    <div className="p-6 bg-orange-50 rounded-[2rem] border-2 border-orange-200 text-center space-y-2">
                      <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Submitted UTR Number</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tighter">{center.paymentUtr}</p>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-orange-700 hover:bg-orange-100 gap-2" onClick={() => copyToClipboard(center.paymentUtr, "UTR")}>
                        <Copy className="h-3 w-3" /> Copy Transaction ID
                      </Button>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                               <Calendar className="h-3 w-3" /> Request Date
                             </p>
                             <p className="text-xs font-bold text-slate-900">{renderRequestDate()}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                               <Users className="h-3 w-3" /> Requested Credits
                             </p>
                             <p className="text-xs font-black text-primary uppercase">{center.requestedCredits || 0} Students</p>
                          </div>
                       </div>

                       <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-50">
                             <span className="text-slate-500">Base Amount (₹1/Student)</span>
                             <span className="text-slate-900">₹{center.requestedBaseAmount || 0}</span>
                          </div>
                          {center.requestedDiscountAmount > 0 && (
                            <div className="flex justify-between items-center text-[10px] font-bold text-red-500">
                               <span className="flex items-center gap-1.5"><Ticket className="h-3 w-3" /> Discount ({center.appliedCouponCode})</span>
                               <span>- ₹{center.requestedDiscountAmount}</span>
                            </div>
                          )}
                          <div className="h-px bg-slate-200 my-1"></div>
                          <div className="flex justify-between items-center font-black">
                             <span className="text-[10px] uppercase text-slate-600">Net Total to Verify</span>
                             <span className="text-lg text-primary">₹{center.requestedFinalAmount || 0}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 opacity-40 text-center">
                    <History className="h-12 w-12 mx-auto text-slate-300" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Pending Payments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl font-headline font-bold">Verified Billing Ledger</CardTitle>
              </div>
              <Badge variant="outline" className="font-bold border-primary/20 text-primary">Audit Archive</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {center.paymentHistory && center.paymentHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-[10px] font-black uppercase pl-8 py-4">Verification Date</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Top-up Type</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Credits Added</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">UTR / Transaction</TableHead>
                        <TableHead className="text-right pr-8 font-black uppercase">Net Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {center.paymentHistory.map((h: any, i: number) => {
                         return (
                           <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                             <TableCell className="pl-8 py-5 text-sm font-bold text-slate-900">{new Date(h.verifiedAt).toLocaleDateString()}</TableCell>
                             <TableCell>
                                <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/10 text-primary w-fit">{h.type || 'TOPUP'}</Badge>
                             </TableCell>
                             <TableCell>
                                <span className="text-sm font-black text-emerald-600">+{h.credits || 0}</span>
                             </TableCell>
                             <TableCell><code className="text-xs font-mono text-slate-500 font-bold">{h.utr}</code></TableCell>
                             <TableCell className="text-right pr-8">
                                <div className="flex flex-col items-end">
                                   <span className="text-sm font-black text-slate-900">₹{h.amount || 0}</span>
                                   <span className="text-[7px] font-black uppercase text-slate-400">Verified</span>
                                </div>
                             </TableCell>
                           </TableRow>
                         );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400 space-y-3">
                  <History className="h-10 w-10 mx-auto opacity-10" />
                  <p className="text-sm font-medium italic">No verified records found in the billing ledger.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
