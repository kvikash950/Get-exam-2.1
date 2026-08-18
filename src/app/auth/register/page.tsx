"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Mail, Lock, Building, User, Phone, MapPin, Loader2 } from 'lucide-react';
import { useAuth, useUser, initiateEmailSignUp, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    centerName: '',
    ownerName: '',
    mobileNumber: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ADMIN_EMAIL = 'kvikash@gmail.com';

  const configRef = useMemoFirebase(() => db ? doc(db, 'platformConfig', 'settings') : null, [db]);
  const { data: config } = useDoc(configRef);
  const platformLogoUrl = config?.platformLogoUrl || null;
  const siteName = config?.siteName || "My Exam";

  const generateCenterCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `MX-${code}`;
  };

  useEffect(() => {
    if (user && isSubmitting && !isUserLoading) {
      const createProfiles = async () => {
        try {
          const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
          const role = isAdmin ? 'Admin' : 'CoachingCenter';
          const centerCode = isAdmin ? 'MX-ADMIN' : generateCenterCode();

          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            id: user.uid,
            email: user.email,
            role: role,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          if (isAdmin) {
            const adminRef = doc(db, 'admin_roles', user.uid);
            await setDoc(adminRef, {
              id: user.uid,
              email: user.email,
              role: 'Admin',
              updatedAt: serverTimestamp()
            });
          }

          const profileRef = doc(db, 'coaching_centers', user.uid);
          await setDoc(profileRef, {
            id: user.uid,
            coachingCenterOwnerUserId: user.uid,
            centerCode: centerCode,
            name: formData.centerName || (isAdmin ? "Platform Administrator" : ""),
            ownerName: formData.ownerName || (isAdmin ? "Admin User" : ""),
            email: user.email,
            registrationPassword: formData.password,
            mobileNumber: `+91${formData.mobileNumber}`,
            address: formData.address,
            subscriptionPlanId: isAdmin ? 'pro-tier' : 'free-tier',
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          toast({
            title: isAdmin ? "Admin Access Granted" : "Registration Successful",
            description: "Your institutional portal is now ready.",
          });
          
          router.push(isAdmin ? '/admin/dashboard' : '/center/dashboard');
        } catch (error: any) {
          console.error("Profile creation error:", error);
          toast({ variant: "destructive", title: "Setup Error", description: "Account created but profile setup failed." });
          router.push('/auth/login');
        } finally {
          setIsSubmitting(false);
          setLoading(false);
        }
      };
      createProfiles();
    }
  }, [user, isSubmitting, isUserLoading, db, formData, router, toast, ADMIN_EMAIL]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (formData.mobileNumber.length !== 10) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid 10-digit mobile number."
      });
      return;
    }

    setLoading(true);
    setIsSubmitting(true);
    initiateEmailSignUp(auth, formData.email, formData.password, (error: any) => {
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: error.message || "Failed to create account."
      });
      setLoading(false);
      setIsSubmitting(false);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id === 'mobileNumber') {
      const sanitized = value.replace(/[^0-9]/g, '').slice(0, 10);
      setFormData({ ...formData, [id]: sanitized });
    } else {
      setFormData({ ...formData, [id]: value });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 exam-grid py-12">
      <div className="w-full max-w-2xl space-y-10">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            {platformLogoUrl ? (
              <img src={platformLogoUrl} alt={siteName} className="h-12 w-auto mx-auto object-contain" />
            ) : (
              <div className="flex items-center gap-3">
                <div className="bg-primary p-2 rounded-xl text-white shadow-lg">
                  <Shield className="h-6 w-6" />
                </div>
                <span className="font-headline font-bold text-3xl text-primary">{siteName}</span>
              </div>
            )}
          </Link>
          <h1 className="text-3xl font-headline font-bold text-slate-900">Institutional Onboarding</h1>
          <p className="text-slate-500 font-medium max-w-md mx-auto">Access the world's most secure and accessible examination ecosystem.</p>
        </div>

        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <div className="h-2 bg-primary"></div>
          <CardHeader className="pt-10 px-10">
            <CardTitle className="text-xl font-headline flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" /> Center Credentials
            </CardTitle>
            <CardDescription>Enter your official details to establish your identity.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-6">
            <form onSubmit={handleRegister} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="centerName" className="font-bold text-xs uppercase text-slate-400 tracking-widest">Institution Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                    <Input 
                      id="centerName" 
                      placeholder="e.g. Imperial Academy" 
                      className="pl-10 h-12 bg-slate-50 border-none rounded-xl" 
                      required 
                      value={formData.centerName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="font-bold text-xs uppercase text-slate-400 tracking-widest">Authorized Contact</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                    <Input 
                      id="ownerName" 
                      placeholder="Full Name" 
                      className="pl-10 h-12 bg-slate-50 border-none rounded-xl" 
                      required 
                      value={formData.ownerName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold text-xs uppercase text-slate-400 tracking-widest">Official Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="admin@institution.edu" 
                      className="pl-10 h-12 bg-slate-50 border-none rounded-xl" 
                      required 
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber" className="font-bold text-xs uppercase text-slate-400 tracking-widest">Contact Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                    <div className="absolute left-10 top-3 text-slate-400 font-bold text-sm">+91</div>
                    <Input 
                      id="mobileNumber" 
                      type="tel" 
                      placeholder="XXXXX XXXXX" 
                      className="pl-20 h-12 bg-slate-50 border-none rounded-xl" 
                      required 
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      maxLength={10}
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="font-bold text-xs uppercase text-slate-400 tracking-widest">Physical Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                    <Input 
                      id="address" 
                      placeholder="Complete Postal Address" 
                      className="pl-10 h-12 bg-slate-50 border-none rounded-xl" 
                      required 
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="password" className="font-bold text-xs uppercase text-slate-400 tracking-widest">System Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Secure passphrase (min 6 chars)" 
                      className="pl-10 h-12 bg-slate-50 border-none rounded-xl" 
                      required 
                      minLength={6}
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button type="submit" className="w-full h-14 font-bold text-lg rounded-2xl shadow-xl shadow-primary/20" disabled={loading}>
                  {loading ? <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Finalizing Profiles...</> : "Start Instant Setup"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t py-8 bg-slate-50">
            <p className="text-sm text-slate-500 font-medium">
              Existing user? <Link href="/auth/login" className="text-primary font-bold hover:underline">Sign In Here</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}