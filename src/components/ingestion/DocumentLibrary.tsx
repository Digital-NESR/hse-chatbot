'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Download, Eye, RefreshCw } from 'lucide-react';

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  source_name: string;
  country: string;
  file_size: number | null;
  uploaded_at: string;
}

const COUNTRIES = [
  { code: 'global',  label: '🌍 Global'  },
  { code: 'algeria', label: '🇩🇿 Algeria' },
  { code: 'oman',    label: '🇴🇲 Oman'    },
  { code: 'ksa',     label: '🇸🇦 KSA'     },
  { code: 'egypt',   label: '🇪🇬 Egypt'   },
  { code: 'iraq',    label: '🇮🇶 Iraq'    },
  { code: 'kuwait',  label: '🇰🇼 Kuwait'  },
];

const FILE_TYPES = ['PDF', 'DOCX', 'XLSX', 'TXT'];

function getCountryLabel(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.label ?? code;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function getFileIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'pdf':               return '📄';
    case 'docx':              return '📝';
    case 'xlsx': case 'xls': return '📊';
    case 'txt':               return '📃';
    default:                  return '📄';
  }
}

const canView = (type: string) => ['pdf', 'docx'].includes(type.toLowerCase());

function handleView(id: string) {
  window.open(`/api/files/${id}`, '_blank');
}

function handleDownload(id: string, fileName: string) {
  const a = document.createElement('a');
  a.href = `/api/files/${id}`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      <td className="p-4 pl-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-slate-100 animate-pulse shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3 w-36 bg-slate-100 rounded animate-pulse" />
            <div className="h-2.5 w-24 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </td>
      <td className="p-4 hidden sm:table-cell">
        <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
      </td>
      <td className="p-4">
        <div className="h-5 w-12 bg-slate-100 rounded-md animate-pulse" />
      </td>
      <td className="p-4 hidden md:table-cell">
        <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
      </td>
      <td className="p-4 pr-6">
        <div className="flex justify-end gap-2">
          <div className="h-6 w-20 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-6 w-14 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </td>
    </tr>
  );
}

export default function DocumentLibrary() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const [search,        setSearch]        = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [typeFilter,    setTypeFilter]    = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/documents');
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return documents.filter((doc) => {
      const matchSearch =
        !q ||
        doc.source_name.toLowerCase().includes(q) ||
        doc.file_name.toLowerCase().includes(q);
      const matchCountry = !countryFilter || doc.country === countryFilter;
      const matchType    = !typeFilter    || doc.file_type.toLowerCase() === typeFilter.toLowerCase();
      return matchSearch && matchCountry && matchType;
    });
  }, [documents, search, countryFilter, typeFilter]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="p-6 pb-4 border-b border-slate-100 shrink-0 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Document Library</h2>
          <p className="text-sm text-gray-500 mt-0.5">All ingested documents</p>
        </div>
        {!loading && (
          <button
            onClick={fetchDocuments}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[#307c4c] hover:bg-[#307c4c]/5 transition-all duration-150 shrink-0 mt-0.5"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#307c4c]/30 focus:border-[#307c4c] outline-none transition-all duration-150 text-gray-700 placeholder:text-gray-400"
          />
        </div>

        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-[#307c4c] focus:border-[#307c4c] block p-2 outline-none min-w-[140px]"
        >
          <option value="">All Countries</option>
          {COUNTRIES.map(({ code, label }) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-[#307c4c] focus:border-[#307c4c] block p-2 outline-none min-w-[110px]"
        >
          <option value="">All Types</option>
          {FILE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="m-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchDocuments}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 whitespace-nowrap"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600 font-medium">
                <th className="p-4 pl-6 font-medium">File Name</th>
                <th className="p-4 font-medium hidden sm:table-cell">Country</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium hidden md:table-cell">Uploaded</th>
                <th className="p-4 pr-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                // Loading skeleton — 4 placeholder rows
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length > 0 ? (
                filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#307c4c]/5 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg shrink-0">{getFileIcon(doc.file_type)}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate max-w-[160px] xl:max-w-[220px]">
                            {doc.file_name}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[160px] xl:max-w-[220px]">
                            {doc.source_name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-sm text-gray-600 hidden sm:table-cell whitespace-nowrap">
                      {getCountryLabel(doc.country)}
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-medium border border-slate-200 text-slate-600">
                        {doc.file_type.toUpperCase()}
                      </span>
                    </td>

                    <td className="p-4 text-sm text-gray-500 hidden md:table-cell whitespace-nowrap">
                      {formatDate(doc.uploaded_at)}
                    </td>

                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(doc.id, doc.file_name)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-[#307c4c] hover:bg-[#307c4c]/5 rounded-lg border border-slate-200 hover:border-[#307c4c]/20 transition-all duration-150 whitespace-nowrap"
                        >
                          <Download size={12} />
                          Download
                        </button>

                        {canView(doc.file_type) && (
                          <button
                            onClick={() => handleView(doc.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-[#307c4c] hover:bg-[#307c4c]/5 rounded-lg border border-slate-200 hover:border-[#307c4c]/20 transition-all duration-150 whitespace-nowrap"
                          >
                            <Eye size={12} />
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                // Empty state — spans all 5 columns
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-500">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                        <span className="text-2xl">📂</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">No documents found</p>
                      <p className="text-xs text-gray-400">
                        {search || countryFilter || typeFilter
                          ? 'Try adjusting your filters'
                          : 'No documents ingested yet'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
