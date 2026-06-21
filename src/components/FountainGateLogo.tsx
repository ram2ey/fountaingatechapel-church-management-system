import React from 'react';

interface FountainGateLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function FountainGateLogo({ size = 'md', showText = true }: FountainGateLogoProps) {
  // Dimension definitions
  const dimensions = {
    sm: { svg: 'h-8 w-8', text: 'text-sm', slogan: 'text-[7px]' },
    md: { svg: 'h-12 w-12', text: 'text-lg', slogan: 'text-[9px]' },
    lg: { svg: 'h-16 w-16', text: 'text-xl', slogan: 'text-[11px]' },
    xl: { svg: 'h-24 w-24', text: 'text-3xl', slogan: 'text-[14px]' }
  };

  const selected = dimensions[size];

  return (
    <div className="flex items-center space-x-3 select-none">
      {showText && (
        <div className="flex flex-col text-left">
          {/* Brand Font matches the modern geometric clean lines of the logo */}
          <span className={`font-serif font-black tracking-tight text-[#1664a7] leading-none uppercase ${selected.text}`}>
            Fountain
          </span>
          <span className={`font-serif font-black tracking-tight text-[#1664a7] leading-none uppercase mt-1 ${selected.text}`}>
            Gate Chapel
          </span>
          {/* Golden subtitle as requesting by user */}
          <span className={`font-sans font-medium text-[#D1A129] italic tracking-wide mt-1.5 leading-none ${selected.slogan}`}>
            Change Pastures, Ankaful.
          </span>
        </div>
      )}

      {/* Dynamic Stylized Reeds Vector matching the uploaded logo */}
      <div className={`relative flex-shrink-0 ${selected.svg}`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform hover:scale-105 transition-transform duration-300">
          {/* Left golden reeds */}
          <path 
            d="M 50,90 C 45,70 25,60 15,40 C 20,40 38,55 46,75" 
            fill="none" 
            stroke="#D1A129" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
          <path 
            d="M 50,90 C 47,65 33,52 23,35 C 28,35 44,48 48,70" 
            fill="none" 
            stroke="#D1A129" 
            strokeWidth="3" 
            strokeLinecap="round" 
          />
          <path 
            d="M 50,90 C 49,60 40,46 32,30 C 36,30 46,42 49,65" 
            fill="none" 
            stroke="#D1A129" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />

          {/* Right blue reeds */}
          <path 
            d="M 50,90 C 55,70 75,60 85,40 C 80,40 62,55 54,75" 
            fill="none" 
            stroke="#1664a7" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
          <path 
            d="M 50,90 C 53,65 67,52 77,35 C 72,35 56,48 52,70" 
            fill="none" 
            stroke="#1664a7" 
            strokeWidth="3" 
            strokeLinecap="round" 
          />
          <path 
            d="M 50,90 C 51,60 60,46 68,30 C 64,30 54,42 51,65" 
            fill="none" 
            stroke="#1664a7" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />
        </svg>
      </div>
    </div>
  );
}
