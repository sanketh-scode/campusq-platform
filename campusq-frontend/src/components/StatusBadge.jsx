import React from 'react';

const STATUS_CLASS = {
  PENDING: 'badge-warning',
  PREPARING: 'badge-info',
  READY: 'badge-primary',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-danger',
  APPROVED: 'badge-success',
  REJECTED: 'badge-danger',
};

export default function StatusBadge({ status }) {
  const cls = STATUS_CLASS[status] || 'badge-muted';
  return <span className={`badge ${cls}`}>{status}</span>;
}
