'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Check, Loader2 } from 'lucide-react';
import { COUNTRIES } from '@/config/countries';

const MAX_SIZE      = 16 * 1024 * 1024; // 16 MB
const ACCEPTED_EXTS = ['.pdf', '.docx', '.txt', '.xlsx', '.xls'];
const PROD_URL      = 'https://hsechatbot.nesr.com';

// ── Types ────────────────────────────────────────────────────────────────────

interface FileItem {
  id: string;
  file: File;
  sourceName: string;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  error?: string;
  warning?: string;
}

interface UploadSummary {
  success: number;
  failed: number;
  failedItems: { name: string; error: string }[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getExt(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function getFileIcon(ext: string): string {
  if (ext === 'pdf')                     return '📄';
  if (ext === 'docx')                    return '📝';
  if (ext === 'xlsx' || ext === 'xls')   return '📊';
  return '📃';
}

function formatSize(bytes: number): string {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "HSE_Incident-Report.pdf" → "HSE Incident Report" */
function cleanFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')       // strip extension
    .replace(/[_\-.]+/g, ' ')      // underscores/hyphens/dots → spaces
    .trim();
}

// ── Component ────────────────────────────────────────────────────────────────

export default function UploadForm({ onUploadComplete }: { onUploadComplete?: () => void } = {}) {
  const [fileItems, setFileItems]       = useState<FileItem[]>([]);
  const [country, setCountry]           = useState('');
  const [isDragging, setIsDragging]     = useState(false);
  const [phase, setPhase]               = useState<'idle' | 'uploading' | 'done'>('idle');
  const [progress, setProgress]         = useState({ current: 0, total: 0 });
  const [summary, setSummary]           = useState<UploadSummary | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss the all-success banner after 3 s
  useEffect(() => {
    if (summary && summary.failed === 0) {
      const t = setTimeout(() => setSummary(null), 3000);
      return () => clearTimeout(t);
    }
  }, [summary]);

  // ── File management ────────────────────────────────────────────────────────

  const appendFiles = (raw: File[]) => {
    const items: FileItem[] = raw.map(file => ({
      id: crypto.randomUUID(),
      file,
      sourceName: cleanFileName(file.name),
      status: 'pending',
    }));
    setFileItems(prev => [...prev, ...items]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (phase === 'uploading') return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length) appendFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) appendFiles(files);
    e.target.value = ''; // reset so the same file can be re-selected
  };

  const removeFile = (id: string) => {
    setFileItems(prev => prev.filter(f => f.id !== id));
  };

  const updateSourceName = (id: string, value: string) => {
    setFileItems(prev => prev.map(f => f.id === id ? { ...f, sourceName: value } : f));
  };

  const resetForm = (keepCountry = false) => {
    setFileItems([]);
    setSummary(null);
    setPhase('idle');
    setProgress({ current: 0, total: 0 });
    if (!keepCountry) setCountry('');
  };

  // ── Upload logic ───────────────────────────────────────────────────────────

  const handleUploadAll = async () => {
    if (phase === 'uploading' || !country || fileItems.length === 0) return;

    setPhase('uploading');
    setSummary(null);

    // 1. Validate every file up-front; mark invalid ones failed immediately
    const validated = fileItems.map((item): FileItem => {
      const ext = '.' + getExt(item.file.name);
      if (!ACCEPTED_EXTS.includes(ext)) {
        return { ...item, status: 'failed', error: 'File type not supported' };
      }
      if (item.file.size > MAX_SIZE) {
        return { ...item, status: 'failed', error: 'File exceeds 16 MB limit' };
      }
      return item;
    });

    setFileItems(validated);

    const toProcess = validated.filter(f => f.status === 'pending');
    setProgress({ current: 0, total: toProcess.length });

    let successCount = 0;
    const failedItems: { name: string; error: string }[] = [];

    // Carry forward pre-validation failures
    validated
      .filter(f => f.status === 'failed')
      .forEach(f => failedItems.push({ name: f.file.name, error: f.error! }));

    // 2. Process valid files sequentially
    for (let i = 0; i < toProcess.length; i++) {
      const item = toProcess[i];
      setProgress({ current: i + 1, total: toProcess.length });

      // Mark as uploading
      setFileItems(prev =>
        prev.map(f => f.id === item.id ? { ...f, status: 'uploading' } : f),
      );

      try {
        // Step A — store file in PostgreSQL
        const fd1 = new FormData();
        fd1.append('file', item.file);
        fd1.append('source_name', item.sourceName.trim() || item.file.name);
        fd1.append('country', country);

        const r1 = await fetch('/api/upload', { method: 'POST', body: fd1 });
        if (!r1.ok) {
          const msg = await r1.text().catch(() => `Server error ${r1.status}`);
          throw new Error(msg || `Server returned ${r1.status}`);
        }
        const { id } = await r1.json();
        const source_link = `${PROD_URL}/api/files/${id}`;

        // Step B — ingest into Pinecone via n8n webhook
        const webhookUrl = process.env.NEXT_PUBLIC_INGESTION_WEBHOOK_URL;
        let embeddingWarning: string | undefined;
        if (webhookUrl) {
          try {
            console.log('Calling n8n webhook:', webhookUrl);
            console.log('With source_link:', source_link);

            const fd2 = new FormData();
            fd2.append('file', item.file);
            fd2.append('source_name', item.sourceName.trim() || item.file.name);
            fd2.append('country', country);
            fd2.append('source_link', source_link);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const r2 = await fetch(webhookUrl, {
              method: 'POST',
              body: fd2,
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!r2.ok) {
              const msg = await r2.text().catch(() => `Webhook error ${r2.status}`);
              throw new Error(msg || `Webhook returned ${r2.status}`);
            }
          } catch {
            embeddingWarning =
              'File stored successfully but embedding failed. You can retry embedding from the document library.';
          }
        }

        setFileItems(prev =>
          prev.map(f =>
            f.id === item.id ? { ...f, status: 'success', warning: embeddingWarning } : f,
          ),
        );
        successCount++;
      } catch (err: any) {
        const errorMsg: string = err?.message ?? 'Upload failed';
        setFileItems(prev =>
          prev.map(f => f.id === item.id ? { ...f, status: 'failed', error: errorMsg } : f),
        );
        failedItems.push({ name: item.file.name, error: errorMsg });
      }
      // Continue to next file regardless of outcome
    }

    setSummary({ success: successCount, failed: failedItems.length, failedItems });
    setPhase('done');
    if (successCount > 0) onUploadComplete?.();
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const isUploading = phase === 'uploading';
  const isDone      = phase === 'done';
  const showStatus  = phase !== 'idle';
  const canUpload   = fileItems.length > 0 && !!country && !isUploading;
  const totalFiles  = fileItems.length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

      {/* Card Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800">Upload Documents</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Ingest one or more documents into the HSE knowledge base
        </p>
      </div>

      {/* ── Summary Banner ── */}
      {summary && isDone && (
        <div
          className={`mb-5 px-4 py-3 rounded-xl animate-in fade-in duration-300 ${
            summary.failed === 0
              ? 'bg-[#307c4c]/10 border border-[#307c4c]/20'
              : 'bg-amber-50 border border-amber-200'
          }`}
        >
          {summary.failed === 0 ? (
            <p className="text-sm font-medium text-[#307c4c]">
              ✅ All {summary.success}{' '}
              {summary.success === 1 ? 'document' : 'documents'} successfully ingested
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-amber-700 mb-1.5">
                ⚠️ {summary.success} of {summary.success + summary.failed}{' '}
                {summary.success + summary.failed === 1 ? 'document' : 'documents'} ingested
                successfully. {summary.failed} failed:
              </p>
              <ul className="space-y-0.5">
                {summary.failedItems.map((f, i) => (
                  <li key={i} className="text-xs text-amber-700">
                    <span className="font-medium">{f.name}</span>
                    {f.error && (
                      <span className="text-amber-600"> — {f.error}</span>
                    )}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setSummary(null)}
                className="mt-2.5 text-xs font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors duration-150"
              >
                Dismiss
              </button>
            </>
          )}
        </div>
      )}

      <div className="space-y-5">

        {/* ── Country / Region ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Country / Region <span className="text-red-500">*</span>
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={isUploading}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-[#307c4c] focus:border-[#307c4c] block w-full p-2.5 outline-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select a country / region</option>
            {COUNTRIES.map(({ code, flag, label }) => (
              <option key={code} value={code}>{flag} {label}</option>
            ))}
          </select>
          {totalFiles > 1 && (
            <p className="mt-1 text-xs text-gray-400">Applies to all files in this batch</p>
          )}
        </div>

        {/* ── Drop Zone ── */}
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); if (!isUploading) setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all duration-200 ${
            totalFiles > 0 ? 'py-4 px-6' : 'py-8 px-6'
          } ${
            isUploading
              ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50'
              : isDragging
                ? 'border-[#307c4c] bg-[#307c4c]/5 scale-[1.01] cursor-copy'
                : 'border-slate-200 bg-slate-50 hover:border-[#307c4c]/50 hover:bg-[#307c4c]/5 cursor-pointer'
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-[#307c4c]/10 flex items-center justify-center shrink-0">
            <Upload size={16} className="text-[#307c4c]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {isDragging
                ? 'Drop your files here'
                : totalFiles > 0
                  ? 'Drop more files or click to add'
                  : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              PDF, DOCX, TXT, XLSX, XLS • Max 16 MB each • Multiple files supported
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_EXTS.join(',')}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* ── File List ── */}
        {fileItems.length > 0 && (
          <div>
            {/* List header */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {totalFiles} {totalFiles === 1 ? 'File' : 'Files'} Selected
              </p>
              {!isUploading && !isDone && (
                <button
                  onClick={() => resetForm(true)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors duration-150"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Scrollable file rows */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-0.5">
              {fileItems.map((item) => {
                const ext     = getExt(item.file.name);
                const isExcel = ext === 'xlsx' || ext === 'xls';

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      item.status === 'success'
                        ? 'bg-[#307c4c]/5 border-[#307c4c]/20'
                        : item.status === 'failed'
                          ? 'bg-red-50 border-red-200'
                          : item.status === 'uploading'
                            ? 'bg-[#307c4c]/5 border-[#307c4c]/20'
                            : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {/* File type icon */}
                    <span className="text-xl shrink-0 mt-0.5 leading-none select-none">
                      {getFileIcon(ext)}
                    </span>

                    {/* Name + source name input + notices */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {item.file.name}
                        </p>
                        <span className="text-xs text-gray-400 shrink-0">
                          {formatSize(item.file.size)}
                        </span>
                      </div>

                      <input
                        type="text"
                        value={item.sourceName}
                        onChange={(e) => updateSourceName(item.id, e.target.value)}
                        placeholder="Source name for citations..."
                        disabled={isUploading || item.status === 'success'}
                        className="w-full px-3 py-1.5 text-xs text-gray-700 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#307c4c]/30 focus:border-[#307c4c] outline-none transition-all duration-150 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
                      />

                      {isExcel && (
                        <p className="mt-1.5 text-[11px] text-amber-600 leading-snug">
                          ⚠️ Will be converted for AI embedding. Original file preserved.
                        </p>
                      )}

                      {item.status === 'failed' && item.error && (
                        <p className="mt-1.5 text-xs text-red-500 leading-snug">
                          {item.error}
                        </p>
                      )}

                      {item.warning && (
                        <p className="mt-1.5 text-[11px] text-amber-600 leading-snug">
                          ⚠️ {item.warning}
                        </p>
                      )}
                    </div>

                    {/* Status indicator — only visible once upload phase begins */}
                    {showStatus && (
                      <div className="shrink-0 flex items-center justify-center w-5 mt-1">
                        {item.status === 'pending' && (
                          <div className="w-2 h-2 rounded-full bg-gray-300" />
                        )}
                        {item.status === 'uploading' && (
                          <Loader2 size={15} className="animate-spin text-[#307c4c]" />
                        )}
                        {item.status === 'success' && (
                          <Check size={15} className="text-[#307c4c]" />
                        )}
                        {item.status === 'failed' && (
                          <X size={15} className="text-red-500" />
                        )}
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={() => removeFile(item.id)}
                      disabled={isUploading}
                      aria-label={`Remove ${item.file.name}`}
                      className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Primary action / progress button ── */}
        {!isDone && (
          <button
            onClick={handleUploadAll}
            disabled={!canUpload}
            className={`w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              canUpload
                ? 'bg-[#307c4c] text-white hover:bg-[#25603a] shadow-sm hover:shadow-md active:scale-[0.98]'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin shrink-0" />
                Uploading {progress.current} of {progress.total}…
              </>
            ) : (
              <>
                <Upload size={16} />
                {totalFiles > 0
                  ? `Upload & Ingest All (${totalFiles} ${totalFiles === 1 ? 'file' : 'files'})`
                  : 'Upload & Ingest All'}
              </>
            )}
          </button>
        )}

        {/* ── Upload More button — shown after completion ── */}
        {isDone && (
          <button
            onClick={() => resetForm(true)}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
          >
            <Upload size={16} />
            Upload More Files
          </button>
        )}

      </div>
    </div>
  );
}
