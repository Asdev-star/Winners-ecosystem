// Level I — Design System Enforcement
// Component: SectionWrapper
// Max-width + 8px-grid padding for every major section. Never inline again.

interface SectionWrapperProps {
  children: React.ReactNode;
  maxWidth?: number;
  paddingX?: number;
  paddingY?: number;
  gap?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
}

export default function SectionWrapper({
  children,
  maxWidth = 1280,
  paddingX = 32,
  paddingY = 48,
  gap = 48,
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
