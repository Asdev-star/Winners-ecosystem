// Phase 5 - Intelligence Layer
// Component: StreamingText
// Implements: AI Assistant Interaction Specification V2
// Renders streaming AI text with cursor animation

import { useEffect, useRef, useState } from "react";

interface StreamingTextProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
  speed?: number;
  onComplete?: () => void;
}

export default function StreamingText({
  content,
  isStreaming = false,
  className = "",
  speed = 20,
  onComplete
}: StreamingTextProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef(content);
  const cursorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cursor blink effect
  useEffect(() => {
    cursorIntervalRef.current = setInterval(() => {
      setCursorVisible(v => !v);
    }, 530);

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, []);

  // Handle content updates
  useEffect(() => {
    if (content === lastContentRef.current) return;
    
    lastContentRef.current = content;
    
    if (!isStreaming) {
      // Not streaming, display all content
      setDisplayedContent(content);
      return;
    }

    // Streaming mode - reveal character by character
    const currentLength = displayedContent.length;
    const targetLength = content.length;
    
    if (targetLength <= currentLength) {
      setDisplayedContent(content);
      return;
    }

    // Add characters gradually
    const addChars = () => {
      setDisplayedContent(prev => {
        const next = content.slice(0, prev.length + 1);
        if (next.length >= content.length && onComplete) {
          onComplete();
        }
        return next;
      });
    };

    // Initial rapid reveal
    const timer = setTimeout(addChars, 50);
    return () => clearTimeout(timer);
  }, [content, isStreaming, displayedContent.length, onComplete]);

  // Scroll to bottom when content changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedContent]);

  return (
    <div
      ref={containerRef}
      className={`streaming-text ${className}`}
      style={{
        fontFamily: "var(--font-body, 'Syne', sans-serif)",
        fontSize: "15px",
        lineHeight: "1.7",
        color: "var(--text, #E8EEF5)",
        wordBreak: "break-word",
        whiteSpace: "pre-wrap"
      }}
    >
      {displayedContent}
      {isStreaming && (
        <span
          style={{
            display: "inline-block",
            width: "2px",
            height: "1.2em",
            backgroundColor: cursorVisible ? "var(--gold, #C9A84C)" : "transparent",
            marginLeft: "1px",
            verticalAlign: "text-bottom",
            transition: "background-color 0.1s ease"
          }}
        />
      )}
    </div>
  );
}
