'use client';

import { useState } from 'react';
import IngestionStats from './IngestionStats';
import UploadForm from './UploadForm';
import DocumentLibrary from './DocumentLibrary';

export default function IngestionPageClient() {
    // Incrementing this triggers re-fetch in both IngestionStats and DocumentLibrary
    const [refreshKey, setRefreshKey] = useState(0);

    const handleUploadComplete = () => {
        setRefreshKey(k => k + 1);
    };

    return (
        <div className="flex flex-col gap-6">
            <IngestionStats refreshTrigger={refreshKey} />
            <UploadForm onUploadComplete={handleUploadComplete} />
            <DocumentLibrary refreshTrigger={refreshKey} />
        </div>
    );
}
