// Phase 3 — Winners Academy — Lecture Upload Routes
// Handles lecture uploads for courses with AI-powered processing (transcript, notes, quiz)

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { uploadVideo, deleteFile } from "../services/cloudinaryService.js";

const router = Router();
const prisma = new PrismaClient();

// POST /lecture-uploads - Create a new lecture upload record
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { courseId, fileName } = req.body;

    if (!fileName) {
      res.status(400).json({ error: "fileName is required" });
      return;
    }

    // If courseId provided, verify instructor owns the course
    if (courseId) {
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          instructorId: user.userId,
          tenantId: user.tenantId
        }
      });

      if (!course) {
        res.status(403).json({ error: "Not authorized to upload to this course" });
        return;
      }
    }

    // Create lecture upload record with pending status
    const lectureUpload = await prisma.lectureUpload.create({
      data: {
        tenantId: user.tenantId,
        userId: user.userId,
        courseId: courseId || null,
        fileName,
        fileUrl: "", // Will be updated after Cloudinary upload
        status: "processing",
        creditsCost: 15
      }
    });

    res.status(201).json(lectureUpload);
  } catch (error) {
    console.error("Error creating lecture upload:", error);
    res.status(500).json({ error: "Failed to create lecture upload" });
  }
});

// POST /lecture-uploads/:id/upload - Upload video file to Cloudinary
router.post("/:id/upload", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const { videoData } = req.body;

    if (!videoData) {
      res.status(400).json({ error: "Video data is required" });
      return;
    }

    // Find the lecture upload
    const lectureUpload = await prisma.lectureUpload.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        userId: user.userId
      }
    });

    if (!lectureUpload) {
      res.status(404).json({ error: "Lecture upload not found" });
      return;
    }

    // Upload to Cloudinary
    const folder = `winners-academy/${user.tenantId}/lectures`;
    const uploadResult = await uploadVideo(videoData, folder, {
      resource_type: "video",
      eager: [
        { streaming_attachment: true },
        { format: "m3u8", resource_type: "video" }
      ]
    });

    // Update the lecture upload with Cloudinary URL
    const updatedUpload = await prisma.lectureUpload.update({
      where: { id },
      data: {
        fileUrl: uploadResult.secure_url,
        durationSecs: Math.round(uploadResult.duration || 0),
        status: "complete"
      }
    });

    res.json(updatedUpload);
  } catch (error) {
    console.error("Error uploading video:", error);
    
    // Mark as failed if upload didn't work
    try {
      const { id } = req.params;
      await prisma.lectureUpload.update({
        where: { id },
        data: { status: "failed" }
      });
    } catch {
      // Ignore update error
    }
    
    res.status(500).json({ error: "Failed to upload video" });
  }
});

// GET /lecture-uploads - List lecture uploads for user/tenant
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { courseId, status } = req.query;

    const where: Record<string, unknown> = {
      tenantId: user.tenantId
    };

    if (courseId) {
      where.courseId = courseId as string;
    }

    if (status) {
      where.status = status as string;
    }

    const lectureUploads = await prisma.lectureUpload.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(lectureUploads);
  } catch (error) {
    console.error("Error listing lecture uploads:", error);
    res.status(500).json({ error: "Failed to list lecture uploads" });
  }
});

// GET /lecture-uploads/:id - Get single lecture upload
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    const lectureUpload = await prisma.lectureUpload.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      },
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!lectureUpload) {
      res.status(404).json({ error: "Lecture upload not found" });
      return;
    }

    res.json(lectureUpload);
  } catch (error) {
    console.error("Error getting lecture upload:", error);
    res.status(500).json({ error: "Failed to get lecture upload" });
  }
});

// DELETE /lecture-uploads/:id - Delete lecture upload
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    // Find the lecture upload
    const lectureUpload = await prisma.lectureUpload.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        userId: user.userId
      }
    });

    if (!lectureUpload) {
      res.status(404).json({ error: "Lecture upload not found" });
      return;
    }

    // Delete from Cloudinary if exists
    if (lectureUpload.fileUrl) {
      try {
        // Extract public_id from URL if it's a Cloudinary URL
        const urlParts = lectureUpload.fileUrl.split("/");
        const publicId = urlParts.slice(-2, -1).join("/") + "/" + urlParts.slice(-1)[0].split(".")[0];
        await deleteFile(publicId, "video");
      } catch {
        // Ignore Cloudinary delete errors
      }
    }

    // Delete from database
    await prisma.lectureUpload.delete({
      where: { id }
    });

    res.json({ message: "Lecture upload deleted" });
  } catch (error) {
    console.error("Error deleting lecture upload:", error);
    res.status(500).json({ error: "Failed to delete lecture upload" });
  }
});

// GET /lecture-uploads/signature - Get Cloudinary upload signature
router.get("/signature", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const timestamp = Math.round(Date.now() / 1000);
    
    // Generate signature for signed upload
    const crypto = await import("crypto");
    const signature = crypto
      .createHash("sha256")
      .update(process.env.CLOUDINARY_API_SECRET + `timestamp=${timestamp}`)
      .digest("hex");

    res.json({
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: `winners-academy/${user.tenantId}`,
      resourceType: "video"
    });
  } catch (error) {
    console.error("Error generating signature:", error);
    res.status(500).json({ error: "Failed to generate upload signature" });
  }
});

export default router;