import React from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import JobStatusBadge from './JobStatusBadge';
import { ArrowRight, Play } from 'lucide-react';

const JobTable = ({ jobs }) => {
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
                            <th>Start Time</th>
                            <th>Duration</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map((job) => {
                            const start = new Date(job.startTime);
                            const end = job.endTime ? new Date(job.endTime) : null;
                            const duration = end
                                ? formatDistanceToNow(start, { addSuffix: false })
                                : 'Running...';

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
                                    <td style={{ fontSize: '0.875rem', color: '#6b7280' }}>{duration}</td>
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
