import React from 'react';

interface TowingRopeProps {
  className?: string;
}

/**
 * Component vẽ dây cáp kéo nối từ đuôi máy bay UTH 3D sang 2 khuyên móc kim loại của Banner.
 */
export const TowingRope: React.FC<TowingRopeProps> = ({ className }) => {
  return (
    <div className={`relative shrink-0 w-12 sm:w-14 h-20 sm:h-24 flex items-center -ml-5 -mr-1.5 pointer-events-none select-none z-10 ${className || ''}`}>
      <svg
        className="w-full h-full overflow-visible"
        viewBox="0 0 60 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient màu dây cáp da/vải cao cấp */}
          <linearGradient id="ropeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8c582d" />
            <stop offset="50%" stopColor="#d89f6d" />
            <stop offset="100%" stopColor="#a36b3b" />
          </linearGradient>

          {/* Gradient khuyên kim loại màu bạc */}
          <radialGradient id="ringGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#334155" />
          </radialGradient>
        </defs>

        {/* Bóng đổ của dây cáp */}
        <path
          d="M 2 48 C 20 42, 38 24, 54 18"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 2 48 C 20 52, 38 66, 54 70"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Dây cáp trên (Top Rope) nối từ chóp đuôi vào khuyên trên banner */}
        <path
          d="M 2 46 C 20 40, 38 22, 54 16"
          stroke="url(#ropeGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 2 46 C 20 40, 38 22, 54 16"
          stroke="#fef08a"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeDasharray="3 3"
        />

        {/* Dây cáp dưới (Bottom Rope) nối từ chóp đuôi vào khuyên dưới banner */}
        <path
          d="M 2 46 C 20 50, 38 64, 54 68"
          stroke="url(#ropeGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 2 46 C 20 50, 38 64, 54 68"
          stroke="#fef08a"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeDasharray="3 3"
        />

        {/* Móc khuyên kim loại ở chóp đuôi máy bay */}
        <circle cx="2" cy="46" r="3.5" fill="url(#ringGrad)" stroke="#1e293b" strokeWidth="1" />

        {/* Hai khuyên tròn kim loại gắn trên mép da banner */}
        <g filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))">
          <circle cx="54" cy="16" r="4.8" fill="none" stroke="url(#ringGrad)" strokeWidth="2.6" />
          <circle cx="54" cy="16" r="2.2" fill="#0f172a" />

          <circle cx="54" cy="68" r="4.8" fill="none" stroke="url(#ringGrad)" strokeWidth="2.6" />
          <circle cx="54" cy="68" r="2.2" fill="#0f172a" />
        </g>
      </svg>
    </div>
  );
};
