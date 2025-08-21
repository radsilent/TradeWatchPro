import React from 'react';

/**
 * VectorStream Systems Logo Component
 * © 2025 VectorStream Systems - Patent Pending
 * All Rights Reserved
 */
const VectorStreamLogo = ({ className = "h-8 w-8", textClassName = "text-xl font-bold" }) => {
  return (
    <div className="flex items-center gap-3">
      {/* Company Logo Image */}
      <img 
        src="/vectorstream-logo.png" 
        alt="VectorStream Systems Logo"
        className={className}
        onError={(e) => {
          // Fallback to text-based logo if image not found
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
      
      {/* Fallback text logo (hidden by default) */}
      <div 
        className="items-center justify-center bg-blue-600 text-white rounded-lg px-2 py-1" 
        style={{ display: 'none' }}
      >
        <span className="font-bold text-sm">VS</span>
      </div>
      
      {/* Company name */}
      <div className="flex flex-col">
        <span className={`${textClassName} text-white leading-tight`}>
          VectorStream
        </span>
        <span className="text-xs text-slate-400 font-medium leading-tight">
          SYSTEMS
        </span>
      </div>
    </div>
  );
};

export default VectorStreamLogo;