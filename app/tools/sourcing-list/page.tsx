import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SourcingListContent from './SourcingListContent';
import AppLayout from '@/components/AppLayout';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SourcingListPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?redirect=/tools/sourcing-list');
  }

  return (
    <AppLayout currentTool="sourcing-history">
      <SourcingListContent user={{ id: session.user.id, email: session.user.email }} />
    </AppLayout>
  );
}
