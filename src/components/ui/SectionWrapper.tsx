// Level I — Design System Enforcement
// Component: SectionWrapper
// Max-width + 8px-grid padding for every major section. Never inline again.

import type { CSSProperties, ElementType, ReactNode } from "react";

interface SectionWrapperProps {
  children: ReactNode;
  maxWidth?: number;
  paddingX?: number;
  paddingY?: number;
  gap?: number;
  className?: string;
  as?: ElementType;
  style?: CSSProperties;
}

export default function SectionWrapper({
  children,
  maxWidth = 1280,
  paddingX = 24,
  paddingY = 32,
  gap = 32,
  className,
  as: Tag = "section",
  style,
}: SectionWrapperProps) {
  return (
    <Tag
      className={className}
      style={{
        maxWidth,
        width: "100%",
        marginInline: "auto",
        paddingInline: paddingX,
        paddingBlock: paddingY,
        display: "flex",
        flexDirection: "column",
        gap,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
