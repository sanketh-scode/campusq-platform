import React from 'react';

const STATUS_CLASS = {
  PENDING: 'badge-warning',
  AWAITING_PAYMENT: 'badge-info',
  PREPARING: 'badge-info',
  READY: 'badge-primary',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-danger',
  APPROVED: 'badge-success',
  REJECTED: 'badge-danger',
  OPEN: 'badge-warning',
  RESOLVED: 'badge-success',
  DISMISSED: 'badge-muted',
};

export default function StatusBadge({ status }) {
  const cls = STATUS_CLASS[status] || 'badge-muted';
  return <span className={`badge ${cls}`}>{String(status || '').replace('_', ' ')}</span>;
}
