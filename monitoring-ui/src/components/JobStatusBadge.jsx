import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const JobStatusBadge = ({ status }) => {
    const configs = {
        RUNNING: { className: 'badge-running', icon: Clock },
        SUCCESS: { className: 'badge-success', icon: CheckCircle },
        FAILED: { className: 'badge-failed', icon: XCircle },
        UNKNOWN: { className: 'badge-running', icon: AlertCircle },
    };

    const config = configs[status] || configs.UNKNOWN;
    const Icon = config.icon;

    return (
        <span className={`badge ${config.className}`}>
            <Icon size={14} />
            {status}
        </span>
    );
};

export default JobStatusBadge;
