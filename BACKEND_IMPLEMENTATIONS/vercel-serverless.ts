/**
 * Vercel Serverless Function for Cloudinary Gallery Delete
 * 
 * Setup:
 * 1. Create api/delete-image.ts in project root
 * 2. Add environment variables to Vercel dashboard:
 *    - CLOUDINARY_CLOUD_NAME=dh3adqhdd
 *    - CLOUDINARY_API_KEY=428111779766663
 *    - CLOUDINARY_API_SECRET=YMvGfK8pFnKyY3wwXeQuZZGn2HY
 * 3. Deploy: vercel deploy
 * 
 * Access endpoint:
 * POST https://your-domain.vercel.app/api/delete-image
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dh3adqhdd",
  api_key: process.env.CLOUDINARY_API_KEY || "428111779766663",
  api_secret: process.env.CLOUDINARY_API_SECRET || "YMvGfK8pFnKyY3wwXeQuZZGn2HY",
});

interface DeleteRequest {
  public_id: string;
}

interface CloudinaryDeleteResult {
  result: string;
  [key: string]: any;
}

/**
 * Vercel API Route to delete Cloudinary images
 * 
 * POST /api/delete-image
 * 
 * Request body:
 * {
 *   "public_id": "cameraman_gallery/image-name"
 * }
 * 
 * Response (success - 200):
 * {
 *   "message": "Image deleted successfully",
 *   "public_id": "cameraman_gallery/image-name",
 *   "timestamp": "2024-01-15T10:30:00Z"
 * }
 * 
 * Response (error - 4xx/5xx):
 * {
 *   "error": "Error type",
 *   "message": "Error description"
 * }
 */
export default async (
  req: VercelRequest,
  res: VercelResponse
): Promise<void> => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({
      error: "Method not allowed",
      message: "Only POST requests are supported",
    });
    return;
  }

  try {
    const { public_id } = req.body as DeleteRequest;

    // Validate public_id
    if (!public_id || typeof public_id !== "string") {
      res.status(400).json({
        error: "Invalid request",
        message: "public_id is required and must be a string",
      });
      return;
    }

    // Security: Only allow deleting from cameraman_gallery
    if (!public_id.startsWith("cameraman_gallery/")) {
      res.status(400).json({
        error: "Invalid public_id",
        message: "Can only delete images from cameraman_gallery folder",
      });
      return;
    }

    console.log(`[DELETE-IMAGE] Deleting: ${public_id}`);

    // Delete from Cloudinary
    const result: CloudinaryDeleteResult =
      await cloudinary.uploader.destroy(public_id);

    // Handle response
    if (result.result === "ok") {
      console.log(`[DELETE-IMAGE] Success: ${public_id}`);
      res.status(200).json({
        message: "Image deleted successfully",
        public_id,
        timestamp: new Date().toISOString(),
      });
    } else if (result.result === "not found") {
      res.status(404).json({
        error: "Image not found",
        message: `Image ${public_id} does not exist`,
        public_id,
      });
    } else {
      res.status(400).json({
        error: "Deletion failed",
        message: "Cloudinary API returned unexpected result",
        cloudinaryResponse: result,
      });
    }
  } catch (error: any) {
    console.error("[DELETE-IMAGE] Error:", error);

    // Handle specific errors
    if (error.message?.includes("Invalid")) {
      res.status(400).json({
        error: "Invalid image",
        message: error.message,
      });
    } else if (error.message?.includes("Not Found")) {
      res.status(404).json({
        error: "Image not found",
        message: error.message,
      });
    } else {
      res.status(500).json({
        error: "Server error",
        message: error.message || "Failed to delete image",
      });
    }
  }
};
