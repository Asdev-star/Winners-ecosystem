// Phase 5 — Cloudinary Product Image Upload
// src/features/market/components/ProductImageUpload.tsx

import { useState, useRef } from 'react';
import { useAuthStore } from '../../auth/authStore';
import { API_BASE } from '../../../lib/api';

interface ProductImageUploadProps {
  productId: string;
  onUpload: (urls: string[]) => void;
  initialImages?: string[];
}

export default function ProductImageUpload({ 
  productId, 
  onUpload,
  initialImages = [] 
}: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>(initialImages);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = useAuthStore((s) => s.token);

  const handleFiles = async (files: FileList) => {
    if (uploading || !files.length) return;
    
    setUploading(true);
    setError(null);

    const form = new FormData();
    Array.from(files).forEach(f => form.append('images', f));

    try {
      const res = await fetch(`${API_BASE}/products/${productId}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      
      if (!res.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await res.json();
      const newPreviews = data.images || [];
      setPreviews(prev => [...prev, ...newPreviews]);
      onUpload(newPreviews);
    } catch (err) {
      console.error('Image upload failed', err);
      setError('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeImage = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{
      background: 'var(--surface)', 
      border: `2px dashed ${uploading ? 'var(--gold)' : error ? 'var(--red)' : 'var(--border)'}`,
      borderRadius: 6, 
      padding: 24, 
      textAlign: 'center', 
      transition: 'border-color .15s ease'
    }}>
      <input 
        type="file" 
        multiple 
        accept="image/*"
        style={{ display: 'none' }} 
        id={`img-upload-${productId}`}
        ref={fileInputRef}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      
      <label 
        htmlFor={`img-upload-${productId}`} 
        style={{ cursor: uploading ? 'default' : 'pointer' }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>
          {uploading ? '⏳' : '🖼'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          {uploading ? 'Uploading...' : 'Click to upload product images (up to 5)'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
          Auto-converted to WebP · Max 5MB per image
        </div>
      </label>

      {error && (
        <div style={{ 
          color: 'var(--red)', 
          fontSize: 12, 
          marginTop: 12 
        }}>
          {error}
        </div>
      )}

      {previews.length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          marginTop: 16, 
          flexWrap: 'wrap', 
          justifyContent: 'center' 
        }}>
          {previews.map((url, index) => (
            <div key={url} style={{ position: 'relative' }}>
              <img 
                src={url} 
                alt={`Product ${index + 1}`}
                style={{ 
                  width: 80, 
                  height: 80, 
                  objectFit: 'cover', 
                  borderRadius: 4, 
                  border: '1px solid var(--border)' 
                }} 
              />
              <button
                onClick={() => removeImage(index)}
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--red)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}