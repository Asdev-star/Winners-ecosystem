// Phase 3 — Winners Academy — Cloudinary Service
// Cloudinary service for video and lecture uploads in Winners Academy

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  duration?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  resourceType: string;
}

export interface VideoUploadOptions {
  folder?: string;
  resourceType?: 'video' | 'image' | 'raw' | 'auto';
  transformation?: object;
  eager?: object[];
  eagerAsync?: boolean;
}

export interface OptimisedUrlOptions {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  format?: string;
  fetchFormat?: string;
  gravity?: string;
  dpr?: string | number;
}

/**
 * Upload a video file to Cloudinary for Academy lectures
 */
export async function uploadVideo(
  filePath: string,
  options: VideoUploadOptions = {}
): Promise<UploadResult> {
  const {
    folder = 'winners-academy/lectures',
    resourceType = 'video',
    transformation,
    eager,
    eagerAsync = false,
  } = options;

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: resourceType,
      transformation,
      eager: eager || [
        { width: 300, height: 200, crop: 'fill', format: 'jpg' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      eager_async: eagerAsync,
      timeout: 600000, // 10 minutes for large videos
    });

    // Generate thumbnail from video
    const thumbnailUrl = cloudinary.url(result.public_id, {
      transformation: [
        { width: 320, height: 180, crop: 'fill', start_offset: '0' },
        { format: 'jpg', quality: 'auto' }
      ]
    });

    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      duration: result.duration,
      width: result.width,
      height: result.height,
      thumbnailUrl,
      resourceType: result.resource_type,
    };
  } catch (error) {
    console.error('Cloudinary video upload error:', error);
    throw new Error(`Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload an image to Cloudinary for course thumbnails, instructor avatars
 */
export async function uploadImage(
  filePath: string,
  options: VideoUploadOptions = {}
): Promise<UploadResult> {
  const {
    folder = 'winners-academy/images',
    resourceType = 'image',
    transformation,
  } = options;

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: resourceType,
      transformation: transformation || [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      timeout: 120000, // 2 minutes for images
    });

    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
    };
  } catch (error) {
    console.error('Cloudinary image upload error:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build an optimised Cloudinary delivery URL for an existing asset.
 */
export function getOptimisedUrl(publicId: string, options: OptimisedUrlOptions = {}): string {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width: options.width,
        height: options.height,
        crop: options.crop,
        quality: options.quality,
        fetch_format: options.fetchFormat,
        gravity: options.gravity,
        dpr: options.dpr,
      },
      ...(options.format ? [{ format: options.format }] : []),
    ].filter(Boolean),
  });
}

/**
 * Upload a document (PDF) to Cloudinary for course materials
 */
export async function uploadDocument(
  filePath: string,
  options: VideoUploadOptions = {}
): Promise<UploadResult> {
  const {
    folder = 'winners-academy/documents',
    resourceType = 'raw',
  } = options;

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: resourceType,
      timeout: 120000,
    });

    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      resourceType: result.resource_type,
    };
  } catch (error) {
    console.error('Cloudinary document upload error:', error);
    throw new Error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFile(publicId: string, resourceType: string = 'video'): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteAsset(publicId: string, resourceType: string = "image"): Promise<boolean> {
  return deleteFile(publicId, resourceType);
}

/**
 * Get video details from Cloudinary
 */
export async function getVideoDetails(publicId: string): Promise<UploadResult> {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'video',
    });

    const thumbnailUrl = cloudinary.url(publicId, {
      transformation: [
        { width: 320, height: 180, crop: 'fill', start_offset: '0' },
        { format: 'jpg', quality: 'auto' }
      ]
    });

    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      duration: result.duration,
      width: result.width,
      height: result.height,
      thumbnailUrl,
      resourceType: result.resource_type,
    };
  } catch (error) {
    console.error('Cloudinary get details error:', error);
    throw new Error(`Failed to get video details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a signed URL for private video playback
 */
export function generateSignedUrl(publicId: string, expiresIn: number = 3600): string {
  try {
    const timestamp = Math.round(Date.now() / 1000) + expiresIn;
    const signature = cloudinary.utils.api_sign_request(
      {
        public_id: publicId,
        timestamp,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/v${timestamp}/${publicId}?signature=${signature}&api_key=${process.env.CLOUDINARY_API_KEY}`;
  } catch (error) {
    console.error('Cloudinary signed URL error:', error);
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default cloudinary;
