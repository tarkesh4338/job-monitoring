import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import JobTable from './JobTable';
import { Activity, CheckCircle, XCircle, RefreshCw, Server } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/jobs';
const RELOAD_INTERVAL = parseInt(import.meta.env.VITE_RELOAD_INTERVAL || '60000', 10);

const STATUS_TABS = [
    { key: 'ALL', label: 'All' },
    { key: 'RUNNING', label: 'Running' },
    { key: 'SUCCESS', label: 'Success' },
    { key: 'FAILED', label: 'Failed' },
];

const DEFAULT_FILTERS = { jobName: '', runId: '', dateFrom: '', dateTo: '' };

const Dashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [stats, setStats] = useState({ ALL: 0, RUNNING: 0, SUCCESS: 0, FAILED: 0 });
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('ALL');
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
    const [showFilters, setShowFilters] = useState(false);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/stats`);
            setStats(response.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const fetchJobs = async (pageToFetch = page, statusToFetch = activeTab, filtersToUse = appliedFilters) => {
        setLoading(true);
        try {
            const params = {
                page: pageToFetch,
                size: 10,
                sort: 'id,desc'
            };

            if (statusToFetch !== 'ALL') params.status = statusToFetch;
            if (filtersToUse.jobName) params.jobName = filtersToUse.jobName;
            if (filtersToUse.runId) params.runId = filtersToUse.runId;
            if (filtersToUse.dateFrom) params.startTimeFrom = filtersToUse.dateFrom;
            if (filtersToUse.dateTo) params.startTimeTo = filtersToUse.dateTo;

            const response = await axios.get(API_URL, { params });
            setJobs(response.data.content);
            setTotalPages(response.data.totalPages);
            setTotalElements(response.data.totalElements);
            setLastUpdated(new Date());
            setError(null);
            fetchStats();
        } catch (err) {
            console.error('Error fetching jobs:', err);
            setError('Failed to connect to backend.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
        const interval = setInterval(fetchJobs, RELOAD_INTERVAL);
        return () => clearInterval(interval);
    }, [page, activeTab, appliedFilters]);

    const handleApplyFilters = () => {
        setAppliedFilters(filters);
        setPage(0);
    };

    const handleClearFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setAppliedFilters(DEFAULT_FILTERS);
        setPage(0);
    };

    const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

    const hasAppliedFilters = Object.values(appliedFilters).some(v => v !== '');

    return (
        <div className="dashboard-container">
            <header>
                <div className="container header-content">
                    <div className="logo-area">
                        <div className="logo-icon"><Server size={20} /></div>
                        <span>Job Monitor</span>
                    </div>
                    <div className="flex items-center gap-4 text-secondary">
                        {error ? (
                            <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>⚠ {error}</span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <span style={{ display: 'flex', position: 'relative', width: '10px', height: '10px' }}>
                                    <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#4ade80', opacity: 0.75, animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
                                    <span style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', background: '#22c55e' }}></span>
                                </span>
                                Live · every {RELOAD_INTERVAL / 1000}s
                            </span>
                        )}
                        <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
                        <button onClick={() => fetchJobs()} style={{ padding: '8px', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Refresh now">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ paddingBottom: '2rem', paddingTop: '2rem' }}>
                <div className="stats-grid">
                    <StatCard label="Total Jobs" value={stats.ALL} icon={Activity} color="#2563eb" bg="#eff6ff" />
                    <StatCard label="Running" value={stats.RUNNING} icon={Activity} color="#ca8a04" bg="#fefce8" />
                    <StatCard label="Successful" value={stats.SUCCESS} icon={CheckCircle} color="#16a34a" bg="#f0fdf4" />
                    <StatCard label="Failed" value={stats.FAILED} icon={XCircle} color="#dc2626" bg="#fef2f2" />
                </div>

                <div className="tabs-bar">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.key}
                            className={`tab-btn ${activeTab === tab.key ? 'tab-btn--active' : ''}`}
                            onClick={() => {
                                setActiveTab(tab.key);
                                setPage(0);
                            }}
                        >
                            {tab.label}
                            <span className={`tab-count ${activeTab === tab.key ? 'tab-count--active' : ''}`}>
                                {stats[tab.key]}
                            </span>
                        </button>
                    ))}

                    <button
                        className={`filter-toggle-btn ${showFilters || hasAppliedFilters ? 'filter-toggle-btn--active' : ''}`}
                        onClick={() => setShowFilters(v => !v)}
                        style={{ marginLeft: 'auto' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                        Filters
                        {hasAppliedFilters && <span className="filter-active-dot" />}
                    </button>
                </div>

                {showFilters && (
                    <div className="filter-bar">
                        <div className="filter-bar-inner">
                            <FilterInput
                                label="Job Name"
                                placeholder="Search job name…"
                                value={filters.jobName}
                                onChange={v => updateFilter('jobName', v)}
                            />
                            <FilterInput
                                label="Run ID"
                                placeholder="Search run ID…"
                                value={filters.runId}
                                onChange={v => updateFilter('runId', v)}
                            />
                            <FilterInput
                                label="From"
                                type="datetime-local"
                                value={filters.dateFrom}
                                onChange={v => updateFilter('dateFrom', v)}
                            />
                            <FilterInput
                                label="To"
                                type="datetime-local"
                                value={filters.dateTo}
                                onChange={v => updateFilter('dateTo', v)}
                            />
                            <div className="filter-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', paddingBottom: '2px' }}>
                                <button className="apply-filters-btn" onClick={handleApplyFilters} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: '500' }}>
                                    Apply
                                </button>
                                {hasAppliedFilters && (
                                    <button className="clear-filters-btn" onClick={handleClearFilters}>
                                        ✕ Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '1rem' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading…</div>
                    ) : (
                        <>
                            <JobTable jobs={jobs} />

                            {/* Pagination */}
                            <div className="pagination-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem 0' }}>
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage(p => p - 1)}
                                    style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'white', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.5 : 1 }}
                                >
                                    Previous
                                </button>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Page <strong>{page + 1}</strong> of <strong>{totalPages || 1}</strong>
                                    <span style={{ marginLeft: '1rem' }}>({totalElements} total records)</span>
                                </span>
                                <button
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(p => p + 1)}
                                    style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: 'white', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.5 : 1 }}
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <style>{`
                @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
                .text-secondary { color: var(--text-secondary); font-size: 0.875rem; }
            `}</style>
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, color, bg }) => (
    <div className="stat-card">
        <div>
            <p className="stat-label">{label}</p>
            <p className="stat-value">{value}</p>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: bg, display: 'flex' }}>
            <Icon size={24} color={color} />
        </div>
    </div>
);

const FilterInput = ({ label, placeholder, type = 'text', value, onChange }) => (
    <div className="filter-input-group">
        <label className="filter-label">{label}</label>
        <input
            type={type}
            className="filter-input"
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    </div>
);

export default Dashboard;
