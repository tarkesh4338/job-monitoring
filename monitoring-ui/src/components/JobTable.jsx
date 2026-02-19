import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import JobStatusBadge from './JobStatusBadge';
import { ArrowRight, Play, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Formats the elapsed duration between two dates into a human-readable string.
 * e.g. "2m 35s", "45s", "1h 3m"
 */
const formatDuration = (startDate, endDate) => {
    const ms = endDate - startDate;
    if (ms < 0) return '—';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
};

const JobTable = ({ jobs }) => {
    const [sortConfig, setSortConfig] = useState({ key: 'startTime', direction: 'desc' });

    const sortedJobs = useMemo(() => {
        let sortableJobs = [...jobs];
        if (sortConfig.key) {
            sortableJobs.sort((a, b) => {
                const aVal = a[sortConfig.key] ? new Date(a[sortConfig.key]) : new Date(0);
                const bVal = b[sortConfig.key] ? new Date(b[sortConfig.key]) : new Date(0);
                if (aVal < bVal) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aVal > bVal) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableJobs;
    }, [jobs, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ChevronDown size={14} style={{ marginLeft: '4px', opacity: 0.3 }} />;
        return sortConfig.direction === 'asc'
            ? <ChevronUp size={14} style={{ marginLeft: '4px', color: 'var(--primary)' }} />
            : <ChevronDown size={14} style={{ marginLeft: '4px', color: 'var(--primary)' }} />;
    };

    if (!jobs || jobs.length === 0) {
        return (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ background: '#f9fafb', width: '4rem', height: '4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                    <Play size={24} color="#9ca3af" />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 500, margin: '0 0 0.25rem 0' }}>No jobs found</h3>
                <p style={{ color: '#6b7280', margin: 0 }}>Start a job to see it listed here.</p>
            </div>
        );
    }

    return (
        <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Job Name</th>
                            <th>Run ID</th>
                            <th onClick={() => requestSort('startTime')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                Start Time <SortIcon columnKey="startTime" />
                            </th>
                            <th onClick={() => requestSort('endTime')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                                End Time <SortIcon columnKey="endTime" />
                            </th>
                            <th>Time Taken</th>
                            <th>Error Message</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedJobs.map((job) => {
                            const start = new Date(job.startTime);
                            const end = job.endTime ? new Date(job.endTime) : null;
                            const timeTaken = end
                                ? formatDuration(start, end)
                                : job.status === 'RUNNING'
                                    ? formatDuration(start, new Date()) + ' (running)'
                                    : '—';

                            return (
                                <tr key={job.id}>
                                    <td>
                                        <JobStatusBadge status={job.status} />
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{job.jobName}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6b7280' }}>{job.runId}</td>
                                    <td style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        {format(start, 'MMM d, HH:mm:ss')}
                                    </td>
                                    <td style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        {end ? format(end, 'MMM d, HH:mm:ss') : (
                                            <span style={{ color: '#ca8a04', fontStyle: 'italic' }}>In progress…</span>
                                        )}
                                    </td>
                                    <td style={{ fontSize: '0.875rem', color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>
                                        {timeTaken}
                                    </td>
                                    <td style={{ fontSize: '0.875rem', color: '#dc2626', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={job.errorMessage}>
                                        {job.status === 'FAILED' ? (job.errorMessage || '—') : ''}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', marginLeft: 'auto' }}>
                                            <ArrowRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default JobTable;
