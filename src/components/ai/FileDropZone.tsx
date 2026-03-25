// Level VI — Multimodal Intelligence
// Component: FileDropZone
// Drag-and-drop: image | PDF | audio | video — routes to FORGE.
// Renders as a full drop target or as an inline compact drop area.
// Extended with supervisor context for per-layer integration (NOVA, SAGE, CIRCUIT)
/* eslint-disable react-refresh/only-export-components */
import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";

export type FileType = "image" | "pdf" | "audio" | "video";

export interface DroppedFile {
  name: string;
  type: FileType;
  mimeType: string;
  size: number;
  data: string;
}

export interface AnalysisResult {
  analysis: string;
  type: FileType;
  supervisor: string;
  context?: Record<string, string>;
  confidence?: number;
  skills?: string[];
  suggestions?: string[];
}

// Supervisor mapping for display names
export const SUPERVISOR_NAMES: Record<string, string> = {
  nova: "NOVA",
  sage: "SAGE",
  atlas: "ATLAS",
  circuit: "CIRCUIT",
  forge: "FORGE",
  omega: "OMEGA",
  aria: "ARIA",
  nexus: "NEXUS",
  herald: "HERALD",
};

interface FileDropZoneProps {
  onFile?: (file: DroppedFile) => void;
  accept?: FileType[];
  acceptedTypes?: FileType[];
  supervisor?: string;
  context?: Record<string, string>;
  label?: string;
  onAnalysis?: (result: AnalysisResult) => void;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
}

const ACCEPT_MAP: Record<FileType, string[]> = {
  image: ["jpg", "jpeg", "png", "gif", "webp"],
  pdf:   ["pdf"],
  audio: ["mp3", "wav", "m4a", "ogg", "webm"],
  video: ["mp4", "mov", "webm"],
};

const TYPE_ICONS: Record<FileType, string> = {
  image: "🖼️",
  pdf:   "📄",
  audio: "🎤",
  video: "🎬",
};

function getFileType(filename: string): FileType | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  for (const [type, exts] of Object.entries(ACCEPT_MAP)) {
    if (exts.includes(ext)) return type as FileType;
  }
  return null;
}

function buildAcceptString(types: FileType[]): string {
  return types
    .flatMap((t) => {
      if (t === "image") return ["image/*"];
      if (t === "audio") return ["audio/*"];
      if (t === "video") return ["video/*"];
      return [".pdf"];
    })
    .join(",");
}

// Get context-aware analysis prompt based on supervisor
function getAnalysisPrompt(supervisor: string, context?: Record<string, string>): string {
  const prompts: Record<string, string> = {
    nova: "Analyze this content for the Winners Community. Identify any skills, expertise areas, or interests demonstrated. Provide tags and a brief summary suitable for community engagement.",
    sage: "Analyze this educational content. Extract key concepts, create a summary, identify important terms for a glossary, and suggest quiz questions if applicable. Context: " + (JSON.stringify(context) || "general learning"),
    atlas: "Analyze this commercial content. Extract product details, pricing signals, and market opportunities. Provide insights for the Winners Market.",
    circuit: "Analyze this contract or job-related document. Identify key terms, payment schedules, IP ownership clauses, risk factors, and suggested amendments. Context: " + (JSON.stringify(context) || "general review"),
    forge: "Analyze this file and provide a structured summary.",
    omega: "Provide a strategic analysis of this content from an ecosystem perspective.",
    aria: "Analyze this data from a workspace management perspective.",
    nexus: "Analyze this from a developer documentation perspective.",
    herald: "Analyze this for platform health and monitoring insights.",
  };
  return prompts[supervisor.toLowerCase()] || prompts.forge;
}

const css = `
.fdz-root {
  border: 2px dashed var(--border);
  border-radius: 10px;
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--surface);
  user-select: none;
}

.fdz-root.fdz-dragging {
  border-color: var(--purple);
  background: rgba(155, 111, 255, 0.05);
}

.fdz-root.fdz-compact {
  padding: 12px 16px;
}

.fdz-root.fdz-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.fdz-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 10px;
}

.fdz-compact .fdz-icon {
  font-size: 18px;
  display: inline;
  margin: 0 6px 0 0;
}

.fdz-label {
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.5;
}

.fdz-label strong {
  color: var(--purple);
  font-weight: 700;
}

.fdz-meta {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-top: 8px;
}

.fdz-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(155,111,255,0.08);
  border: 1px solid rgba(155,111,255,0.2);
  border-radius: 8px;
  padding: 10px 14px;
  margin-top: 10px;
  animation: fdz-preview-in 0.2s ease;
}

@keyframes fdz-preview-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fdz-preview-icon { font-size: 20px; flex-shrink: 0; }

.fdz-preview-meta { flex: 1; min-width: 0; }
.fdz-preview-name {
  font-size: 12px; font-weight: 600; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.fdz-preview-type {
  font-family: 'Space Mono', monospace; font-size: 9px;
  color: var(--purple); text-transform: uppercase; letter-spacing: 0.06em;
}

.fdz-preview-remove {
  background: none; border: none; color: var(--text-dim);
  font-size: 18px; cursor: pointer; padding: 0 4px;
  opacity: 0.6; transition: opacity 0.15s; line-height: 1;
}
.fdz-preview-remove:hover { opacity: 1; }

.fdz-analyzing {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: rgba(155, 111, 255, 0.1);
  border: 1px solid var(--purple);
  border-radius: 8px;
  margin-top: 10px;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: var(--purple);
  animation: fdz-pulse 1.5s ease-in-out infinite;
}

@keyframes fdz-pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.fdz-error {
  padding: 12px;
  background: rgba(224, 90, 78, 0.1);
  border: 1px solid var(--red);
  border-radius: 8px;
  margin-top: 10px;
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  color: var(--red);
}

.fdz-custom-label {
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  color: var(--text);
  margin-bottom: 8px;
}
`;

export default function FileDropZone({
  onFile,
  accept = ["image", "pdf", "audio"],
  acceptedTypes,
  supervisor,
  context,
  label,
  onAnalysis,
  compact = false,
  disabled = false,
  className,
}: FileDropZoneProps) {
  const allowedTypes = acceptedTypes ?? accept;
  const assistantName = supervisor ? SUPERVISOR_NAMES[supervisor.toLowerCase()] || supervisor : "FORGE";
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<DroppedFile | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Call AI Platform for analysis
  const analyzeFile = useCallback(
    async (file: DroppedFile) => {
      if (!onAnalysis) return;

      setAnalyzing(true);
      setAnalysisError(null);

      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const formData = new FormData();
        
        // Convert base64 to blob
        const base64Data = file.data.split(",")[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: file.mimeType });
        
        formData.append("file", blob, file.name);
        formData.append("prompt", getAnalysisPrompt(supervisor || "forge", context));
        if (supervisor) formData.append("supervisor", supervisor);
        if (context) formData.append("context", JSON.stringify(context));

        const response = await fetch("/api/v1/ai-platform/analyze", {
          method: "POST",
          headers: token ? { "Authorization": `Bearer ${token}` } : {},
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.statusText}`);
        }

        const result = await response.json();
        
        const analysisResult: AnalysisResult = {
          analysis: result.analysis || result.response || "No analysis returned",
          type: file.type,
          supervisor: supervisor || "forge",
          context,
          confidence: result.confidence,
          skills: result.skills,
          suggestions: result.suggestions,
        };

        onAnalysis(analysisResult);
      } catch (err) {
        console.error("AI Analysis error:", err);
        setAnalysisError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        setAnalyzing(false);
      }
    },
    [onAnalysis, supervisor, context]
  );

  const processFile = useCallback(
    (file: File) => {
      const type = getFileType(file.name);
      if (!type || !allowedTypes.includes(type)) return;

      const reader = new FileReader();
      reader.onload = () => {
        const dropped: DroppedFile = {
          name: file.name,
          type,
          mimeType: file.type,
          size: file.size,
          data: reader.result as string,
        };
        setPreview(dropped);
        onFile?.(dropped);
        
        // Auto-analyze if onAnalysis is provided
        if (onAnalysis) {
          analyzeFile(dropped);
        }
      };
      reader.readAsDataURL(file);
    },
    [allowedTypes, onFile, onAnalysis, analyzeFile]
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const acceptedTypeList = allowedTypes.map((t) => ACCEPT_MAP[t]).flat().join(", ");

  // Custom label display
  const displayLabel = label || (onAnalysis 
    ? `Drop file for ${assistantName} to analyze` 
    : `Drop file for ${assistantName} to analyse`);

  return (
    <>
      <style>{css}</style>
      <div className={className}>
        {label && <p className="fdz-custom-label">{label}</p>}
        <div
          className={[
            "fdz-root",
            dragging ? "fdz-dragging" : "",
            compact ? "fdz-compact" : "",
            disabled ? "fdz-disabled" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !disabled && inputRef.current?.click()}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`Drop file for ${assistantName} to analyse`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={buildAcceptString(allowedTypes)}
            style={{ display: "none" }}
            onChange={onChange}
          />

          {compact ? (
            <span className="fdz-label">
              <span className="fdz-icon">📎</span>
              <strong>Drop file</strong> or click · {acceptedTypeList}
            </span>
          ) : (
            <>
              <span className="fdz-icon">
                {dragging ? "✨" : "📂"}
              </span>
              <p className="fdz-label">
                {dragging ? (
                  <>Release to send to <strong>{assistantName}</strong></>
                ) : (
                  <>Drop file for <strong>{assistantName}</strong> to analyse<br />or click to browse</>
                )}
              </p>
              <p className="fdz-meta">
                {allowedTypes.map((t) => TYPE_ICONS[t]).join(" ")} &nbsp;
                {allowedTypes.join(" · ")} formats
              </p>
            </>
          )}
        </div>

        {/* Preview chip */}
        {preview && (
          <div className="fdz-preview">
            <span className="fdz-preview-icon">{TYPE_ICONS[preview.type]}</span>
            <div className="fdz-preview-meta">
              <p className="fdz-preview-name">{preview.name}</p>
              <p className="fdz-preview-type">
                {preview.type} · {(preview.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              className="fdz-preview-remove"
              onClick={(e) => { e.stopPropagation(); setPreview(null); }}
              aria-label="Remove file"
            >
              ×
            </button>
          </div>
        )}

        {/* Analyzing state */}
        {analyzing && (
          <div className="fdz-analyzing">
            <span>⏳</span>
            <span>{assistantName} is analyzing...</span>
          </div>
        )}

        {/* Error state */}
        {analysisError && (
          <div className="fdz-error">
            ⚠️ {analysisError}
          </div>
        )}
      </div>
    </>
  );
}
