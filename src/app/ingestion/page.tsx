import UploadForm from '@/components/ingestion/UploadForm';
import DocumentLibrary from '@/components/ingestion/DocumentLibrary';

export const metadata = {
  title: 'Data Ingestion | HSE AI',
};

export default function IngestionPage() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 items-start">
        {/* Left — Upload Form */}
        <UploadForm />

        {/* Right — Document Library */}
        <DocumentLibrary />
      </div>
    </div>
  );
}
