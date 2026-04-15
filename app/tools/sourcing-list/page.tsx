import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SourcingListContent from './SourcingListContent';

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
    <div className="min-h-screen bg-gray-50">
      <SourcingListContent user={{ id: session.user.id, email: session.user.email }} />
    </div>
  );
}
