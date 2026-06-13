import React from "react";

interface VerificationBadgeProps {
  level?: string;
  size?: number;
  showText?: boolean;
}

export function VerificationBadge({
  level = "none",
  size = 15,
  showText = false,
}: VerificationBadgeProps) {
  if (level === "none" || !level) return null;

  let color = "#94A3B8"; // Default slate gray
  let label = "Phone Verified";
  let textColorClass = "text-text-muted";

  if (level === "level_2" || level === "verified") {
    color = "#20D5EC"; // TikTok vibrant sky-blue
    label = "Identity Verified";
    textColorClass = "text-sky-600 font-semibold";
  } else if (level === "level_3") {
    color = "#F59E0B"; // TikTok vibrant gold/amber
    label = "Trusted Fundraiser";
    textColorClass = "text-amber-600 font-semibold";
  } else if (level === "level_1") {
    color = "#94A3B8";
    label = "Phone Verified";
    textColorClass = "text-text-muted";
  } else {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 select-none align-middle cursor-default group relative">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-110"
      >
        {/* TikTok Decagram Badge Background */}
        <path
          d="M12 2L14.76 4.76L18.66 4.1L19.33 8L22.56 10.33L20.89 13.9L22.56 17.47L19.33 19.8L18.66 23.7L14.76 23.04L12 25.8L9.24 23.04L5.34 23.7L4.67 19.8L1.44 17.47L3.11 13.9L1.44 10.33L4.67 8L5.34 4.1L9.24 4.76L12 2Z"
          fill={color}
        />
        {/* Crisp checkmark inside */}
        <path
          d="M8.5 12.5L11 15L16.5 9.5"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && <span className={`text-xs ${textColorClass}`}>{label}</span>}
      
      {/* Simple Tooltip on hover */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-text text-white text-[10px] py-1 px-2 rounded font-medium whitespace-nowrap shadow-md z-50">
        {label}
      </span>
    </span>
  );
}
