import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const [imgSrc, setImgSrc] = useState<string>('/logo.png');
  const [imgErrorCount, setImgErrorCount] = useState<number>(0);

  const imageSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';

  const handleImgError = () => {
    if (imgErrorCount === 0) {
      // Try SVG fallback first
      setImgSrc('/logo.svg');
      setImgErrorCount(1);
    } else if (imgErrorCount === 1) {
      // Try JPG fallback
      setImgSrc('/logo.jpg');
      setImgErrorCount(2);
    } else {
      // Final fallback to vector SVG emblem
      setImgErrorCount(3);
    }
  };

  return (
    <div className="flex items-center gap-3 group cursor-pointer select-none">
      {/* Icon Badge / Image */}
      <div className={`relative ${imageSize} rounded-xl overflow-hidden shadow-[0_0_20px_rgba(147,51,234,0.4)] group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transition-all duration-300 bg-slate-900 border border-purple-500/40 flex items-center justify-center shrink-0`}>
        {imgErrorCount < 3 ? (
          <img 
            src={imgSrc} 
            alt="SuperPanel" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={handleImgError}
          />
        ) : (
          /* SVG Vector Fallback Emblem when all images fail */
          <div className="w-full h-full bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 flex items-center justify-center relative">
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 via-indigo-300 to-sky-300 text-lg tracking-tighter">
              S
            </span>
            <Sparkles className="absolute top-1 right-1 w-2.5 h-2.5 text-purple-400 opacity-80" />
          </div>
        )}
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="tracking-tight text-white font-black text-lg flex items-center gap-1">
            <span className="font-extrabold text-white group-hover:text-purple-200 transition-colors">Super</span>
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent font-black">Panel</span>
          </div>
          <span className="text-[9px] tracking-widest text-purple-300/80 uppercase mt-0.5 font-semibold">
            SMM &amp; DIGITAL SERVICES
          </span>
        </div>
      )}
    </div>
  );
}
