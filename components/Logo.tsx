import React from 'react';

export const CrmLogo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="45" className="fill-blue-600 dark:fill-blue-500" />
    <path d="M50 25V50L70 70" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="50" cy="50" r="10" className="fill-white" />
    <circle cx="50" cy="20" r="6" className="fill-white opacity-80" />
    <circle cx="80" cy="50" r="6" className="fill-white opacity-80" />
    <circle cx="20" cy="50" r="6" className="fill-white opacity-80" />
  </svg>
);