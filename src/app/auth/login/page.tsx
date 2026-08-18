"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { 
  useAuth, 
  useUser, 
  useFirestore, 
  initiateEmailSignIn, 
  useDoc,
  useMemoFirebase
} from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activity-logger';
import { doc } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const ADMIN_EMAIL = 'kvikash@gmail.com';

  const configRef = useMemoFirebase(() => db ? doc(db, 'platformConfig', 'settings') : null, [db]);
  const { data: config } = useDoc(configRef);
  const platformLogoUrl = config?.platformLogoUrl || null;
  const siteName = config?.siteName || "My Exam";

  const checkRedirect = useCallback(async (currentUser: any) => {
    if (!db || !currentUser) return;

    const userEmail = currentUser.email?.toLowerCase();
    const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase();
    
    if (isAdmin) {
      toast({ title: "Admin Portal Unlocked" });
      router.push('/admin/dashboard');
      return;
    }

    // Log the successful login for non-admin centers
    logActivity(db, currentUser.uid, userEmail || 'Institutional User', 'LOGIN', 'Authenticated into center dashboard.');

    toast({ title: "Welcome Back" });
    router.push('/center/dashboard');
  }, [db, router, toast, ADMIN_EMAIL]);

  useEffect(() => {
    if (user && !isUserLoading && !user.isAnonymous) {
      checkRedirect(user);
    }
  }, [user, isUserLoading, checkRedirect]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !email || !password) return;
    
    setLoading(true);
    const inputEmail = email.toLowerCase();

    initiateEmailSignIn(auth, inputEmail, password, (error: any) => {
      let errorMessage = "Invalid login details. Please check your email/password.";
      toast({ variant: "destructive", title: "Login Failed", description: errorMessage });
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 exam-grid">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            {platformLogoUrl ? (
              <img src={platformLogoUrl} alt={siteName} className="h-12 w-auto mx-auto object-contain" />
            ) : (
              <>
                <Shield className="h-8 w-8 text-primary" />
                <span className="font-headline font-bold text-2xl text-primary">{siteName}</span>
              </>
            )}
          </Link>
          <h1 className="text-3xl font-headline font-bold text-slate-900">Institute Login</h1>
          <p className="text-slate-500 mt-2">Access your institutional control center</p>
        </div>

        {isUserLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Validating Session...</p>
          </div>
        ) : (
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
            <div className="h-2 bg-primary"></div>
            <CardHeader>
              <CardTitle className="font-headline">Welcome Back</CardTitle>
              <CardDescription>Enter registered email to access your exams.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="center-email">Institutional Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                      id="center-email" 
                      type="email" 
                      placeholder="admin@school.com" 
                      className="pl-10 h-11 rounded-xl" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="center-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                      id="center-password" 
                      type="password" 
                      placeholder="••••••••"
                      className="pl-10 h-11 rounded-xl" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full font-black h-12 rounded-xl shadow-lg shadow-primary/20" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authorizing...</> : "Open Console"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 border-t py-6 bg-slate-50/50 rounded-b-3xl">
              <p className="text-sm text-slate-500 font-medium">
                New center? <Link href="/auth/register" className="text-primary font-black hover:underline">Register Institution</Link>
              </p>
              <Link href="/auth/admin-login" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1">
                System Administrator Access <ArrowRight className="h-2 w-2" />
              </Link>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}