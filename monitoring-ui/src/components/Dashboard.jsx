import React, { useEffect, useState } from 'react';
import axios from 'axios';
import JobTable from './JobTable';
import { Activity, CheckCircle, XCircle, RefreshCw, Server } from 'lucide-react';

// Read from Vite env vars (set in .env or Vercel environment variables)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/jobs';
const RELOAD_INTERVAL = parseInt(import.meta.env.VITE_RELOAD_INTERVAL || '60000', 10);

const Dashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [error, setError] = useState(null);

    const fetchJobs = async () => {
        try {
            const response = await axios.get(API_URL);
            // Sort by ID desc (newest first)
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

    const stats = {
        total: jobs.length,
        success: jobs.filter(j => j.status === 'SUCCESS').length,
        failed: jobs.filter(j => j.status === 'FAILED').length,
        running: jobs.filter(j => j.status === 'RUNNING').length,
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header>
                <div className="container header-content">
                    <div className="logo-area">
                        <div className="logo-icon">
                            <Server size={20} />
                        </div>
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
                        <button
                            onClick={fetchJobs}
                            style={{ padding: '8px', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer' }}
                            title="Refresh now"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ paddingBottom: '2rem', paddingTop: '2rem' }}>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <StatCard label="Total Jobs" value={stats.total} icon={Activity} color="#2563eb" bg="#eff6ff" />
                    <StatCard label="Running" value={stats.running} icon={Activity} color="#ca8a04" bg="#fefce8" />
                    <StatCard label="Successful" value={stats.success} icon={CheckCircle} color="#16a34a" bg="#f0fdf4" />
                    <StatCard label="Failed" value={stats.failed} icon={XCircle} color="#dc2626" bg="#fef2f2" />
                </div>

                {/* Content */}
                <div>
                    <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recent Executions</h2>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            Loading...
                        </div>
                    ) : (
                        <JobTable jobs={jobs} />
                    )}
                </div>

            </main>
            <style>{`
        @keyframes ping {
            75%, 100% { transform: scale(2); opacity: 0; }
        }
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

export default Dashboard;
