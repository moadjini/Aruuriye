import React from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = "h-8 w-8", showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative flex items-center justify-center shrink-0">
        <Image
          src="/logo.png"
          alt="HaddaICaawi Logo"
          width={32}
          height={32}
          className={className}
          priority
        />
      </div>
      {showText && (
        <span className="font-sans font-extrabold text-xl tracking-tight text-text flex items-center">
          HaddaICaawi
        </span>
      )}
    </div>
  );
}
