import React from 'react';

/**
 * VectorStream Systems Logo Component
 * © 2025 VectorStream Systems - Patent Pending
 * All Rights Reserved
 */
const VectorStreamLogo = ({ className = "h-8 w-8", textClassName = "text-xl font-bold" }) => {
  return (
    <div className="flex items-center gap-3">
      {/* Logo SVG */}
      <svg 
        className={className} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer circle */}
        <circle cx="50" cy="50" r="48" fill="#1e40af" stroke="#3b82f6" strokeWidth="2"/>
        
        {/* Central node */}
        <circle cx="50" cy="25" r="4" fill="#ffffff"/>
        
        {/* Streaming arrows - top */}
        <path d="M35 15 L45 20 L35 25" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M65 15 L55 20 L65 25" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        
        {/* Streaming arrows - middle left */}
        <path d="M15 35 L20 45 L25 35" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15 65 L20 55 L25 65" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        
        {/* Streaming arrows - middle right */}
        <path d="M85 35 L80 45 L75 35" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M85 65 L80 55 L75 65" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        
        {/* Central tree/flow structure */}
        <path d="M50 25 L50 45" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
        <path d="M50 45 L35 60" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M50 45 L65 60" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M50 45 L35 30" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M50 45 L65 30" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
        
        {/* Wave pattern at bottom */}
        <path d="M20 75 Q30 70 40 75 Q50 80 60 75 Q70 70 80 75" stroke="#ffffff" strokeWidth="2" fill="none"/>
        <path d="M20 80 Q30 75 40 80 Q50 85 60 80 Q70 75 80 80" stroke="#ffffff" strokeWidth="2" fill="none"/>
        <path d="M20 85 Q30 80 40 85 Q50 90 60 85 Q70 80 80 85" stroke="#ffffff" strokeWidth="2" fill="none"/>
      </svg>
      
      {/* Company name */}
      <div className="flex flex-col">
        <span className={`${textClassName} text-gray-900 leading-tight`}>
          VectorStream
        </span>
        <span className="text-xs text-gray-600 font-medium leading-tight">
          SYSTEMS
        </span>
      </div>
    </div>
  );
};

export default VectorStreamLogo;
