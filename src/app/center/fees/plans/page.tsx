import { redirect } from 'next/navigation';

export default function FeePlansRedirect() {
  redirect('/center/dashboard');
  return null;
}