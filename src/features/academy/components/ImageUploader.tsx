// Phase 3 — Winners Academy — ImageUploader.tsx
// Cloudinary direct-upload component for course thumbnails

import { useState, useRef } from 'react';
import { API_BASE } from '../../../lib/api';
import { getAuthHeaders } from '../../auth/authStore';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
}

export default function ImageUploader({
  value,
  onChange,
  label = 'Thumbnail',
  hint = 'Recommended: 1280×720px · JPG, PNG, WebP · max 10MB',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const sigRes = await fetch(`${API_BASE}/lecture-uploads/signature`, {
        headers: getAuthHeaders(),
      });
      if (!sigRes.ok) throw new Error('Failed to get upload signature');
      const sig = await sigRes.json() as { apiKey: string; timestamp: number; signature: string; folder: string; cloudName: string };

      const form = new FormData();
      form.append('file', file);
      form.append('api_key', sig.apiKey);
      form.append('timestamp', String(sig.timestamp));
      form.append('signature', sig.signature);
      form.append('folder', `${sig.folder}/thumbnails`);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: 'POST', body: form }
      );
      if (!uploadRes.ok) throw new Error('Cloudinary upload failed');
      const data = await uploadRes.json() as { secure_url: string };
      onChange(data.secure_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void uploadFile(file);
  };

  return (
    <div>
      <style>{`
        .img-upl { display: flex; flex-direction: column; gap: 10px; }
        .img-upl-lbl { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }
        .img-upl-zone {
          border: 2px dashed var(--border);
          border-radius: 6px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 200ms ease;
          background: var(--surface2);
          position: relative;
          overflow: hidden;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .img-upl-zone.over { border-color: var(--gold); background: rgba(201,168,76,0.06); }
        .img-upl-zone:hover { border-color: var(--gold); }
        .img-upl-preview { width: 100%; max-height: 200px; object-fit: cover; border-radius: 4px; display: block; }
        .img-upl-overlay {
          position: absolute; inset: 0;
          background: rgba(13,21,32,0.82);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Space Mono', monospace; font-size: 11px; color: var(--gold);
        }
        .img-upl-hint { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
        .img-upl-err  { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--red); }
        .img-upl-clr {
          padding: 6px 12px; border-radius: 4px;
          border: 1px solid var(--border); background: var(--surface2);
          color: var(--text-dim); font-family: 'Space Mono', monospace;
          font-size: 10px; cursor: pointer; text-transform: uppercase;
        }
        .img-upl-clr:hover { border-color: var(--red); color: var(--red); }
      `}</style>
      <div className="img-upl">
        <div className="img-upl-lbl">{label}</div>
        <div
          className={`img-upl-zone${dragOver ? ' over' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {value ? (
            <img src={value} alt="Thumbnail preview" className="img-upl-preview" />
          ) : (
            <div>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🖼</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                Drop image here or click to upload
              </div>
              <div className="img-upl-hint">{hint}</div>
            </div>
          )}
          {uploading && (
            <div className="img-upl-overlay">Uploading…</div>
          )}
        </div>
        {value && (
          <button
            type="button"
            className="img-upl-clr"
            onClick={() => { onChange(''); if (fileRef.current) fileRef.current.value = ''; }}
          >
            Remove image
          </button>
        )}
        {error && <div className="img-upl-err">⚠ {error}</div>}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}
