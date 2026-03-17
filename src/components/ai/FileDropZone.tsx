// Level VI — Multimodal Intelligence
// Component: FileDropZone
// Drag-and-drop: image | PDF | audio | video — routes to FORGE.
// Renders as a full drop target or as an inline compact drop area.

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";

export type FileType = "image" | "pdf" | "audio" | "video";

export interface DroppedFile {
  name: string;
  type: FileType;
  mimeType: string;
  size: number;
  data: string;
}

interface FileDropZoneProps {
  onFile: (file: DroppedFile) => void;
  accept?: FileType[];
  assistantName?: string;
  compact?: boolean;
  disabled?: boolean;
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
`;

export default function FileDropZone({
  onFile,
  accept = ["image", "pdf", "audio"],
  assistantName = "FORGE",
  compact = false,
  disabled = false,
}: FileDropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<DroppedFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      const type = getFileType(file.name);
      if (!type || !accept.includes(type)) return;

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
        onFile(dropped);
      };
      reader.readAsDataURL(file);
    },
    [accept, onFile]
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

  const acceptedTypes = accept.map((t) => ACCEPT_MAP[t]).flat().join(", ");

  return (
    <>
      <style>{css}</style>
      <div>
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
            accept={buildAcceptString(accept)}
            style={{ display: "none" }}
            onChange={onChange}
          />

          {compact ? (
            <span className="fdz-label">
              <span className="fdz-icon">📎</span>
              <strong>Drop file</strong> or click · {acceptedTypes}
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
                {accept.map((t) => TYPE_ICONS[t]).join(" ")} &nbsp;
                {accept.join(" · ")} formats
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
      </div>
    </>
  );
}
