import { redirect } from 'next/navigation';

export default function FeeStudentsRedirect() {
  redirect('/center/dashboard');
  return null;
}