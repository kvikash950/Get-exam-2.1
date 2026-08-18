
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Shield, 
  LayoutDashboard, 
  FileText, 
  Settings, 
  BarChart, 
  LogOut, 
  Menu,
  Loader2,
  CheckCircle2,
  MapPin,
  User,
  Heart,
  Image as ImageIcon,
  Camera,
  Download,
  Filter,
  XCircle,
  Calendar,
  Eye,
  Mail,
  Phone,
  Info,
  Fingerprint,
  Power,
  CheckCircle,
  LineChart,
  Droplet,
  Home,
  Plus,
  Send
} from 'lucide-react';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useAuth, 
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export default function StudentManagerPage() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Today's date for DOB restriction
  const [today, setToday] = useState('');
  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
  }, []);

  const [newStudent, setNewStudent] = useState({
    name: '',
    rollNumber: '',
    mobileNumber: '',
    email: '',
    batchName: '',
    fatherName: '',
    motherName: '',
    address: '',
    photoUrl: '',
    dob: '',
    bloodGroup: ''
  });

  const studentsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, 'coaching_centers', user.uid, 'student_enrollments');
  }, [db, user?.uid]);
  const { data: students, isLoading } = useCollection(studentsQuery);

  const uniqueBatches = useMemo(() => {
    if (!students) return [];
    const batches = Array.from(new Set(students.map(s => s.batchName || 'General'))).filter(Boolean);
    return batches.sort();
  }, [students]);

  // Duplicate Check Logic
  const isDuplicateRoll = useMemo(() => {
    if (!newStudent.rollNumber.trim() || !students) return false;
    const targetBatch = newStudent.batchName.trim() || 'General';
    return students.some(s => 
      s.rollNumber.toUpperCase() === newStudent.rollNumber.trim().toUpperCase() && 
      (s.batchName || 'General').toUpperCase() === targetBatch.toUpperCase()
    );
  }, [newStudent.rollNumber, newStudent.batchName, students]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(s => {
      const matchesSearch = 
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBatch = batchFilter === 'all' || (s.batchName || 'General') === batchFilter;
      
      const isActive = s.isActive !== false;
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && isActive) || 
        (statusFilter === 'inactive' && !isActive);

      return matchesSearch && matchesBatch && matchesStatus;
    });
  }, [students, searchTerm, batchFilter, statusFilter]);

  const handleExport = () => {
    if (!filteredStudents.length) return;

    const headers = ["Name", "Roll Number", "Date of Birth", "Batch", "Mobile", "Email", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredStudents.map(s => [
        `"${s.name}"`,
        `"${s.rollNumber}"`,
        `"${s.dob || 'N/A'}"`,
        `"${s.batchName || 'General'}"`,
        `"${s.mobileNumber || ''}"`,
        `"${s.email || ''}"`,
        `"${s.isActive !== false ? 'Active' : 'Inactive'}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `student_directory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Export Complete", description: "CSV file has been generated." });
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user?.uid || loading || isDuplicateRoll) return;

    // Strict Validations
    if (!newStudent.name.trim()) {
      toast({ variant: "destructive", title: "Name Required", description: "Please enter the student's name." });
      return;
    }

    if (newStudent.mobileNumber.length !== 10) {
      toast({ variant: "destructive", title: "Invalid Phone", description: "Mobile number must be exactly 10 digits." });
      return;
    }

    const roll = newStudent.rollNumber.trim().toUpperCase();
    if (!roll) {
      toast({ variant: "destructive", title: "Roll ID Missing", description: "Please enter a Roll Number." });
      return;
    }

    setLoading(true);
    try {
      const colRef = collection(db, 'coaching_centers', user.uid, 'student_enrollments');
      const targetBatch = newStudent.batchName.trim() || 'General';
      
      const payload = {
        name: newStudent.name.trim(),
        rollNumber: roll,
        mobileNumber: newStudent.mobileNumber,
        email: newStudent.email.trim() || '',
        batchName: targetBatch,
        fatherName: newStudent.fatherName.trim() || '',
        motherName: newStudent.motherName.trim() || '',
        address: newStudent.address.trim() || '',
        photoUrl: newStudent.photoUrl.trim() || '',
        dob: newStudent.dob || '',
        bloodGroup: newStudent.bloodGroup || '',
        coachingCenterId: user.uid,
        coachingCenterOwnerUserId: user.uid,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      addDocumentNonBlocking(colRef, payload);

      toast({ 
        title: "Registration Success", 
        description: `${newStudent.name} has been enrolled successfully in ${targetBatch}.` 
      });
      
      // Reset and close
      setIsAddOpen(false);
      setNewStudent({ 
        name: '', rollNumber: '', mobileNumber: '', email: '', batchName: '',
        fatherName: '', motherName: '', address: '', photoUrl: '', dob: '', bloodGroup: ''
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "System Error", description: "Failed to save student record." });
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentStatus = (studentId: string, currentStatus: boolean) => {
    if (!db || !user?.uid) return;
    const docRef = doc(db, 'coaching_centers', user.uid, 'student_enrollments', studentId);
    updateDocumentNonBlocking(docRef, {
      isActive: !currentStatus,
      updatedAt: serverTimestamp()
    });
    toast({
      title: !currentStatus ? "Student Activated" : "Student Deactivated",
      description: `Access status has been updated.`,
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!db || !user?.uid) return;
    if (confirm(`Remove ${name} from your records? This action is permanent.`)) {
      deleteDocumentNonBlocking(doc(db, 'coaching_centers', user.uid, 'student_enrollments', id));
      toast({ title: "Record Deleted" });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth/login');
  };

  const handlePhoneInput = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setNewStudent(prev => ({...prev, mobileNumber: cleaned}));
  };

  const NavItems = () => (
    <nav className="flex-1 p-4 space-y-1.5">
      <Link href="/center/dashboard"><Button variant="ghost" className="w-full justify-start gap-3"><LayoutDashboard className="h-4 w-4" /> Console Home</Button></Link>
      <Link href="/center/students"><Button variant="secondary" className="w-full justify-start gap-3 bg-primary/10 text-primary"><Users className="h-4 w-4" /> Student Manager</Button></Link>
      <Link href="/center/exams"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-600"><FileText className="h-4 w-4" /> Exam Manager</Button></Link>
      <Link href="/center/results"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-600"><BarChart className="h-4 w-4" /> Reports</Button></Link>
      <Link href="/center/profile"><Button variant="ghost" className="w-full justify-start gap-3 text-slate-600"><Settings className="h-4 w-4" /> Center Profile</Button></Link>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r hidden md:flex flex-col sticky top-0 h-screen shadow-sm">
        <div className="p-6 border-b flex items-center gap-3"><Shield className="h-5 w-5 text-primary" /><span className="font-headline font-bold text-xl">Get Exam</span></div>
        <NavItems />
        <div className="p-4 border-t"><Button variant="ghost" className="w-full justify-start gap-3 text-red-600" onClick={handleLogout}><LogOut className="h-4 w-4" /> Log Out</Button></div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex md:hidden items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-headline font-bold text-lg">Get Exam</span></div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu className="h-6 w-6" /></Button></SheetTrigger>
            <SheetContent side="left" className="p-0 w-72"><NavItems /></SheetContent>
          </Sheet>
        </header>

        <main className="p-4 md:p-10 max-w-6xl mx-auto w-full space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div><h1 className="text-3xl font-headline font-bold text-slate-900">Student Directory</h1><p className="text-slate-500 font-medium">Verified institutional records for secure assessments.</p></div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" onClick={handleExport} className="gap-2 font-bold h-11 shadow-sm flex-1 md:flex-none">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button onClick={() => setIsAddOpen(true)} className="gap-2 font-bold h-11 shadow-lg shadow-primary/20 flex-1 md:flex-none">
                <UserPlus className="h-4 w-4" /> New Enrollment
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search name or roll number..." className="pl-10 h-11" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div>
                  <Select value={batchFilter} onValueChange={setBatchFilter}>
                    <SelectTrigger className="h-11 bg-white"><Filter className="h-3.5 w-3.5 mr-2" /><SelectValue placeholder="All Batches" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Batches</SelectItem>{uniqueBatches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-11 bg-white"><Filter className="h-3.5 w-3.5 mr-2" /><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active Only</SelectItem><SelectItem value="inactive">Inactive Only</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-20 text-center"><Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" /></div>
              ) : filteredStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow className="bg-slate-50/50">
                      <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Candidate</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Roll</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Analysis</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                      <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Manage</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {filteredStudents.map((s) => {
                        const isActive = s.isActive !== false;
                        return (
                          <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="pl-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-slate-200">
                                  <AvatarImage src={s.photoUrl} alt={s.name} className="object-cover" />
                                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{s.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col"><span className="font-bold text-slate-900">{s.name}</span><span className="text-[10px] text-slate-400 font-medium">{s.mobileNumber || 'No Phone'}</span></div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center"><Badge variant="outline" className="bg-white border-primary/20 text-primary font-black px-3 h-7">{s.rollNumber}</Badge></TableCell>
                            <TableCell className="text-center">
                              <Link href={`/center/students/${s.id}/performance`}>
                                <Button variant="ghost" size="sm" className="h-8 gap-2 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50">
                                  <LineChart className="h-3.5 w-3.5" /> Performance
                                </Button>
                              </Link>
                            </TableCell>
                            <TableCell>
                              {isActive ? (
                                <Badge className="bg-green-50 text-green-700 border-green-100 text-[9px] font-black uppercase"><CheckCircle2 className="h-3 w-3 mr-1" /> Active</Badge>
                              ) : (
                                <Badge className="bg-red-50 text-red-700 border-red-100 text-[9px] font-black uppercase"><XCircle className="h-3 w-3 mr-1" /> Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex justify-end gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className={cn("h-8 w-8", isActive ? "text-red-400 hover:text-red-600" : "text-green-500 hover:text-green-700")} onClick={() => toggleStudentStatus(s.id, isActive)}>
                                        {isActive ? <Power className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{isActive ? 'Deactivate' : 'Activate'}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <Button variant="ghost" size="icon" className="text-primary h-8 w-8" onClick={() => { setSelectedStudent(s); setIsDetailsOpen(true); }}><Eye className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 h-8 w-8" onClick={() => handleDelete(s.id, s.name)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : <div className="py-32 text-center text-slate-400 italic text-sm">No students match the current filters.</div>}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Enrollment Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary p-6 text-white text-center shrink-0">
            <DialogHeader>
              <DialogTitle className="text-white text-2xl font-headline font-bold">Student Enrollment</DialogTitle>
              <DialogDescription className="text-white/70 font-medium">Register candidate for the institutional portal.</DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleAddStudent} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold"><User className="h-4 w-4 text-primary" /> Full Name</Label>
                <Input required value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} placeholder="Enter name" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold"><Fingerprint className="h-4 w-4 text-primary" /> Roll Number</Label>
                <Input 
                  required 
                  value={newStudent.rollNumber} 
                  onChange={(e) => setNewStudent({...newStudent, rollNumber: e.target.value})} 
                  placeholder="Unique ID" 
                  className={cn(isDuplicateRoll && "border-red-500 focus-visible:ring-red-500")}
                />
                {isDuplicateRoll && (
                  <p className="text-[10px] text-red-500 font-bold animate-in fade-in slide-in-from-top-1">
                    Duplicate Roll number in this batch
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold"><Calendar className="h-4 w-4 text-primary" /> Date of Birth</Label>
                <Input type="date" required max={today} value={newStudent.dob} onChange={(e) => setNewStudent({...newStudent, dob: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold"><ImageIcon className="h-4 w-4 text-primary" /> Photo URL</Label>
                <Input value={newStudent.photoUrl} onChange={(e) => setNewStudent({...newStudent, photoUrl: e.target.value})} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold"><LayoutDashboard className="h-4 w-4 text-primary" /> Batch / Class</Label>
                <Input 
                  list="batch-suggestions"
                  required
                  value={newStudent.batchName} 
                  onChange={(e) => setNewStudent({...newStudent, batchName: e.target.value})} 
                  placeholder="Select or type new batch" 
                />
                <datalist id="batch-suggestions">
                  {uniqueBatches.map(batch => <option key={batch} value={batch} />)}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold"><Phone className="h-4 w-4 text-primary" /> Contact Number</Label>
                <Input 
                  required
                  type="text"
                  inputMode="numeric"
                  value={newStudent.mobileNumber} 
                  onChange={(e) => handlePhoneInput(e.target.value)} 
                  placeholder="10 digit mobile" 
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold"><User className="h-4 w-4 text-primary" /> Father's Name</Label>
                <Input value={newStudent.fatherName} onChange={(e) => setNewStudent({...newStudent, fatherName: e.target.value})} placeholder="Father's name" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold"><User className="h-4 w-4 text-primary" /> Mother's Name</Label>
                <Input value={newStudent.motherName} onChange={(e) => setNewStudent({...newStudent, motherName: e.target.value})} placeholder="Mother's name" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-bold"><Droplet className="h-4 w-4 text-red-500" /> Blood Group</Label>
                <Select value={newStudent.bloodGroup} onValueChange={(v) => setNewStudent({...newStudent, bloodGroup: v})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Blood Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2 font-bold"><Home className="h-4 w-4 text-primary" /> Address</Label>
                <Textarea value={newStudent.address} onChange={(e) => setNewStudent({...newStudent, address: e.target.value})} placeholder="Complete postal address" className="min-h-[80px]" />
              </div>
            </div>
            <DialogFooter className="pt-6">
              <Button type="submit" className="w-full h-14 font-bold text-lg rounded-2xl shadow-xl shadow-primary/20" disabled={loading || isDuplicateRoll}>
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Complete Enrollment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 p-8 text-white relative">
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-primary shadow-xl">
                  <AvatarImage src={selectedStudent?.photoUrl} className="object-cover" />
                  <AvatarFallback className="bg-slate-800 text-primary text-3xl font-bold">{selectedStudent?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <DialogTitle className="text-3xl font-headline font-bold text-white leading-none">{selectedStudent?.name}</DialogTitle>
                  <p className="text-primary font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                    <Fingerprint className="h-3 w-3" /> Roll Number: {selectedStudent?.rollNumber}
                  </p>
                  <Badge className={selectedStudent?.isActive !== false ? "bg-green-50 mt-2" : "bg-red-50 mt-2"}>
                    {selectedStudent?.isActive !== false ? "Active Candidate" : "Inactive Record"}
                  </Badge>
                </div>
              </div>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Profile Data</h4>
                <div className="space-y-3">
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Date of Birth</p><p className="font-bold text-slate-900">{selectedStudent?.dob || 'N/A'}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Batch Allocation</p><p className="font-bold text-slate-900">{selectedStudent?.batchName || 'General'}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Blood Group</p><p className="font-bold text-red-600">{selectedStudent?.bloodGroup || 'N/A'}</p></div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Family & Contacts</h4>
                <div className="space-y-3">
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Father's Name</p><p className="font-bold text-slate-900">{selectedStudent?.fatherName || 'N/A'}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Mother's Name</p><p className="font-bold text-slate-900">{selectedStudent?.motherName || 'N/A'}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Mobile Number</p><p className="font-bold text-slate-900">{selectedStudent?.mobileNumber || 'N/A'}</p></div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Permanent Address</h4>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">{selectedStudent?.address || 'No address provided.'}</p>
              </div>
            </div>
            <div className="pt-4"><Link href={`/center/students/${selectedStudent?.id}/performance`} className="w-full"><Button className="w-full font-bold h-12 rounded-xl gap-2"><LineChart className="h-4 w-4" /> View Deep Performance Analysis</Button></Link></div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t"><Button variant="outline" className="w-full font-bold h-12 rounded-xl" onClick={() => setIsDetailsOpen(false)}>Close Registry</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
