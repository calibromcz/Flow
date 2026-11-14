import React from 'react';

export const FlowLogo = ({ size = 40, showText = true, isDark = false, className = '' }) => (
  <div className={`inline-flex flex-col items-center justify-center select-none shrink-0 ${className}`}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Semicerchio Sinistro - Rosso Corallo (#F25449) su cerchio perfetto r=40 */}
      <path
        d="M 49.6 98.6 A 40 40 0 0 1 49.6 21.4"
        stroke="#F25449"
        strokeWidth="10.5"
        strokeLinecap="butt"
      />
      {/* Punta Freccia Rossa in alto, ruotata lungo la tangente del cerchio */}
      <polygon
        points="47,9 67,19 51,33"
        fill="#F25449"
      />

      {/* Semicerchio Destro - Verde Menta (#32B87A) simmetrico a 180 gradi esatti */}
      <path
        d="M 70.4 21.4 A 40 40 0 0 1 70.4 98.6"
        stroke="#32B87A"
        strokeWidth="10.5"
        strokeLinecap="butt"
      />
      {/* Punta Freccia Verde in basso, simmetrica a 180 gradi */}
      <polygon
        points="73,111 53,101 69,87"
        fill="#32B87A"
      />
    </svg>

    {showText && (
      <span
        style={{
          color: isDark ? '#F5F5F7' : '#1D1D1F',
          letterSpacing: '0.32em',
          marginRight: '-0.32em'
        }}
        className="mt-2 font-light text-xs sm:text-sm uppercase tracking-[0.32em]"
      >
        FLOW
      </span>
    )}
  </div>
);

export const FlowIcon = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 select-none ${className}`}
  >
    {/* Semicerchio Sinistro - Rosso Corallo */}
    <path
      d="M 49.6 98.6 A 40 40 0 0 1 49.6 21.4"
      stroke="#F25449"
      strokeWidth="10.5"
      strokeLinecap="butt"
    />
    <polygon points="47,9 67,19 51,33" fill="#F25449" />

    {/* Semicerchio Destro - Verde Menta */}
    <path
      d="M 70.4 21.4 A 40 40 0 0 1 70.4 98.6"
      stroke="#32B87A"
      strokeWidth="10.5"
      strokeLinecap="butt"
    />
    <polygon points="73,111 53,101 69,87" fill="#32B87A" />
  </svg>
);
