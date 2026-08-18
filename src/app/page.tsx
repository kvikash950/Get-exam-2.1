
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Video, 
  Award, 
  BarChart3, 
  Globe, 
  Clock,
  ArrowRight,
  Menu,
  Shield,
  Zap,
  Target,
  FileText,
  Languages,
  Layers,
  Smartphone,
  UserPlus,
  PencilLine,
  LineChart,
  Camera,
  AlertTriangle,
  RefreshCw,
  Eye,
  HelpCircle,
  Briefcase,
  Lock,
  Cpu,
  MonitorCheck,
  SmartphoneNfc,
  TrendingDown,
  Printer,
  Fingerprint,
  Trophy,
  Users,
  Sparkles,
  Rocket,
  GraduationCap,
  Building2,
  ChevronRight,
  TrendingUp,
  Send,
  UserCheck,
  Palette,
  ClipboardCheck,
  MessageCircle,
  Instagram,
  Facebook,
  Youtube
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15,
      delay: 0.3
    }
  }
};

export default function Home() {
  const db = useFirestore();
  const configRef = useMemoFirebase(() => db ? doc(db, 'platformConfig', 'settings') : null, [db]);
  const { data: config } = useDoc(configRef);
  console.log("Config object:", config);

  // AI Exam Conduct Simulator State
  const [proctorStatus, setProctorStatus] = useState<'Normal' | 'Looking Away' | 'Phone Detected' | 'Tab Switched'>('Normal');
  const [warningsCount, setWarningsCount] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [simLogs, setSimLogs] = useState<string[]>([
    "AI Conduct Engine v3.5 successfully initialized.",
    "Webcam handshake verified... Security channel secure.",
    "Continuous facial mapping initialized: 68 landmark points active.",
    "Audio decibel check: Stable background ambient level (14 dB)."
  ]);

  const addSimLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setSimLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 7)]);
  };

  const triggerSimNormal = () => {
    setProctorStatus('Normal');
    addSimLog("AI Status returned to Normal. Standard scan active.");
  };

  const triggerSimLookingAway = () => {
    setProctorStatus('Looking Away');
    setWarningsCount(prev => prev + 1);
    addSimLog("WARNING: Candidate head movement outside bounding box detected!");
  };

  const triggerSimPhone = () => {
    setProctorStatus('Phone Detected');
    setWarningsCount(prev => prev + 1);
    addSimLog("CRITICAL: Mobile/handheld device detected inside Vision Field!");
  };

  const triggerSimTab = () => {
    setProctorStatus('Tab Switched');
    setTabSwitches(prev => prev + 1);
    setWarningsCount(prev => prev + 1);
    addSimLog("CRITICAL: Browser focal loss! Unauthorized tab switch recorded.");
  };

  const resetSimulator = () => {
    setProctorStatus('Normal');
    setWarningsCount(0);
    setTabSwitches(0);
    setSimLogs([
      "AI Conduct Engine v3.5 successfully initialized.",
      "Webcam handshake verified... Security channel secure.",
      "Continuous facial mapping initialized: 68 landmark points active."
    ]);
  };

  const siteName = config?.siteName || "My Exam";
  const headline = config?.heroHeadline || "Make your Coaching & Institute Digital & Paperless";
  const subheadline = config?.heroSubheadline || "Whether you are a Small Coaching Institute or a Large Institute, conduct exams from Class 1 to Higher Competitive levels.";
  const platformLogoUrl = config?.platformLogoUrl || null;
  
  const showFaq = config?.showFaq ?? true;
  const showVisionGuard = config?.showVisionGuard ?? true;
  const showSteps = config?.showSteps ?? true;
  const customLinks = config?.customLinks || [];

  const footerAboutText = config?.footerAboutText || `The most advanced and affordable AI-secured examination ecosystem for Bharat.`;
  const contactEmail = config?.contactEmail || `support@${siteName.toLowerCase().replace(/\s+/g, '')}.io`;
  const contactAddress = config?.contactAddress || "Assessment Forge Global Team";

  const NavLinks = () => (
    <>
      <Link className="text-sm font-bold text-slate-600 hover:text-primary transition-colors" href="/global-exams">Test Series</Link>
      <Link className="text-sm font-bold text-slate-600 hover:text-primary transition-colors" href="#for-institutes">For Institutes</Link>
      <Link className="text-sm font-bold text-slate-600 hover:text-primary transition-colors" href="/pricing">Pricing</Link>
      {showFaq && <Link className="text-sm font-bold text-slate-600 hover:text-primary transition-colors" href="#faq">Help</Link>}
    </>
  );

  return (
    <div className="flex flex-col min-h-screen font-body selection:bg-primary/10 overflow-x-hidden">
      {config?.primaryColor && (
        <style jsx global>{`
          :root {
            --primary: ${hexToHsl(config.primaryColor)};
          }
        `}</style>
      )}

      <header className="px-4 lg:px-12 h-16 md:h-20 flex items-center border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <Link className="flex items-center justify-center gap-2 md:gap-3" href="/">
          {platformLogoUrl ? (
            <img src={platformLogoUrl} alt={siteName} className="h-8 md:h-10 w-auto object-contain" />
          ) : (
            <div className="bg-indigo-600 p-1.5 md:p-2 rounded-xl text-white shadow-lg">
              <Shield className="h-5 w-5 md:h-6 md:w-6" />
            </div>
          )}
          <span className="font-headline font-bold text-xl md:text-2xl text-indigo-600 tracking-tight">{siteName}</span>
        </Link>
        
        <nav className="ml-auto hidden md:flex gap-10 items-center">
          <NavLinks />
          <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
          <Link href="/auth/login">
            <Button variant="ghost" className="font-bold text-slate-600 text-sm h-11 px-6">Login</Button>
          </Link>
          <Link href="/auth/register">
            <Button className="font-bold px-8 shadow-md shadow-primary/20 h-11 rounded-xl text-sm">Get Started</Button>
          </Link>
        </nav>

        <div className="ml-auto md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10"><Menu className="h-6 w-6" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-xs">
              <SheetHeader>
                <SheetTitle className="text-left font-headline font-bold text-slate-900">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-6 mt-8">
                <NavLinks />
                <hr className="border-slate-100" />
                <Link href="/auth/login" className="w-full">
                  <Button variant="outline" className="w-full font-bold h-12">Login</Button>
                </Link>
                <Link href="/auth/register" className="w-full">
                  <Button className="w-full font-bold h-12">Register</Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full pt-16 md:pt-24 pb-20 md:pb-36 overflow-hidden border-b notebook-bg notebook-grid-paper flex items-center min-h-[85vh]">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-white" />
            <div className="notebook-margin-line" />
          </div>

          <div className="container px-4 md:px-12 mx-auto relative z-10 pl-16 md:pl-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              {/* Left Column: Text and CTAs */}
              <motion.div 
                className="lg:col-span-6 flex flex-col items-start text-left space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div 
                  variants={itemVariants} 
                  className="inline-flex items-center gap-3 bg-white border border-amber-200/60 px-5 py-2 rounded-full shadow-md relative"
                >
                  <Badge className="bg-amber-600 text-[10px] font-black h-6 px-4 uppercase tracking-wider">
                    ALL-IN-ONE NOTEBOOK
                  </Badge>
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                    INTELLIGENT STUDY & EXAM CONDUCT
                  </span>
                  {/* Floating Hand-drawn sticker */}
                  <span className="hidden sm:inline absolute -right-32 -top-6 rotate-6 bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-lg font-handwriting border border-amber-300 shadow-sm font-bold text-[14px]">
                    100% Paperless! 📝
                  </span>
                </motion.div>
                
                <motion.h1 
                  variants={itemVariants} 
                  className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-headline font-bold tracking-tighter text-slate-900 leading-[1.05] md:leading-[1.1] w-full"
                >
                  {headline}
                </motion.h1>
                
                <motion.p 
                  variants={itemVariants} 
                  className="text-slate-600 text-lg md:text-xl font-medium leading-relaxed max-w-2xl"
                >
                  {subheadline}
                </motion.p>

                <motion.div 
                  variants={itemVariants} 
                  className="pt-2 flex flex-wrap gap-4 w-full sm:w-auto"
                >
                  <Link href="/auth/register" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto rounded-2xl h-16 px-10 font-black text-lg shadow-2xl shadow-primary/20">
                      {config?.heroCtaText || "Start Your Institutional Portal"}
                    </Button>
                  </Link>
                  <Link href="#for-institutes" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-2xl h-16 px-8 font-black text-lg bg-white/50 backdrop-blur border-slate-200 hover:bg-white">
                      Explore Features
                    </Button>
                  </Link>
                </motion.div>

                {/* Micro social proof stats */}
                <motion.div 
                  variants={itemVariants} 
                  className="pt-6 border-t border-slate-200/80 w-full flex flex-wrap gap-8 text-slate-500"
                >
                  <div>
                    <span className="block text-2xl font-black text-slate-900">₹1</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Per Student credit</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-slate-900">100%</span>
                    <span className="text-xs font-bold uppercase tracking-wider">AI Secured Proctoring</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-black text-slate-900">Custom</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Institute Branding</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Column: High-fidelity AI Exam Conduct Mockup Image */}
              <motion.div 
                className="lg:col-span-6 relative flex justify-center items-center w-full"
                variants={imageVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="relative w-full max-w-none lg:max-w-[620px] rounded-[2.5rem] shadow-2xl border-8 border-white bg-white overflow-hidden aspect-[1.25] group">
                  <img 
                    src="/images/ai_proctor_student.jpg" 
                    alt="AI Exam Proctoring Student Mockup" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle decorative banner overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Interactive Premium Floating Badge */}
                  <div className="absolute bottom-6 left-6 right-6 bg-slate-900/95 backdrop-blur-sm text-white px-5 py-3 rounded-2xl flex items-center justify-between border border-white/10 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-500/20 p-2 rounded-xl text-amber-400">
                        <Camera className="h-4 w-4 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">SECURE ENVIRONMENT</p>
                        <p className="text-xs font-black tracking-wide font-notebook">Vision Guard™ Active</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase border border-emerald-500/20 animate-pulse">
                      Live Proctoring
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Dual Path Selection Section - THE BRIDGE */}
        <section className="w-full py-12 -mt-24 relative z-20">
          <div className="container px-4 md:px-12 mx-auto">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
                {/* Path 1: Students */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", stiffness: 80, damping: 15 }}
                >
                  <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden group hover:shadow-3xl transition-all duration-500 h-full flex flex-col">
                     {/* Premium Custom Student Illustration Header */}
                     <div className="aspect-[16/10] w-full relative bg-emerald-50/55 overflow-hidden shrink-0">
                        <img 
                          src="/images/for_students_banner.jpg" 
                          alt="Student taking online mock tests" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-black/5" />
                        <div className="absolute top-6 left-6">
                           <Badge className="bg-emerald-600/90 backdrop-blur-sm text-white font-black text-[9px] px-3.5 h-6 uppercase tracking-wider border-none">
                              Practice Portal
                           </Badge>
                        </div>
                     </div>
                     <CardContent className="p-10 md:p-12 space-y-8 text-center flex flex-col justify-between flex-1">
                        <div className="space-y-6">
                           <div className="space-y-3">
                              <h3 className="text-3xl font-headline font-bold text-slate-900">For Students</h3>
                              <p className="text-slate-500 font-medium text-[15px] leading-relaxed">
                                 Access top-tier Mock Test Series, compete nationally, and get instant performance insights.
                              </p>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 max-w-md mx-auto">
                              {['SSC, Banking & UPSC Series', 'Real-time National Ranking', 'Digital merit Certificates', 'AI Speed Analytics'].map((f, i) => (
                                <div key={i} className="flex items-center gap-2 justify-center sm:justify-start text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100/80 px-3 py-2 rounded-xl">
                                   <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> <span className="truncate">{f}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                        <div className="pt-6">
                           <Link href="/global-exams" className="block">
                              <Button size="lg" className="w-full h-16 rounded-2xl font-black text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 group">
                                 Start Mock Tests <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                              </Button>
                           </Link>
                        </div>
                     </CardContent>
                  </Card>
                </motion.div>

                {/* Path 2: Institutes */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.1 }}
                >
                  <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden group hover:shadow-3xl transition-all duration-500 h-full flex flex-col">
                     {/* Premium Custom Institute Illustration Header */}
                     <div className="aspect-[16/10] w-full relative bg-slate-950 overflow-hidden shrink-0">
                        <img 
                          src="/images/for_institutes_banner.jpg" 
                          alt="Coaching institute dashboard overview" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-85"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/10" />
                        <div className="absolute top-6 left-6">
                           <Badge className="bg-primary/90 backdrop-blur-sm text-white font-black text-[9px] px-3.5 h-6 uppercase tracking-wider border-none">
                              Admin Suite
                           </Badge>
                        </div>
                     </div>
                     <CardContent className="p-10 md:p-12 space-y-8 text-center flex flex-col justify-between flex-1">
                        <div className="space-y-6">
                           <div className="space-y-3">
                              <h3 className="text-3xl font-headline font-bold text-white">For Institutes</h3>
                              <p className="text-slate-400 font-medium text-[15px] leading-relaxed">
                                 Launch your own digital exam portal with AI proctoring and automate your institution's results.
                              </p>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 max-w-md mx-auto">
                              {['₹1 Per Student Credit', 'AI-Vision Guard™ Security', 'Your Own Institute Branding', 'Instant Merit Lists'].map((f, i) => (
                                <div key={i} className="flex items-center gap-2 justify-center sm:justify-start text-xs font-bold text-slate-300 bg-white/5 border border-white/5 px-3 py-2 rounded-xl">
                                   <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> <span className="truncate">{f}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                        <div className="pt-6">
                           <Link href="/auth/register" className="block">
                              <Button size="lg" className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/30 group">
                                 Setup Exam Portal <Rocket className="ml-2 group-hover:translate-y-[-2px] transition-transform" />
                              </Button>
                           </Link>
                        </div>
                     </CardContent>
                  </Card>
                </motion.div>
             </div>
          </div>
        </section>

        {/* Institutional Section Detailed */}
        <section id="for-institutes" className="w-full py-20 md:py-40 bg-white overflow-hidden">
           <div className="container px-4 md:px-12 mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                 <div className="space-y-10">
                    <div className="space-y-4">
                       <Badge className="bg-primary/10 text-primary font-black px-6 py-2 rounded-full text-xs tracking-[0.2em] uppercase">INSTITUTIONAL MODULE</Badge>
                       <h2 className="text-4xl md:text-6xl font-headline font-bold text-slate-900 tracking-tighter leading-[1.1]">
                          Transform your Coaching into a <span className="text-primary">Digital Hub</span>
                       </h2>
                       <p className="text-xl text-slate-500 font-medium leading-relaxed">
                          Say goodbye to physical question bundles and manual checking. Automate everything from student enrollment to result declaration.
                       </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       {[
                         { title: "Vision Guard™ AI", desc: "Real-time AI camera proctoring to stop cheating.", icon: Video },
                         { title: "Your Brand", desc: "Show your logo and name on student screens & results.", icon: Zap },
                         { title: "Automated Ranks", desc: "Instant merit list generation for any exam size.", icon: BarChart3 },
                         { title: "Digital Archive", desc: "Securely store years of student performance data.", icon: Lock }
                       ].map((item, i) => (
                         <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:shadow-lg transition-all group">
                            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm mb-4 group-hover:scale-110 transition-transform">
                               <item.icon className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
                            <p className="text-sm text-slate-500 leading-tight">{item.desc}</p>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="relative lg:pl-12">
                    <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 p-8 md:p-12 text-center relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12">
                          <Trophy className="h-48 w-48 text-primary" />
                       </div>
                       <div className="space-y-8 relative z-10">
                          <div className="space-y-2">
                             <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">BHARAT'S MOST AFFORDABLE</p>
                             <h4 className="text-4xl font-headline font-bold text-white tracking-tighter">Institutional Pricing</h4>
                          </div>
                          <div className="flex justify-center items-baseline gap-2 py-4">
                             <span className="text-4xl font-black text-slate-500">₹</span>
                             <span className="text-9xl font-black font-headline text-white tracking-tighter leading-none">1</span>
                             <span className="text-xl font-bold text-slate-500 uppercase tracking-widest">/ student</span>
                          </div>
                          <p className="text-slate-400 font-medium text-lg">Lifetime Validity • No Monthly Charges • AI Included</p>
                          <Link href="/pricing" className="block">
                             <Button size="lg" className="w-full h-18 rounded-[1.5rem] font-black text-xl shadow-2xl shadow-primary/30 h-16">
                                View Full Pricing Plan
                             </Button>
                          </Link>
                       </div>
                    </Card>
                 </div>
              </div>
           </div>
        </section>

        {/* Step-by-Step Institute Guideline */}
        {showSteps && (
          <section className="w-full py-20 md:py-40 bg-slate-50 border-y border-slate-100">
            <div className="container px-4 md:px-12 mx-auto">
              <div className="max-w-4xl mx-auto text-center space-y-6 mb-20">
                <Badge className="bg-primary/10 text-primary font-black px-6 py-2 rounded-full text-[10px] tracking-[0.2em] uppercase">SEAMLESS INTEGRATION</Badge>
                <h2 className="text-3xl md:text-6xl font-headline font-bold text-slate-900 tracking-tighter">Conduct your First Exam in 4 Simple Steps</h2>
                <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto">We've designed the onboarding to be as fast as possible. Get your portal live in under 5 minutes.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2" />
                
                {[
                  { step: '01', title: 'Register & Setup', desc: 'Create your institute profile and get instant access to your admin console.', icon: UserCheck },
                  { step: '02', title: 'Enroll Students', desc: 'Add students individually or via bulk upload to assign unique Roll Numbers.', icon: UserPlus },
                  { step: '03', title: 'Deploy Exams', desc: 'Create question papers, set timers, and publish to start taking assessments.', icon: ClipboardCheck },
                  { step: '04', title: 'Auto Result & Analysis', desc: 'Instant merit list generation with deep subject-wise performance analytics.', icon: BarChart3 }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center space-y-6 group">
                    <div className="relative">
                       <div className="h-20 w-20 rounded-[2rem] bg-white shadow-xl border-2 border-slate-100 flex items-center justify-center text-primary group-hover:scale-110 group-hover:border-primary transition-all duration-500">
                          <item.icon className="h-10 w-10" />
                       </div>
                       <Badge className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-slate-900 text-white font-black flex items-center justify-center border-4 border-white shadow-lg">{item.step}</Badge>
                    </div>
                    <div className="space-y-2">
                       <h4 className="font-headline font-bold text-xl text-slate-900">{item.title}</h4>
                       <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-20 flex justify-center">
                 <Link href="/auth/register">
                    <Button size="lg" className="rounded-2xl h-16 px-12 font-black text-lg gap-2 shadow-xl shadow-primary/20">
                       Start Now <ArrowRight className="h-5 w-5" />
                    </Button>
                 </Link>
              </div>
            </div>
          </section>
        )}

        {/* Student Section Detailed - TEXT ONLY */}
        <section id="for-students" className="w-full py-20 md:py-40 bg-white">
           <div className="container px-4 md:px-12 mx-auto">
              <div className="max-w-4xl mx-auto text-center space-y-10">
                 <div className="space-y-6">
                    <Badge className="bg-emerald-500 text-white font-black px-6 py-2 rounded-full text-xs tracking-[0.2em] uppercase">ASPIRANT MODULE</Badge>
                    <h2 className="text-4xl md:text-7xl font-headline font-bold text-slate-900 tracking-tighter leading-[1.1]">
                       Prepare with <br/><span className="text-emerald-600">National Test Series</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-3xl mx-auto">
                       Get the real exam experience with India's most accurate Mock Tests. Compete with thousands of students and track your progress in real-time.
                    </p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {[
                      { title: "National Ranking", desc: "See where you stand among thousands of aspirants.", icon: Trophy },
                      { title: "Deep Analytics", desc: "Subject-wise accuracy and speed analysis.", icon: LineChart },
                      { title: "Verified Certificates", desc: "Get board-certified scorecards and merit certificates.", icon: Award }
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-4 text-center p-6 rounded-[2rem] hover:bg-slate-50 transition-all">
                         <div className="h-16 w-16 rounded-[2rem] bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                            <item.icon className="h-8 w-8" />
                         </div>
                         <div className="space-y-2">
                            <h4 className="text-xl font-bold text-slate-900">{item.title}</h4>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="pt-8">
                    <Link href="/global-exams">
                       <Button size="lg" className="rounded-2xl h-18 px-16 font-black text-xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 h-16">
                          Explore Mock Tests <ArrowRight className="ml-3 h-6 w-6" />
                       </Button>
                    </Link>
                 </div>
              </div>
           </div>
        </section>

        {/* Paperless & Cost Efficiency */}
        <section className="w-full py-20 md:py-40 bg-slate-50 border-y border-slate-100 overflow-hidden">
           <div className="container px-4 md:px-12 mx-auto">
              <div className="max-w-4xl mx-auto text-center space-y-6 mb-20">
                 <Badge className="bg-primary/10 text-primary font-black px-6 py-2 rounded-full text-[10px] tracking-[0.2em] uppercase">THE COST REVOLUTION</Badge>
                 <h2 className="text-3xl md:text-7xl font-headline font-bold text-slate-900 tracking-tighter">Digital is Cheaper & Smarter</h2>
                 <p className="text-slate-500 text-lg md:text-2xl font-medium leading-relaxed">Stop wasting thousands on printing and manual handling. Upgrade your institute to the paperless digital era for just ₹1.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                   { label: 'Paper & Printing', conventional: '₹5.00', digital: '₹0.00', icon: Printer, color: 'text-rose-500' },
                   { label: 'Manual Checking', conventional: '₹10.00', digital: '₹0.00', icon: CheckCircle2, color: 'text-emerald-500' },
                   { label: 'Result Delivery', conventional: '₹2.00', digital: '₹0.00', icon: Send, color: 'text-blue-500' }
                 ].map((comp, i) => (
                   <Card key={i} className="border-none shadow-sm rounded-[2rem] bg-white p-8 space-y-6">
                      <div className="flex items-center gap-3">
                         <div className={cn("h-10 w-10 rounded-xl bg-slate-50 shadow-sm flex items-center justify-center", comp.color)}>
                            <comp.icon className="h-5 w-5" />
                         </div>
                         <h4 className="font-bold text-slate-900">{comp.label}</h4>
                      </div>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center opacity-40">
                            <span className="text-xs font-bold uppercase tracking-widest">Conventional</span>
                            <span className="text-sm font-black line-through">{comp.conventional}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest text-primary">With {siteName}</span>
                            <span className="text-xl font-black text-primary">{comp.digital}</span>
                         </div>
                      </div>
                   </Card>
                 ))}
              </div>
           </div>
        </section>

        {/* Vision Guard Security AI */}
        {showVisionGuard && (
          <section className="w-full py-20 md:py-32 bg-slate-900 text-white overflow-hidden relative">
             <div className="absolute inset-0 bg-[url('https://placehold.co/1000x1000/000000/111111/png')] opacity-20" />
             <div className="container px-4 md:px-12 mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row gap-20 items-center">
                   <div className="none lg:w-1/2 space-y-8">
                      <Badge className="bg-primary text-white font-black px-6 py-2 rounded-full text-xs tracking-[0.3em] uppercase">ADVANCED PROCTORING</Badge>
                      <h2 className="text-4xl md:text-7xl font-headline font-bold tracking-tighter leading-none">
                         Stop Cheating with <br/> <span className="text-primary">Vision Guard™</span>
                      </h2>
                      <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed">
                         Our proprietary AI engine monitors students through their webcams in real-time, detecting mobile phones, extra persons, and unauthorized browser tab switches.
                      </p>
                      <div className="space-y-4">
                         {[
                           { label: 'Real-time Facial Landmark Recognition', icon: ShieldCheck },
                           { label: 'Automated Tab-Switch Lock System', icon: MonitorCheck },
                           { label: 'Incident Snapshots with Time-stamps', icon: Clock }
                         ].map((l, i) => (
                           <div key={i} className="flex items-center gap-3 text-slate-300 font-bold">
                              <CheckCircle2 className="h-5 w-5 text-primary" /> {l.label}
                           </div>
                         ))}
                      </div>
                   </div>
                   <div className="lg:w-1/2 relative group">
                      <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-3xl group-hover:bg-primary/40 transition-all duration-1000" />
                      <div className="relative aspect-video bg-black rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl flex items-center justify-center">
                         <Video className="h-20 w-20 text-white/10 animate-pulse" />
                         <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Vision Guard Active</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </section>
        )}

        {/* FAQ Section */}
        {showFaq && (
          <section id="faq" className="w-full py-20 md:py-32 bg-white">
            <div className="container px-4 md:px-12 mx-auto max-w-5xl">
              <div className="text-center mb-16 md:mb-24 space-y-6">
                <div className="bg-primary/10 w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto text-primary shadow-inner">
                   <HelpCircle className="h-8 w-8" />
                </div>
                <h2 className="text-3xl md:text-6xl font-headline font-bold text-slate-900 tracking-tighter">Help Center</h2>
              </div>
              <Accordion type="single" collapsible className="w-full space-y-4">
                {[
                  { q: "Is this portal for students or institutions?", a: "Both! Students can join our national Mock Test Series, while institutions can register to get their own dedicated portal to conduct private exams." },
                  { q: "How much does it cost for a coaching center?", a: "We follow a Pay-Per-Student model of ₹1 per attempt. No monthly subscriptions, no setup fees, and credits have lifetime validity." },
                  { q: "Can I use my own branding?", a: "Absolutely. Once an institute registers, they can upload their logo and brand name, which will be visible on the exam screens and result scripts." },
                  { q: "How do students join a private institutional exam?", a: "Institutes can share a unique exam link with their students. Students just need their roll number to verify and start the assessment." },
                  { q: "Is Vision Guard AI mandatory?", a: "No. Institutes can toggle AI proctoring on or off while creating each examination paper." },
                  { q: "What languages are supported?", a: "The platform supports English, Hindi, and most local Indian languages for question papers." }
                ].map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="bg-slate-50 px-8 rounded-[2rem] border-none shadow-sm overflow-hidden mb-4">
                    <AccordionTrigger className="text-left font-bold text-lg md:text-xl text-slate-900 py-6 hover:no-underline">{faq.q}</AccordionTrigger>
                    <AccordionContent className="text-slate-500 text-base md:text-lg font-medium pb-8 leading-relaxed">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-slate-900 text-white py-16 md:py-32 border-t">
        <div className="container px-4 md:px-12 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20 md:mb-32">
            <div className="md:col-span-5 space-y-8">
              <div className="flex items-center gap-3">
                {platformLogoUrl ? (
                   <img src={platformLogoUrl} alt={siteName} className="h-12 w-auto object-contain" />
                ) : (
                  <>
                    <div className="bg-primary p-2 rounded-xl text-white"><Shield className="h-8 w-8" /></div>
                    <span className="font-headline font-bold text-3xl tracking-tight">{siteName}</span>
                  </>
                )}
              </div>
              <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-md">{footerAboutText}</p>
              
              {/* Dynamic Social Icons */}
              <div className="flex items-center gap-6 pt-4">
                 {config?.whatsappUrl && (
                   <a href={config.whatsappUrl} target="_blank" rel="noopener noreferrer" className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-green-500 hover:border-green-500 transition-all group">
                      <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
                   </a>
                 )}
                 {config?.instagramUrl && (
                   <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-pink-600 hover:border-pink-600 transition-all group">
                      <Instagram className="h-6 w-6 group-hover:scale-110 transition-transform" />
                   </a>
                 )}
                 {config?.facebookUrl && (
                   <a href={config.facebookUrl} target="_blank" rel="noopener noreferrer" className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-600 transition-all group">
                      <Facebook className="h-6 w-6 group-hover:scale-110 transition-transform" />
                   </a>
                 )}
                 {config?.youtubeUrl && (
                   <a href={config.youtubeUrl} target="_blank" rel="noopener noreferrer" className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-red-600 hover:border-red-600 transition-all group">
                      <Youtube className="h-6 w-6 group-hover:scale-110 transition-transform" />
                   </a>
                 )}
              </div>
            </div>
            <div className="md:col-span-3 space-y-6">
              <h4 className="font-black text-xs uppercase tracking-[0.4em] text-primary">Quick Navigation</h4>
              <nav className="flex flex-col gap-4 font-bold text-slate-400 text-lg">
                <Link className="hover:text-white transition-colors" href="/global-exams">Test Series Portal</Link>
                <Link className="hover:text-white transition-colors" href="/auth/register">Institutional Setup</Link>
                <Link className="hover:text-white transition-colors" href="/pricing">Pricing Plans</Link>
                <Link className="hover:text-white transition-colors" href="/terms">Privacy & Legal</Link>
              </nav>
            </div>
            <div className="md:col-span-4 space-y-6">
              <h4 className="font-black text-xs uppercase tracking-[0.4em] text-primary">Get in Touch</h4>
              <div className="space-y-4">
                <p className="text-slate-400 text-lg font-medium leading-relaxed">{contactAddress}</p>
                <p className="text-primary font-bold text-xl">{contactEmail}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">© 2024 {siteName} Global. All rights reserved.</p>
            <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              <Link href="/terms" className="hover:text-white">Compliance</Link>
              <Link href="/terms" className="hover:text-white">GDPR</Link>
              <Link href="/terms" className="hover:text-white">Security</Link>
            </div>
          </div>
        </div>
      </footer>
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
