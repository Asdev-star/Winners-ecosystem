// Phase 3 — Winners Academy — VideoUploader.tsx
// Cloudinary direct-upload with XHR progress for lesson videos

import { useState, useRef } from 'react';
import { API_BASE } from '../../../lib/api';
import { getAuthHeaders } from '../../auth/authStore';

interface VideoUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function VideoUploader({
  value,
  onChange,
  label = 'Lesson Video',
}: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file (MP4, MOV, WebM)');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setError('Video must be under 500MB');
      return;
    }

    setUploading(true);
    setProgress(0);
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
      form.append('folder', `${sig.folder}/videos`);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText) as { secure_url: string };
            onChange(data.secure_url);
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`);
        xhr.send(form);
      });
    } catch (err) {
      if (err instanceof Error && err.message !== 'Upload cancelled') {
        setError(err.message);
      }
    } finally {
      setUploading(false);
      xhrRef.current = null;
    }
  };

  const cancelUpload = () => {
    xhrRef.current?.abort();
    setUploading(false);
    setProgress(0);
  };

  return (
    <div>
      <style>{`
        .vid-upl { display: flex; flex-direction: column; gap: 10px; }
        .vid-upl-lbl { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }
        .vid-upl-zone {
          border: 2px dashed var(--border);
          border-radius: 6px;
          padding: 32px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 200ms ease;
          background: var(--surface2);
        }
        .vid-upl-zone:hover { border-color: var(--ice); }
        .vid-upl-progress {
          padding: 20px 16px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .vid-upl-bar { height: 4px; border-radius: 2px; background: var(--border); overflow: hidden; }
        .vid-upl-fill { height: 100%; background: var(--ice); transition: width 100ms linear; }
        .vid-upl-err  { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--red); }
        .vid-upl-hint { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
        .vid-upl-cancel {
          padding: 5px 10px; border-radius: 4px;
          border: 1px solid var(--red); background: transparent;
          color: var(--red); font-family: 'Space Mono', monospace;
          font-size: 10px; cursor: pointer; text-transform: uppercase;
        }
        .vid-upl-clr {
          padding: 6px 12px; border-radius: 4px;
          border: 1px solid var(--border); background: var(--surface2);
          color: var(--text-dim); font-family: 'Space Mono', monospace;
          font-size: 10px; cursor: pointer; text-transform: uppercase;
        }
        .vid-upl-clr:hover { border-color: var(--red); color: var(--red); }
      `}</style>
      <div className="vid-upl">
        <div className="vid-upl-lbl">{label}</div>

        {value ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <video
              src={value}
              controls
              style={{
                width: '100%',
                maxHeight: 240,
                borderRadius: 6,
                background: '#000',
                border: '1px solid var(--border)',
                display: 'block',
              }}
            />
            <button
              type="button"
              className="vid-upl-clr"
              onClick={() => { onChange(''); if (fileRef.current) fileRef.current.value = ''; }}
            >
              Remove video
            </button>
          </div>
        ) : uploading ? (
          <div className="vid-upl-progress">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--ice)' }}>
                Uploading… {progress}%
              </span>
              <button type="button" className="vid-upl-cancel" onClick={cancelUpload}>Cancel</button>
            </div>
            <div className="vid-upl-bar">
              <div className="vid-upl-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="vid-upl-zone" onClick={() => fileRef.current?.click()}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎬</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
              Click to upload video
            </div>
            <div className="vid-upl-hint">MP4, MOV, WebM · max 500MB</div>
          </div>
        )}

        {error && <div className="vid-upl-err">⚠ {error}</div>}
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadFile(f); }}
        />
      </div>
    </div>
  );
}
