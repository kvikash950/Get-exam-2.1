
import { redirect } from 'next/navigation';

export default function CenterSupportRedirect() {
  redirect('/center/dashboard');
  return null;
}
