import type { Metadata } from 'next';
import IngestionPageClient from '@/components/ingestion/IngestionPageClient';

export const metadata: Metadata = {
    title: 'Data Ingestion | HSE Virtual Support Agent',
};

export default function AdminIngestionPage() {
    return (
        <div className="max-w-[1400px] mx-auto">
            <IngestionPageClient />
        </div>
    );
}
