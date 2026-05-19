'use client';

import { useState, useEffect } from 'react';
import { FileText, TrendingUp, Database, Globe } from 'lucide-react';
import { COUNTRIES } from '@/config/countries';

// ── Types ────────────────────────────────────────────────────────────────────

interface Stats {
    total: number;
    byType: { pdf: number; docx: number; xlsx: number; txt: number };
    byCountry: Record<string, number>;
    recentUploads: number;
    totalSizeMB: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const FILE_TYPES = ['pdf', 'docx', 'xlsx', 'txt'] as const;

const FILE_TYPE_META: Record<typeof FILE_TYPES[number], { label: string; color: string }> = {
    pdf:  { label: 'PDF',  color: '#E8401C' },
    docx: { label: 'DOCX', color: '#307c4c' },
    xlsx: { label: 'XLSX', color: '#0A7B4C' },
    txt:  { label: 'TXT',  color: '#94a3b8' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatStorage(mb: number): string {
    if (mb >= 1000) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-6 h-6 rounded-full bg-slate-100 animate-pulse mb-3" />
            <div className="h-8 w-14 bg-slate-100 rounded animate-pulse mb-2" />
            <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function IngestionStats({ refreshTrigger }: { refreshTrigger: number }) {
    const [stats, setStats]     = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/documents/stats');
                if (res.ok && !cancelled) {
                    setStats(await res.json());
                }
            } catch {
                // Stats are non-critical — fail silently
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchStats();
        return () => { cancelled = true; };
    }, [refreshTrigger]);

    // Derived values
    const countriesCovered = stats
        ? COUNTRIES.filter(c => (stats.byCountry[c.code] ?? 0) > 0).length
        : 0;

    const totalTyped = stats
        ? FILE_TYPES.reduce((sum, t) => sum + stats.byType[t], 0)
        : 0;

    return (
        <div className="flex flex-col gap-4">

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                ) : stats ? (
                    <>
                        {/* Total Documents */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
                            <FileText className="w-6 h-6 text-[#307c4c] mb-2" />
                            <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">
                                Total Documents
                            </p>
                        </div>

                        {/* Recent Uploads */}
                        <div className={`bg-white rounded-2xl shadow-sm border p-6 flex flex-col items-center justify-center text-center transition-all ${
                            stats.recentUploads > 0
                                ? 'border-[#307c4c]/20 outline outline-2 outline-offset-2 outline-[#307c4c]/20'
                                : 'border-slate-200'
                        }`}>
                            <TrendingUp className="w-6 h-6 text-[#307c4c] mb-2" />
                            <p className={`text-3xl font-bold ${stats.recentUploads > 0 ? 'text-[#307c4c]' : 'text-slate-800'}`}>
                                {stats.recentUploads}
                            </p>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">
                                Last 7 Days
                            </p>
                        </div>

                        {/* Storage Used */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
                            <Database className="w-6 h-6 text-[#307c4c] mb-2" />
                            <p className="text-3xl font-bold text-slate-800">
                                {formatStorage(stats.totalSizeMB)}
                            </p>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">
                                Storage Used
                            </p>
                        </div>

                        {/* Countries Covered */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
                            <Globe className="w-6 h-6 text-[#307c4c] mb-2" />
                            <p className="text-3xl font-bold text-slate-800">{countriesCovered}</p>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">
                                Countries Covered
                            </p>
                        </div>
                    </>
                ) : null}
            </div>

            {/* ── Breakdown card — only when data exists ── */}
            {!loading && stats && stats.total > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-5 animate-in fade-in duration-300">

                    {/* File type segmented bar */}
                    {totalTyped > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                File Types
                            </p>

                            {/* Segmented bar */}
                            <div className="h-2.5 w-full rounded-full overflow-hidden flex gap-0.5 mb-3">
                                {FILE_TYPES.map(type => {
                                    const count = stats.byType[type];
                                    if (count === 0) return null;
                                    const pct = (count / totalTyped) * 100;
                                    return (
                                        <div
                                            key={type}
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${pct}%`,
                                                backgroundColor: FILE_TYPE_META[type].color,
                                            }}
                                        />
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                                {FILE_TYPES.map(type => {
                                    const count = stats.byType[type];
                                    if (count === 0) return null;
                                    return (
                                        <span key={type} className="flex items-center gap-1.5 text-xs text-slate-600">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0 inline-block"
                                                style={{ backgroundColor: FILE_TYPE_META[type].color }}
                                            />
                                            {FILE_TYPE_META[type].label} ({count})
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Country badges */}
                    {countriesCovered > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                By Country
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {COUNTRIES
                                    .filter(c => (stats.byCountry[c.code] ?? 0) > 0)
                                    .map(c => (
                                        <span
                                            key={c.code}
                                            className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-medium border border-slate-200 text-slate-600"
                                        >
                                            {c.flag} {c.label} ({stats.byCountry[c.code]})
                                        </span>
                                    ))
                                }
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
