import { redirect } from 'next/navigation';

export default function FeesPageRedirect() {
  redirect('/center/dashboard');
  return null;
}