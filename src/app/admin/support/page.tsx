
import { redirect } from 'next/navigation';

export default function AdminSupportRedirect() {
  redirect('/admin/dashboard');
  return null;
}
