import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = "h-8 w-8", showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Blue squircle background */}
          <rect
            x="5"
            y="5"
            width="90"
            height="90"
            rx="24"
            fill="#2563EB"
            className="drop-shadow-md"
          />
          {/* Subtle inner heart glow */}
          <path
            d="M50 82C50 82 18 62 18 39C18 24.5 28.5 15 42 15C48.5 15 50 20.5 50 20.5C50 20.5 51.5 15 58 15C71.5 15 82 24.5 82 39C82 62 50 82 50 82Z"
            fill="#FFFFFF"
            fillOpacity="0.1"
          />
          {/* Elegant curved hands cradling the center */}
          <path
            d="M26 42C26 30 36.5 24 50 24C63.5 24 74 30 74 42C74 57 50 72 50 72C50 72 26 57 26 42Z"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.85"
          />
          {/* Iconic White Somali Star in center */}
          <path
            d="M50 33.5L53.3 41.5H61.8L54.9 46.5L57.5 54.5L50 49.5L42.5 54.5L45.1 46.5L38.2 41.5H46.7L50 33.5Z"
            fill="#FFFFFF"
            className="drop-shadow-sm"
          />
        </svg>
      </div>
      {showText && (
        <span className="font-sans font-extrabold text-xl tracking-tight text-text flex items-center">
          HaddaICaawi
        </span>
      )}
    </div>
  );
}
