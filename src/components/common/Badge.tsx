import React from 'react';
import { TaskStatus, PropertyStatus, PackageType, CustomizationStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs font-medium' 
    : 'px-2.5 py-1 text-xs font-semibold';

  const variantClasses = {
    default: 'bg-slate-100 text-slate-800 border border-slate-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200',
    info: 'bg-sky-50 text-sky-800 border border-sky-200',
    purple: 'bg-purple-50 text-purple-800 border border-purple-200'
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md whitespace-nowrap shrink-0 tracking-tight ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};

export const TaskStatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  switch (status) {
    case 'Completed':
      return <Badge variant="success">Completed</Badge>;
    case 'In Progress':
      return <Badge variant="info">In Progress</Badge>;
    case 'Awaiting Approval':
      return <Badge variant="warning">Awaiting Approval</Badge>;
    case 'Blocked':
      return <Badge variant="danger">Blocked</Badge>;
    case 'Not Started':
    default:
      return <Badge variant="neutral">Not Started</Badge>;
  }
};

export const PropertyStatusBadge: React.FC<{ status: PropertyStatus }> = ({ status }) => {
  switch (status) {
    case 'Handed Over':
      return <Badge variant="success">Handed Over</Badge>;
    case 'Ready for Handover':
      return <Badge variant="success">Ready for Handover</Badge>;
    case 'Quality Inspection':
      return <Badge variant="purple">Quality Inspection</Badge>;
    case 'Finishing':
      return <Badge variant="info">Finishing</Badge>;
    case 'Services':
      return <Badge variant="info">Services</Badge>;
    case 'Masonry':
      return <Badge variant="warning">Masonry</Badge>;
    case 'Structure':
      return <Badge variant="warning">Structure</Badge>;
    case 'Foundation':
      return <Badge variant="warning">Foundation</Badge>;
    case 'Planning':
    default:
      return <Badge variant="neutral">Planning</Badge>;
  }
};

export const PackageBadge: React.FC<{ packageType: PackageType }> = ({ packageType }) => {
  if (packageType.includes('Package A')) {
    return <Badge variant="neutral">Package A: Structure Only</Badge>;
  }
  if (packageType.includes('Package B')) {
    return <Badge variant="info">Package B: Semi-Finished</Badge>;
  }
  if (packageType.includes('Package C')) {
    return <Badge variant="success">Package C: Fully Finished</Badge>;
  }
  return <Badge variant="purple">Package D: Custom Package</Badge>;
};

export const CustomizationStatusBadge: React.FC<{ status: CustomizationStatus }> = ({ status }) => {
  switch (status) {
    case 'Approved':
      return <Badge variant="success">Approved</Badge>;
    case 'Awaiting Customer Approval':
      return <Badge variant="warning">Awaiting Customer Approval</Badge>;
    case 'Under Review':
      return <Badge variant="info">Under Review</Badge>;
    case 'Submitted':
      return <Badge variant="neutral">Submitted</Badge>;
    case 'Completed':
      return <Badge variant="success">Implemented</Badge>;
    case 'Rejected':
      return <Badge variant="danger">Rejected</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};
