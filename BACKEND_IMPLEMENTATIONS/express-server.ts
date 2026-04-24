/**
 * Express.js Backend for Cloudinary Gallery Delete
 * 
 * Setup:
 * 1. npm install express dotenv cloudinary
 * 2. Create .env file with Cloudinary credentials
 * 3. Run: node server.js
 * 
 * Environment variables (.env):
 * PORT=3000
 * CLOUDINARY_CLOUD_NAME=dh3adqhdd
 * CLOUDINARY_API_KEY=428111779766663
 * CLOUDINARY_API_SECRET=YMvGfK8pFnKyY3wwXeQuZZGn2HY
 * CORS_ORIGIN=http://localhost:5173
 */

import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dh3adqhdd",
  api_key: process.env.CLOUDINARY_API_KEY || "428111779766663",
  api_secret: process.env.CLOUDINARY_API_SECRET || "YMvGfK8pFnKyY3wwXeQuZZGn2HY",
});

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

/**
 * Health check endpoint
 */
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "Gallery API is running",
    timestamp: new Date().toISOString(),
  });
});

/**
 * DELETE /api/delete-image
 * 
 * Delete an image from Cloudinary
 * 
 * Request body:
 * {
 *   "public_id": "cameraman_gallery/image-name"
 * }
 * 
 * Response (success):
 * {
 *   "message": "Image deleted successfully",
 *   "public_id": "cameraman_gallery/image-name",
 *   "timestamp": "2024-01-15T10:30:00Z"
 * }
 * 
 * Response (error):
 * {
 *   "error": "Invalid public_id",
 *   "message": "Can only delete images from cameraman_gallery folder"
 * }
 */
app.post("/api/delete-image", async (req: Request, res: Response) => {
  try {
    const { public_id } = req.body;

    // Validate input
    if (!public_id || typeof public_id !== "string") {
      return res.status(400).json({
        error: "Invalid request",
        message: "public_id is required and must be a string",
      });
    }

    // Security: Only allow deleting from cameraman_gallery folder
    if (!public_id.startsWith("cameraman_gallery/")) {
      return res.status(400).json({
        error: "Invalid public_id",
        message: "Can only delete images from cameraman_gallery folder",
      });
    }

    console.log(`Deleting image: ${public_id}`);

    // Delete image from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);

    // Check result
    if (result.result === "ok") {
      console.log(`Successfully deleted: ${public_id}`);
      return res.status(200).json({
        message: "Image deleted successfully",
        public_id,
        timestamp: new Date().toISOString(),
      });
    } else if (result.result === "not found") {
      return res.status(404).json({
        error: "Image not found",
        message: `Image ${public_id} does not exist`,
        public_id,
      });
    } else {
      return res.status(400).json({
        error: "Deletion failed",
        message: "Cloudinary API returned unexpected result",
        cloudinaryResponse: result,
      });
    }
  } catch (error: any) {
    console.error("Delete error:", error);

    // Handle specific errors
    if (error.message?.includes("Invalid")) {
      return res.status(400).json({
        error: "Invalid image",
        message: error.message,
      });
    } else if (error.message?.includes("Not Found")) {
      return res.status(404).json({
        error: "Image not found",
        message: error.message,
      });
    } else {
      return res.status(500).json({
        error: "Server error",
        message: error.message || "Failed to delete image",
      });
    }
  }
});

/**
 * POST /api/upload-info
 * 
 * Returns Cloudinary upload configuration
 * Client can use this for direct uploads
 */
app.post("/api/upload-info", (req: Request, res: Response) => {
  try {
    const uploadOptions = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      upload_preset: process.env.VITE_CLOUDINARY_UPLOAD_PRESET || "cameraman_gallery",
      folder: "cameraman_gallery",
      resource_type: "image",
    };

    res.json({
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      config: uploadOptions,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get upload info" });
  }
});

/**
 * GET /api/gallery
 * 
 * List all images in the gallery folder
 * (Alternative to client-side list API if client-side fails)
 */
app.get("/api/gallery", async (req: Request, res: Response) => {
  try {
    // This would require authentication if using Admin API
    // For now, use the public list API
    res.json({
      message: "Use client-side list API instead",
      listUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/list/cameraman_gallery.json`,
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to fetch gallery",
      message: error.message,
    });
  }
});

/**
 * Error handling middleware
 */
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message || "An unexpected error occurred",
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    message: `${req.method} ${req.path} does not exist`,
    availableEndpoints: [
      "GET /health",
      "POST /api/delete-image",
      "POST /api/upload-info",
      "GET /api/gallery",
    ],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Gallery API Server running on http://localhost:${PORT}`);
  console.log(`📸 Cloudinary configured: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`\n✅ Endpoints:`);
  console.log(`   POST /api/delete-image - Delete image from Cloudinary`);
  console.log(`   GET  /health - Health check`);
  console.log(`\n`);
});

export default app;
