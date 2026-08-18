
"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Building, 
  Settings, 
  Shield, 
  LogOut, 
  Zap,
  Plus,
  FileText,
  Eye,
  Pencil,
  Trash2,
  Globe,
  Loader2,
  Menu,
  Save,
  ChevronRight,
  Search,
  Wallet,
  Ticket
} from 'lucide-react';
import { 
  useCollection, 
  useFirestore, 
  useAuth, 
  useUser,
  useMemoFirebase,
  addDocumentNonBlocking,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { collection, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function AdminPagesManager() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const ADMIN_EMAIL = 'kvikash@gmail.com';

  useEffect(() => {
    if (!isUserLoading && (!user || user.isAnonymous || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
      router.push('/auth/login');
    }
  }, [user, isUserLoading, router, ADMIN_EMAIL]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    isPublished: true
  });

  const pagesQuery = useMemoFirebase(() => {
    if (!db || !user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
    return query(collection(db, 'pages'), orderBy('updatedAt', 'desc'));
  }, [db, user, ADMIN_EMAIL]);
  
  const { data: pages, isLoading } = useCollection(pagesQuery);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/auth/login');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Logout failed", description: error.message });
    }
  };

  const handleOpenCreate = () => {
    setEditingPage(null);
    setFormData({ title: '', slug: '', content: '', isPublished: true });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (page: any) => {
    setEditingPage(page);
    setFormData({
      title: page.title || '',
      slug: page.slug || '',
      content: page.content || '',
      isPublished: page.isPublished ?? true
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setLoading(true);

    const payload = {
      ...formData,
      slug: formData.slug.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
      updatedAt: serverTimestamp()
    };

    try {
      if (editingPage) {
        const pageRef = doc(db, 'pages', editingPage.id);
        setDocumentNonBlocking(pageRef, payload, { merge: true });
        toast({ title: "Page Updated" });
      } else {
        const pagesRef = collection(db, 'pages');
        addDocumentNonBlocking(pagesRef, { ...payload, createdAt: serverTimestamp() });
        toast({ title: "Page Created" });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error saving page", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (!db) return;
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteDocumentNonBlocking(doc(db, 'pages', id));
      toast({ title: "Page Deleted" });
    }
  };

  const filteredPages = pages?.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const AdminNav = () => (
    <nav className="flex-1 p-4 space-y-2">
      <Link href="/admin/dashboard"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><LayoutDashboard className="h-4 w-4" /> Overview</Button></Link>
      <Link href="/admin/centers"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Building className="h-4 w-4" /> Institutions</Button></Link>
      <Link href="/admin/revenue"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Wallet className="h-4 w-4" /> Revenue</Button></Link>
      <Link href="/admin/plans"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Zap className="h-4 w-4" /> Plans</Button></Link>
      <Link href="/admin/coupons"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Ticket className="h-4 w-4" /> Coupons</Button></Link>
      <Link href="/admin/pages"><Button variant="secondary" className="w-full justify-start gap-3 text-white"><FileText className="h-4 w-4" /> Pages</Button></Link>
      <Link href="/admin/settings"><Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-800 text-slate-300"><Settings className="h-4 w-4" /> Settings</Button></Link>
    </nav>
  );

  if (isUserLoading || !user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-slate-400">Authenticating Authority...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-headline font-bold text-xl text-primary">Master Admin</span></div>
        <AdminNav />
        <div className="p-4 border-t border-slate-800"><Button variant="ghost" className="w-full justify-start gap-3 text-red-400" onClick={handleLogout}><LogOut className="h-4 w-4" /> Sign Out</Button></div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-slate-900 text-white flex md:hidden items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="font-headline font-bold text-lg text-primary">Get Exam</span></div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="text-white"><Menu className="h-6 w-6" /></Button></SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-slate-900 text-white border-slate-800"><AdminNav /></SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div><h1 className="text-2xl md:text-3xl font-headline font-bold">Platform Pages</h1><p className="text-muted-foreground text-sm">Create dynamic content like Terms, Privacy, or Landing pages.</p></div>
            <Button onClick={handleOpenCreate} className="gap-2 font-bold shadow-lg"><Plus className="h-4 w-4" /> Create New Page</Button>
          </div>

          <Card className="border-none shadow-sm mb-8">
            <CardHeader className="p-4"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Search pages..." className="pl-10 h-11" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></CardHeader>
            <CardContent className="p-0">
              {isLoading ? <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div> : filteredPages.length > 0 ? (
                <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-slate-50/50"><TableHead className="pl-6">Page Title</TableHead><TableHead>Slug</TableHead><TableHead>Status</TableHead><TableHead className="text-right pr-6">Management</TableHead></TableRow></TableHeader><TableBody>{filteredPages.map((page) => (
                  <TableRow key={page.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 font-bold">{page.title}</TableCell>
                    <TableCell><code className="bg-slate-100 px-2 py-1 rounded text-xs">/p/{page.slug}</code></TableCell>
                    <TableCell>{page.isPublished ? <Badge className="bg-green-500">Live</Badge> : <Badge variant="outline">Draft</Badge>}</TableCell>
                    <TableCell className="text-right pr-6"><div className="flex justify-end gap-2"><Link href={`/p/${page.slug}`} target="_blank"><Button variant="ghost" size="icon" className="h-8 w-8 text-primary"><Eye className="h-4 w-4" /></Button></Link><Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleOpenEdit(page)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(page.id, page.title)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                  </TableRow>
                ))}</TableBody></Table></div>
              ) : <div className="py-24 text-center italic text-slate-400">No pages found.</div>}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
          <div className="bg-slate-900 p-6 text-white shrink-0"><DialogHeader><DialogTitle className="text-white text-xl font-headline font-bold">Page Editor</DialogTitle></DialogHeader></div>
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Title</Label><Input required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
                <div className="space-y-2"><Label>Slug</Label><Input required value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} /></div>
              </div>
              <div className="space-y-2">
                <Label>Content (HTML Supported)</Label>
                <Textarea ref={textareaRef} required className="min-h-[400px] font-mono text-sm p-4 bg-slate-50" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-dashed">
                <div className="space-y-1"><Label className="font-bold">Publish Visibility</Label><p className="text-[10px] text-muted-foreground">Is this page live for everyone?</p></div>
                <Switch checked={formData.isPublished} onCheckedChange={(v) => setFormData({...formData, isPublished: v})} />
              </div>
            </div>
            <DialogFooter className="p-6 border-t bg-slate-50"><Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Discard</Button><Button type="submit" disabled={loading} className="font-black px-8 h-12 shadow-lg">{loading ? "Saving..." : "Save & Sync"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
