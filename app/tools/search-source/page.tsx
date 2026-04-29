import SearchSourceContent from './SearchSourceContent.simple';
import AppLayout from '@/components/AppLayout';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SearchSourcePage() {
  return (
    <AppLayout currentTool="search-source">
      <SearchSourceContent />
    </AppLayout>
  );
}
