import React from 'react';

// Color scheme based on #801461
const colorPrimary = '#FFFFFF';

// Custom Molar Tooth Icon
const MolarIcon = ({ className = "w-8 h-8", stroke = colorPrimary, strokeWidth = 2 }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Contorno molar */}
    <path d="M20 6C14 6 8 12 8 22C8 38 12 58 20 58C24 58 24 46 32 46C40 46 40 58 44 58C52 58 56 38 56 22C56 12 50 6 44 6C38 6 36 18 32 18C28 18 26 6 20 6Z" />
    
    {/* Destaque/brilho no canto superior direito */}
    <path d="M46 14C48 16 50 18 50 20" strokeWidth="1.5" />
  </svg>
);

export default MolarIcon;

