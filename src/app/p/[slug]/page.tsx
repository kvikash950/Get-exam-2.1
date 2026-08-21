
"use client";

import { useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Share2, 
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';

function PageContent() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const db = useFirestore();

  const pageQuery = useMemoFirebase(() => {
    if (!db || !slug) return null;
    return query(collection(db, 'pages'), where('slug', '==', slug), limit(1));
  }, [db, slug]);

  const { data: pages, isLoading } = useCollection(pageQuery);
  const page = pages?.[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-headline font-bold uppercase tracking-widest text-[10px]">Loading Secure Page...</p>
      </div>
    );
  }

  if (!page || (!page.isPublished && !isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-md w-full text-center p-12 border-none shadow-2xl rounded-[2.5rem]">
          <div className="bg-red-50 text-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-headline font-bold text-slate-900">Page Not Found</h1>
          <p className="text-slate-500 mt-4 leading-relaxed font-medium">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link href="/" className="block mt-8">
            <Button size="lg" className="w-full font-bold shadow-lg shadow-primary/20 rounded-xl">Return Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary/10">
      <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 px-4 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
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

      <main className="container mx-auto max-w-4xl px-4 py-12 md:py-24">
        <div className="space-y-12">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 px-4 py-1.5 rounded-full">
              <FileText className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Official Portal Page</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight text-slate-900 leading-[1.1]">
              {page.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-200 pb-8">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary/40" />
                <span>Updated: {new Date(page.updatedAt?.toMillis?.() || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary/40" />
                <span>Verified Content</span>
              </div>
            </div>
          </div>

          <article className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* HTML Rendering Engine with Tailwind Typography */}
            <div 
              className="prose prose-slate prose-lg max-w-none prose-headings:font-headline prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-3xl prose-img:shadow-xl"
              dangerouslySetInnerHTML={{ __html: page.content }} 
            />
          </article>

          <footer className="pt-12 border-t mt-20 flex flex-col md:flex-row justify-between items-center gap-8 opacity-60">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary/40" />
              <div className="flex flex-col">
                <span className="font-headline font-bold text-sm tracking-tight">Get Exam Verification</span>
                <span className="text-[8px] font-black uppercase tracking-widest">Platform Integrity Sealed</span>
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" size="sm" className="rounded-full h-10 px-6 font-bold gap-2">
                <Share2 className="h-4 w-4" /> Share Page
              </Button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default function DynamicStaticPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Content...</div>}>
      <PageContent />
    </Suspense>
  );
}
