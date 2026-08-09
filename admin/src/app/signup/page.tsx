import { redirect } from 'next/navigation';

// Admin accounts are provisioned directly — self-signup is disabled.
export default function SignupPage() {
  redirect('/login');
}
