
import React from "react";

interface HeadingProps {
  children: React.ReactNode;
  className?: string;
}

export function Heading({ children, className = "" }: HeadingProps) {
  return (
    <h1 className={`text-2xl font-semibold tracking-tight ${className}`}>
      {children}
    </h1>
  );
}
