// Phase 5 - Intelligence Layer
// Component: FollowUpChips
// Implements: AI Assistant Interaction Specification V2
// AI-generated follow-up prompt chips displayed after assistant responses

import { useState } from "react";

interface FollowUpChipsProps {
  chips: string[];
  onChipClick?: (chip: string) => void;
  accentColor?: string;
  disabled?: boolean;
}

export default function FollowUpChips({
  chips,
  onChipClick,
  accentColor = "var(--gold)",
  disabled = false
}: FollowUpChipsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!chips || chips.length === 0) {
    return null;
  }

  const handleChipClick = (chip: string) => {
    if (!disabled && onChipClick) {
      onChipClick(chip);
    }
  };

  return (
    <div
      className="follow-up-chips"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginTop: "16px",
        paddingTop: "12px",
        borderTop: "1px solid var(--border)"
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono, 'Space Mono', monospace)",
          fontSize: "10px",
          color: "var(--text-dim)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginRight: "4px",
          alignSelf: "center"
        }}
      >
        Continue:
      </span>
      
      {chips.slice(0, 3).map((chip, index) => (
        <button
          key={`${chip}-${index}`}
          onClick={() => handleChipClick(chip)}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          disabled={disabled}
          style={{
            fontFamily: "var(--font-mono, 'Space Mono', monospace)",
            fontSize: "12px",
            color: hoveredIndex === index ? "var(--bg)" : accentColor,
            backgroundColor: hoveredIndex === index ? accentColor : "transparent",
            border: `1px solid ${accentColor}`,
            borderRadius: "16px",
            padding: "6px 12px",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            transition: "all 0.2s ease",
            outline: "none",
            maxWidth: "280px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
