"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Shield, Lock, Loader2, Key, ChevronLeft } from 'lucide-react';
import { 
  useAuth, 
  useUser, 
  initiateEmailSignIn, 
  initiateEmailSignUp
} from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('kvikash@gmail.com');
  const [password, setPassword] = useState('');

  const ADMIN_EMAIL = 'kvikash@gmail.com';
  const MASTER_PASSWORD = 'Aaradya@12345';

  useEffect(() => {
    if (user && !isUserLoading && !user.isAnonymous && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      router.push('/admin/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !email || !password) return;
    
    setLoading(true);
    const inputEmail = email.toLowerCase();
    const isMasterLogin = inputEmail === ADMIN_EMAIL.toLowerCase() && password === MASTER_PASSWORD;

    initiateEmailSignIn(auth, inputEmail, password, (error: any) => {
      if (isMasterLogin && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential')) {
        initiateEmailSignUp(auth, inputEmail, password, (signupError: any) => {
          if (signupError) {
            toast({ variant: "destructive", title: "Auth Error", description: signupError.message });
            setLoading(false);
          }
        });
        return;
      }

      toast({ variant: "destructive", title: "Access Denied", description: "Invalid system key or administrative email." });
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[url('https://placehold.co/1000x1000/000000/111111/png')] opacity-20 pointer-events-none"></div>
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors text-sm font-bold">
            <ChevronLeft className="h-4 w-4" /> Back to Portal
          </Link>
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-2xl shadow-primary/20">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-headline font-bold text-white tracking-tight">Master Control</h1>
          <p className="text-slate-500 mt-2 font-medium">Restricted Administrative Access Only</p>
        </div>

        <Card className="border-slate-800 bg-slate-900 shadow-2xl rounded-3xl border-2">
          <CardHeader className="pb-8 pt-8">
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" /> Authority Verification
            </CardTitle>
            <CardDescription className="text-slate-500">Provide administrative credentials to unlock system tools.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-slate-400 font-bold text-xs uppercase tracking-widest">Admin Identifier</Label>
                <Input 
                  id="admin-email" 
                  type="email" 
                  className="bg-slate-950 border-slate-800 h-12 rounded-xl text-white focus:border-primary transition-all" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-slate-400 font-bold text-xs uppercase tracking-widest">System Key</Label>
                <Input 
                  id="admin-password" 
                  type="password" 
                  placeholder="••••••••••••"
                  className="bg-slate-950 border-slate-800 h-12 rounded-xl text-white focus:border-primary transition-all" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full font-black shadow-xl shadow-primary/20 h-14 rounded-xl text-lg uppercase tracking-widest transition-all hover:scale-[1.02]" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Unlock System"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pb-8 pt-4 justify-center">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
              Encryption Active
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}