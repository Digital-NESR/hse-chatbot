'use client';

import { useState, useMemo } from 'react';
import { Search, Download, Eye } from 'lucide-react';

// TODO: Replace mock data with a real fetch to:
//   GET process.env.NEXT_PUBLIC_API_BASE_URL/api/documents
// when that endpoint is implemented.
const MOCK_DOCUMENTS = [
  {
    id: '1',
    file_name: 'HSE Incident Report.pdf',
    file_type: 'pdf',
    source_name: 'HSE Incident Report Form',
    country: 'algeria',
    uploaded_at: '2026-05-01T10:00:00Z',
  },
  {
    id: '2',
    file_name: 'PPE Guidelines.docx',
    file_type: 'docx',
    source_name: 'PPE Requirements Global',
    country: 'global',
    uploaded_at: '2026-05-02T10:00:00Z',
  },
  {
    id: '3',
    file_name: 'Hand Carry Form.xlsx',
    file_type: 'xlsx',
    source_name: 'Hand Carry Pre-Approval',
    country: 'oman',
    uploaded_at: '2026-05-03T10:00:00Z',
  },
];

const COUNTRIES = [
  { code: 'global', label: '🌍 Global' },
  { code: 'algeria', label: '🇩🇿 Algeria' },
  { code: 'oman', label: '🇴🇲 Oman' },
  { code: 'ksa', label: '🇸🇦 KSA' },
  { code: 'egypt', label: '🇪🇬 Egypt' },
  { code: 'iraq', label: '🇮🇶 Iraq' },
  { code: 'kuwait', label: '🇰🇼 Kuwait' },
];

const FILE_TYPES = ['PDF', 'DOCX', 'XLSX', 'TXT'];

function getCountryLabel(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.label ?? code;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getFileIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'pdf':
      return '📄';
    case 'docx':
      return '📝';
    case 'xlsx':
    case 'xls':
      return '📊';
    case 'txt':
      return '📃';
    default:
      return '📄';
  }
}

const canView = (type: string) => ['pdf', 'docx'].includes(type.toLowerCase());

export default function DocumentLibrary() {
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_DOCUMENTS.filter((doc) => {
      const matchSearch =
        !q ||
        doc.source_name.toLowerCase().includes(q) ||
        doc.file_name.toLowerCase().includes(q);
      const matchCountry = !countryFilter || doc.country === countryFilter;
      const matchType = !typeFilter || doc.file_type.toLowerCase() === typeFilter.toLowerCase();
      return matchSearch && matchCountry && matchType;
    });
  }, [search, countryFilter, typeFilter]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="p-6 pb-4 border-b border-slate-100 shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">Document Library</h2>
        <p className="text-sm text-gray-500 mt-0.5">All ingested documents</p>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 shrink-0">
        {/* Search */}
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

        {/* Country Filter */}
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-[#307c4c] focus:border-[#307c4c] block p-2 outline-none min-w-[140px]"
        >
          <option value="">All Countries</option>
          {COUNTRIES.map(({ code, label }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-[#307c4c] focus:border-[#307c4c] block p-2 outline-none min-w-[110px]"
        >
          <option value="">All Types</option>
          {FILE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Table or Empty State */}
      {filtered.length > 0 ? (
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
              {filtered.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-[#307c4c]/5 transition-colors group"
                >
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
                      <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-[#307c4c] hover:bg-[#307c4c]/5 rounded-lg border border-slate-200 hover:border-[#307c4c]/20 transition-all duration-150 whitespace-nowrap">
                        <Download size={12} />
                        Download
                      </button>

                      {canView(doc.file_type) && (
                        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-[#307c4c] hover:bg-[#307c4c]/5 rounded-lg border border-slate-200 hover:border-[#307c4c]/20 transition-all duration-150 whitespace-nowrap">
                          <Eye size={12} />
                          View
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty State */
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
      )}
    </div>
  );
}
