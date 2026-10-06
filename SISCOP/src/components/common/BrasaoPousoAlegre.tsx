import React from 'react';

interface BrasaoProps {
  className?: string;
  size?: number;
  monochrome?: boolean;
}

export const BrasaoPousoAlegre: React.FC<BrasaoProps> = ({
  className = '',
  size = 64,
  monochrome = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-label="Brasão de Pouso Alegre - MG"
    >
      {/* Mural Crown (Coroa Mural) */}
      <g id="coroa-mural">
        <path
          d="M 40 38 L 48 20 L 58 28 L 68 18 L 80 26 L 92 18 L 102 28 L 112 20 L 120 38 Z"
          fill={monochrome ? '#1e293b' : '#EAB308'}
          stroke="#1e293b"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Crown battlements/windows */}
        <rect x="52" y="28" width="6" height="7" fill="#1e293b" rx="1" />
        <rect x="77" y="26" width="6" height="8" fill="#1e293b" rx="1" />
        <rect x="102" y="28" width="6" height="7" fill="#1e293b" rx="1" />
        <line x1="43" y1="36" x2="117" y2="36" stroke="#1e293b" strokeWidth="2" />
      </g>

      {/* Main Shield Outline */}
      <g id="escudo">
        <path
          d="M 42 38 L 118 38 C 118 84 104 116 80 128 C 56 116 42 84 42 38 Z"
          fill={monochrome ? '#ffffff' : '#1E40AF'}
          stroke="#1e293b"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Shield partition (Lower hills/river section) */}
        <clipPath id="shieldClip">
          <path d="M 42 38 L 118 38 C 118 84 104 116 80 128 C 56 116 42 84 42 38 Z" />
        </clipPath>

        <g clipPath="url(#shieldClip)">
          {/* Lower field: green hills / nature */}
          <path
            d="M 38 78 Q 60 70 80 78 Q 100 86 122 76 L 122 135 L 38 135 Z"
            fill={monochrome ? '#cbd5e1' : '#15803D'}
          />
          {/* Blue winding river (Sapucaí / Mandu) */}
          <path
            d="M 40 98 C 65 90, 65 110, 80 102 C 95 94, 95 114, 120 105 L 120 125 C 95 130, 95 110, 80 120 C 65 130, 65 110, 40 120 Z"
            fill={monochrome ? '#64748b' : '#38BDF8'}
          />

          {/* Golden cross / Religious heritage in upper canton */}
          <g id="cruz-simbolo">
            <rect
              x="77"
              y="44"
              width="6"
              height="24"
              fill={monochrome ? '#1e293b' : '#FDE047'}
              stroke="#0f172a"
              strokeWidth="1"
            />
            <rect
              x="70"
              y="50"
              width="20"
              height="6"
              fill={monochrome ? '#1e293b' : '#FDE047'}
              stroke="#0f172a"
              strokeWidth="1"
            />
          </g>

          {/* Stars (Progresso) */}
          <circle cx="56" cy="54" r="2.5" fill={monochrome ? '#1e293b' : '#FFFFFF'} />
          <circle cx="104" cy="54" r="2.5" fill={monochrome ? '#1e293b' : '#FFFFFF'} />
          <circle cx="62" cy="66" r="2" fill={monochrome ? '#1e293b' : '#FFFFFF'} />
          <circle cx="98" cy="66" r="2" fill={monochrome ? '#1e293b' : '#FFFFFF'} />
        </g>
      </g>

      {/* Laurel & Coffee Branches on sides */}
      <g id="ramos" stroke={monochrome ? '#475569' : '#166534'} strokeWidth="2" strokeLinecap="round">
        {/* Left branch */}
        <path d="M 38 48 C 24 64 26 94 48 116" fill="none" />
        <ellipse cx="28" cy="60" rx="3.5" ry="6" transform="rotate(-30 28 60)" fill={monochrome ? '#94a3b8' : '#22C55E'} />
        <ellipse cx="27" cy="80" rx="3.5" ry="6" transform="rotate(-15 27 80)" fill={monochrome ? '#94a3b8' : '#22C55E'} />
        <ellipse cx="34" cy="100" rx="3.5" ry="6" transform="rotate(15 34 100)" fill={monochrome ? '#94a3b8' : '#22C55E'} />

        {/* Right branch */}
        <path d="M 122 48 C 136 64 134 94 112 116" fill="none" />
        <ellipse cx="132" cy="60" rx="3.5" ry="6" transform="rotate(30 132 60)" fill={monochrome ? '#94a3b8' : '#22C55E'} />
        <ellipse cx="133" cy="80" rx="3.5" ry="6" transform="rotate(15 133 80)" fill={monochrome ? '#94a3b8' : '#22C55E'} />
        <ellipse cx="126" cy="100" rx="3.5" ry="6" transform="rotate(-15 126 100)" fill={monochrome ? '#94a3b8' : '#22C55E'} />
      </g>

      {/* Ribbon Scroll at bottom (Listel) */}
      <g id="listel">
        <path
          d="M 28 132 L 44 124 L 80 134 L 116 124 L 132 132 L 126 142 L 114 136 L 80 146 L 46 136 L 34 142 Z"
          fill={monochrome ? '#f1f5f9' : '#EF4444'}
          stroke="#0f172a"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Motto Text representation */}
        <text
          x="80"
          y="140"
          textAnchor="middle"
          fontSize="6"
          fontWeight="bold"
          fontFamily="sans-serif"
          fill={monochrome ? '#0f172a' : '#FFFFFF'}
          letterSpacing="0.8"
        >
          POUSO ALEGRE
        </text>
      </g>
    </svg>
  );
};
