'use client';

import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

const COUNTRIES = [
  { code: 'global', label: '🌍 Global' },
  { code: 'algeria', label: '🇩🇿 Algeria' },
  { code: 'oman', label: '🇴🇲 Oman' },
  { code: 'ksa', label: '🇸🇦 KSA' },
  { code: 'egypt', label: '🇪🇬 Egypt' },
  { code: 'iraq', label: '🇮🇶 Iraq' },
  { code: 'kuwait', label: '🇰🇼 Kuwait' },
];

const MAX_SIZE = 16 * 1024 * 1024; // 16 MB
const ACCEPTED_TYPES = ['.pdf', '.docx', '.txt', '.xlsx', '.xls'];

function getFileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() || '';
}

function getFileIcon(ext: string): string {
  if (ext === 'pdf') return '📄';
  if (ext === 'docx') return '📝';
  if (ext === 'xlsx' || ext === 'xls') return '📊';
  return '📃';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Status = 'idle' | 'uploading' | 'success' | 'error' | 'warn';

export default function UploadForm() {
  const [sourceName, setSourceName] = useState('');
  const [country, setCountry] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (f: File) => {
    setFileError('');
    const ext = '.' + getFileExtension(f.name);
    if (!ACCEPTED_TYPES.includes(ext)) {
      setFileError(`Unsupported file type. Accepted: ${ACCEPTED_TYPES.join(', ')}`);
      return;
    }
    if (f.size > MAX_SIZE) {
      setFileError('File exceeds the 16 MB limit.');
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSetFile(dropped);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const fileExt = file ? getFileExtension(file.name) : '';
  const isExcel = fileExt === 'xlsx' || fileExt === 'xls';
  const isFormValid = !!sourceName.trim() && !!country && !!file && !fileError;

  const resetForm = () => {
    setSourceName('');
    setCountry('');
    setFile(null);
    setFileError('');
    setStatus('idle');
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || status === 'uploading') return;

    setStatus('uploading');
    setErrorMessage('');

    // ── Step 1: Store file in PostgreSQL ─────────────────────────────────────
    let documentId = '';
    let sourceLink = '';
    try {
      const step1 = new FormData();
      step1.append('file', file!);
      step1.append('source_name', sourceName.trim());
      step1.append('country', country);

      const res = await fetch('/api/upload', { method: 'POST', body: step1 });
      if (!res.ok) {
        const errText = await res.text().catch(() => `Server error ${res.status}`);
        throw new Error(errText || `Server returned ${res.status}`);
      }
      const data = await res.json();
      documentId = data.id;
      sourceLink = data.source_link;
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to store file. Please try again.');
      return;
    }

    // ── Step 2: Ingest into Pinecone via n8n ─────────────────────────────────
    const webhookUrl = process.env.NEXT_PUBLIC_INGESTION_WEBHOOK_URL;
    if (!webhookUrl) {
      // File is stored — warn rather than hard-fail.
      setStatus('warn');
      setErrorMessage('File stored but embedding failed. Please retry ingestion.');
      return;
    }

    try {
      const step2 = new FormData();
      step2.append('file', file!);
      step2.append('source_name', sourceName.trim());
      step2.append('country', country);
      step2.append('source_link', sourceLink);

      const res = await fetch(webhookUrl, { method: 'POST', body: step2 });
      if (!res.ok) {
        const errText = await res.text().catch(() => `Server error ${res.status}`);
        throw new Error(errText || `Server returned ${res.status}`);
      }
    } catch {
      setStatus('warn');
      setErrorMessage('File stored but embedding failed. Please retry ingestion.');
      return;
    }

    // ── Both steps succeeded ──────────────────────────────────────────────────
    setStatus('success');
    setTimeout(resetForm, 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      {/* Card Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800">Upload Document</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Ingest a new document into the HSE knowledge base
        </p>
      </div>

      {/* Success Banner */}
      {status === 'success' && (
        <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-[#307c4c]/10 border border-[#307c4c]/20 rounded-xl text-[#307c4c] text-sm font-medium animate-in fade-in duration-300">
          <span>✓</span>
          Document successfully ingested
        </div>
      )}

      {/* Warning Banner — file stored but embedding failed */}
      {status === 'warn' && (
        <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl animate-in fade-in duration-300">
          <p className="text-sm font-medium text-amber-700 mb-0.5">Partial success</p>
          <p className="text-xs text-amber-600">{errorMessage}</p>
          <button
            onClick={resetForm}
            className="mt-2 text-xs font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Banner */}
      {status === 'error' && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl animate-in fade-in duration-300">
          <p className="text-sm font-medium text-red-600 mb-0.5">Upload failed</p>
          <p className="text-xs text-red-500">{errorMessage}</p>
          <button
            onClick={resetForm}
            className="mt-2 text-xs font-semibold text-red-600 hover:text-red-800 underline underline-offset-2"
          >
            Dismiss & retry
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Source Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Source Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="e.g. HSE Incident Report Form - Algeria"
            className="w-full px-4 py-2.5 text-sm text-gray-700 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#307c4c]/30 focus:border-[#307c4c] outline-none transition-all duration-150 placeholder:text-gray-400"
          />
          <p className="mt-1.5 text-xs text-gray-400">
            This name will appear as the citation in chat responses
          </p>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Country / Region <span className="text-red-500">*</span>
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-[#307c4c] focus:border-[#307c4c] block w-full p-2.5 outline-none transition-all duration-150"
          >
            <option value="">Select a country / region</option>
            {COUNTRIES.map(({ code, label }) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            File <span className="text-red-500">*</span>
          </label>

          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-[#307c4c] bg-[#307c4c]/5 scale-[1.01]'
                  : 'border-slate-200 bg-slate-50 hover:border-[#307c4c]/50 hover:bg-[#307c4c]/5'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#307c4c]/10 flex items-center justify-center shrink-0">
                <Upload size={18} className="text-[#307c4c]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  {isDragging ? 'Drop your file here' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT, XLSX, XLS • Max 16 MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-2xl shrink-0">{getFileIcon(fileExt)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setFileError('');
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {fileError && (
            <p className="mt-1.5 text-xs text-red-500">{fileError}</p>
          )}

          {/* Excel notice */}
          {isExcel && (
            <div className="mt-2 flex gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-sm shrink-0">⚠️</span>
              <p className="text-xs text-amber-700 leading-relaxed">
                Excel files will be converted for AI embedding. The original file will be stored and
                available for download.
              </p>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isFormValid || status === 'uploading'}
          className={`w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            isFormValid && status !== 'uploading'
              ? 'bg-[#307c4c] text-white hover:bg-[#25603a] shadow-sm hover:shadow-md active:scale-[0.98]'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          {status === 'uploading' ? (
            <>
              <svg
                className="animate-spin h-4 w-4 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Storing & ingesting...
            </>
          ) : (
            <>
              <Upload size={16} />
              Upload & Ingest
            </>
          )}
        </button>
      </form>
    </div>
  );
}
