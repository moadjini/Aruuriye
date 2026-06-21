import React from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = "h-10 w-auto", showText = false }: LogoProps) {
  return (
    <div className="flex items-center select-none">
      <Image
        src="/Gemini_Generated_Image_9w12x79w12x79w12.png"
        alt="Aruuriye"
        width={120}
        height={32}
        className={className}
        priority
      />
    </div>
  );
}
