import React from 'react';

const baseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true'
};

export function IconTerminal({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <rect x="2" y="4" width="20" height="16" rx="2.5" />
      <path d="M6 9h4" />
      <path d="M6 13h8" />
      <path d="M16 9h2" />
      <path d="M16 13h2" />
    </svg>
  );
}

export function IconBox({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

export function IconAlert({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function IconKardex({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 4 4 5-6" />
    </svg>
  );
}

export function IconReceipt({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

export function IconMonitor({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <rect x="5" y="2" width="14" height="20" rx="2.5" />
      <path d="M12 18h.01" />
    </svg>
  );
}

export function IconDesktop({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

export function IconLock({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function IconSearch({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function IconPlus({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconMinus({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconCheck({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconClose({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function IconLocation({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function IconCash({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

export function IconQr({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 19h2M19 14v2" />
    </svg>
  );
}

export function IconCard({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

export function IconBolt({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export function IconEye({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconPrinter({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

export function IconShare({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98" />
      <path d="m15.41 6.51-6.82 3.98" />
    </svg>
  );
}

export function IconCopy({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function IconShield({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function IconPill({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  );
}

export function IconRefresh({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

export function IconArrowUpRight({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

export function IconArrowDownRight({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} className={className} {...baseProps}>
      <path d="m7 7 10 10" />
      <path d="M17 7v10H7" />
    </svg>
  );
}
