
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  ArrowLeft, 
  Scale, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Gavel, 
  Landmark,
  XCircle,
  Mail,
  UserCheck,
  ShieldAlert,
  Database,
  Lock,
  EyeOff,
  Zap,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function TermsPage() {
  const db = useFirestore();
  const termsRef = useMemoFirebase(() => db ? doc(db, 'platformConfig', 'terms') : null, [db]);
  const { data: termsConfig, isLoading } = useDoc(termsRef);

  // Fallback data if admin hasn't set anything yet
  const effectiveDate = termsConfig?.effectiveDate || "October 20, 2024";
  const lastRevised = termsConfig?.lastRevised || "July 30, 2026";
  const tosContent = termsConfig?.tosContent || "By accessing, registering, or using the \"Get Exam\" portal (hereinafter referred to as the \"Platform\"), you agree to be legally bound by these Terms and Conditions. These terms govern the operational relationship between Assessment Forge Global (the \"Company\", \"We\", \"Us\"), Institutional Users (Coaching Centers, Schools, Colleges, and Individual Educators), and their end-users (\"Students\").";
  const privacyContent = termsConfig?.privacyContent || "We never sell, rent, trade, share, or monetize any candidate data, institutional rosters, contact lists, test scores, or proctoring logs to advertisers, data brokers, or marketing entities. All student and institutional data is treated as strictly confidential and is used exclusively to deliver examination services requested by the customer.";
  const grievanceEmail = termsConfig?.grievanceEmail || "legal@assessmentforge.com";

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Legal Registry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary/10 font-body">
      <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 px-4 md:px-12 flex items-center justify-between shadow-sm">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="bg-primary p-1.5 rounded-lg text-white shadow-lg">
            <Shield className="h-5 w-5" />
          </div>
          <span className="font-headline font-bold text-xl text-primary tracking-tight">Get Exam</span>
        </Link>
        <Link href="/">
          <Button variant="ghost" className="font-bold text-sm h-10 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-12 md:py-24 space-y-16">
        {/* Hero Section */}
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 px-4 py-1.5 rounded-full">
            <Scale className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Legal Framework</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-headline font-bold tracking-tight text-slate-900 leading-[1.1]">
            Terms of Service & <br/><span className="text-primary">Privacy Policy</span>
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 pb-8">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary/40" />
              <span>Effective: {effectiveDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary/40" />
              <span>Revised: {lastRevised}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500/40" />
              <span className="text-emerald-600">DPDP Act 2023 Compliant</span>
            </div>
          </div>
        </section>

        {/* Part 1: TOS */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 border-l-4 border-primary pl-6">
            <Badge className="bg-primary text-white font-black text-xs px-4 h-7">PART 1</Badge>
            <h2 className="text-3xl font-headline font-bold text-slate-900">Terms & Conditions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8 space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-3"><Landmark className="h-5 w-5 text-primary" /> 1. Acceptance</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {tosContent}
              </p>
            </Card>

            <Card className="border-none shadow-sm rounded-[2rem] bg-slate-900 text-white p-8 space-y-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5"><Zap className="h-20 w-20 text-primary" /></div>
               <h3 className="text-xl font-bold flex items-center gap-3"><FileText className="h-5 w-5 text-primary" /> 2. Credit Model</h3>
               <div className="space-y-3 relative z-10">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">₹1 Per Student Attempt</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> 1 Credit = 1 Exam Attempt</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Lifetime Validity (No Expiry)</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Min Order: 49 Credits</li>
                  </ul>
               </div>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8 md:p-12 space-y-10">
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900"><ShieldAlert className="h-5 w-5 text-primary" /> 3. Vision Guard™ & Proctoring</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                To maintain examination integrity, the Platform utilizes Vision Guard™ (AI-assisted proctoring). Institutional Users are legally responsible for obtaining explicit consent from Students (or parents/guardians in the case of minors) prior to assigning proctored exams.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900"><XCircle className="h-5 w-5 text-rose-500" /> 4. Refund & Cancellation</h3>
              <div className="p-6 bg-rose-50 border-2 border-dashed border-rose-200 rounded-3xl">
                <p className="text-sm text-rose-900 font-bold leading-relaxed">
                  In accordance with the Indian Contract Act, 1872 and applicable Indian e-commerce regulations for digital goods: All purchases of digital credits are final and non-refundable. No refunds, chargebacks, or cash redemptions will be processed once credits are added to the institutional registry.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">5. Content Responsibility</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  "Get Exam" functions solely as a SaaS provider. We do not create or verify question papers. Institutional Users bear sole legal responsibility for copyright compliance of their uploaded materials.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">6. Governing Law</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-bold">
                  Subject to the exclusive jurisdiction of the competent courts in <span className="text-slate-900">Patna, Bihar, India</span>.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Part 2: Privacy Policy */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 border-l-4 border-emerald-500 pl-6">
            <Badge className="bg-emerald-500 text-white font-black text-xs px-4 h-7 uppercase">PART 2</Badge>
            <h2 className="text-3xl font-headline font-bold text-slate-900">Privacy Policy</h2>
          </div>

          <div className="p-10 bg-emerald-50 rounded-[3rem] border-2 border-emerald-100 space-y-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><EyeOff className="h-32 w-32 text-emerald-600" /></div>
             <h3 className="text-2xl font-bold text-emerald-900 flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-emerald-600" /> Zero Data Commercialization</h3>
             <p className="text-emerald-800 text-lg font-medium max-w-3xl leading-relaxed">
               {privacyContent}
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card className="border-none shadow-sm rounded-3xl p-6 bg-white space-y-3">
                <Database className="h-6 w-6 text-primary" />
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">Data We Collect</h4>
                <ul className="text-xs text-slate-500 space-y-1.5 font-medium">
                  <li>• Institutional Admin Details</li>
                  <li>• Student Name & Roll IDs</li>
                  <li>• Performance Metrics & Scores</li>
                  <li>• AI Proctoring Snapshots</li>
                </ul>
             </Card>
             <Card className="border-none shadow-sm rounded-3xl p-6 bg-white space-y-3">
                <Lock className="h-6 w-6 text-primary" />
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">Storage Security</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Encrypted cloud storage compliant with Indian standards. Data is visible only to authorized institute admins and technical engineers for bug resolution.
                </p>
             </Card>
             <Card className="border-none shadow-sm rounded-3xl p-6 bg-white space-y-3">
                <UserCheck className="h-6 w-6 text-primary" />
                <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-widest">User Rights</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Institutes can access, correct, or erase student data at any time. Erasure requests are processed within 30 days.
                </p>
             </Card>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-white space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5"><Scale className="h-64 w-64 text-primary" /></div>
          <div className="text-center space-y-4 relative z-10">
            <h2 className="text-3xl md:text-5xl font-headline font-bold tracking-tight">Legal Grievance Officer</h2>
            <p className="text-slate-400 font-medium">Assessment Forge Global • Dedicated Legal Support</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 space-y-2">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Official Inquiries</p>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-400" />
                <a href={`mailto:${grievanceEmail}`} className="text-xl font-bold hover:text-primary transition-colors">{grievanceEmail}</a>
              </div>
            </div>
            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 space-y-2">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Jurisdiction</p>
              <div className="flex items-center gap-3">
                <Landmark className="h-5 w-5 text-slate-400" />
                <p className="text-xl font-bold">Patna, Bihar, India</p>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 text-center opacity-40">
             <p className="text-[9px] font-black uppercase tracking-widest">Verified Integrity Protocol • myexam.io</p>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t bg-white">
        <div className="container mx-auto px-4 text-center">
           <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">© 2024 Assessment Forge Global • All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
}

