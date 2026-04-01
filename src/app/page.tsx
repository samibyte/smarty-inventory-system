import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (token) {
    const user = await verifyToken(token);
    if (user) redirect('/dashboard');
  }
  redirect('/login');
}
