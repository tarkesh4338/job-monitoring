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
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('ALL');
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [showFilters, setShowFilters] = useState(false);

    const fetchJobs = async () => {
        try {
            const response = await axios.get(API_URL);
            const sorted = response.data.sort((a, b) => b.id - a.id);
            setJobs(sorted);
            setLastUpdated(new Date());
            setError(null);
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
    }, []);

    const stats = useMemo(() => ({
        ALL: jobs.length,
        RUNNING: jobs.filter(j => j.status === 'RUNNING').length,
        SUCCESS: jobs.filter(j => j.status === 'SUCCESS').length,
        FAILED: jobs.filter(j => j.status === 'FAILED').length,
    }), [jobs]);

    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            if (activeTab !== 'ALL' && job.status !== activeTab) return false;
            if (filters.jobName && !job.jobName?.toLowerCase().includes(filters.jobName.toLowerCase())) return false;
            if (filters.runId && !job.runId?.toLowerCase().includes(filters.runId.toLowerCase())) return false;
            if (filters.dateFrom) {
                const from = new Date(filters.dateFrom);
                if (new Date(job.startTime) < from) return false;
            }
            if (filters.dateTo) {
                const to = new Date(filters.dateTo);
                to.setHours(23, 59, 59, 999);
                if (new Date(job.startTime) > to) return false;
            }
            return true;
        });
    }, [jobs, activeTab, filters]);

    const hasActiveFilters = Object.values(filters).some(v => v !== '');

    const clearFilters = () => setFilters(DEFAULT_FILTERS);

    const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

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
                        <button onClick={fetchJobs} style={{ padding: '8px', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Refresh now">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ paddingBottom: '2rem', paddingTop: '2rem' }}>
                {/* Stats Grid */}
                <div className="stats-grid">
                    <StatCard label="Total Jobs" value={stats.ALL} icon={Activity} color="#2563eb" bg="#eff6ff" />
                    <StatCard label="Running" value={stats.RUNNING} icon={Activity} color="#ca8a04" bg="#fefce8" />
                    <StatCard label="Successful" value={stats.SUCCESS} icon={CheckCircle} color="#16a34a" bg="#f0fdf4" />
                    <StatCard label="Failed" value={stats.FAILED} icon={XCircle} color="#dc2626" bg="#fef2f2" />
                </div>

                {/* Status Tabs */}
                <div className="tabs-bar">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.key}
                            className={`tab-btn ${activeTab === tab.key ? 'tab-btn--active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                            <span className={`tab-count ${activeTab === tab.key ? 'tab-count--active' : ''}`}>
                                {stats[tab.key]}
                            </span>
                        </button>
                    ))}

                    {/* Filter toggle button — right side */}
                    <button
                        className={`filter-toggle-btn ${showFilters || hasActiveFilters ? 'filter-toggle-btn--active' : ''}`}
                        onClick={() => setShowFilters(v => !v)}
                        style={{ marginLeft: 'auto' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                        Filters
                        {hasActiveFilters && <span className="filter-active-dot" />}
                    </button>
                </div>

                {/* Filter Bar */}
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
                                type="date"
                                value={filters.dateFrom}
                                onChange={v => updateFilter('dateFrom', v)}
                            />
                            <FilterInput
                                label="To"
                                type="date"
                                value={filters.dateTo}
                                onChange={v => updateFilter('dateTo', v)}
                            />
                            {hasActiveFilters && (
                                <button className="clear-filters-btn" onClick={clearFilters}>
                                    ✕ Clear
                                </button>
                            )}
                        </div>
                        {hasActiveFilters && (
                            <p className="filter-result-count">
                                Showing <strong>{filteredJobs.length}</strong> of <strong>{jobs.length}</strong> jobs
                            </p>
                        )}
                    </div>
                )}

                {/* Table */}
                <div style={{ marginTop: '1rem' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading…</div>
                    ) : (
                        <JobTable jobs={filteredJobs} />
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
