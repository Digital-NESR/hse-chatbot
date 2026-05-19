import type { Metadata } from 'next';
import UploadForm from '@/components/ingestion/UploadForm';
import DocumentLibrary from '@/components/ingestion/DocumentLibrary';

export const metadata: Metadata = {
    title: 'Data Ingestion | HSE Virtual Support Agent',
};

export default function AdminIngestionPage() {
    return (
        <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col gap-6">
                {/* Top — Upload Form */}
                <UploadForm />

                {/* Bottom — Document Library */}
                <DocumentLibrary />
            </div>
        </div>
    );
}
