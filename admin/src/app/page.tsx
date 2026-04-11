import { redirect } from 'next/navigation';

export default function RootPage() {
  // Simple server-side redirect to login
  redirect('/login');
}
