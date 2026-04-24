/**
 * Firebase Cloud Function for deleting Cloudinary images
 * Deploy with: firebase deploy --only functions:deleteImage
 * 
 * Environment variables required:
 * - CLOUDINARY_CLOUD_NAME=dh3adqhdd
 * - CLOUDINARY_API_KEY=428111779766663
 * - CLOUDINARY_API_SECRET=YMvGfK8pFnKyY3wwXeQuZZGn2HY
 */

import * as functions from "firebase-functions";
import type { Response } from "express";

const cloudinary = require("cloudinary").v2;

// Initialize Cloudinary with credentials
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
 * HTTP Cloud Function to delete images from Cloudinary
 * 
 * Request body:
 * {
 *   "public_id": "cameraman_gallery/image-name"
 * }
 * 
 * Response:
 * {
 *   "message": "Image deleted successfully",
 *   "public_id": "cameraman_gallery/image-name"
 * }
 */
export const deleteImage = functions.https.onRequest(
  async (req: functions.https.Request, res: Response) => {
    // Enable CORS for frontend requests
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.status(200).send("");
      return;
    }

    // Only allow POST requests
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

      // Validate that it's from cameraman_gallery folder
      if (!public_id.startsWith("cameraman_gallery/")) {
        res.status(400).json({
          error: "Invalid public_id",
          message: "Can only delete images from cameraman_gallery folder",
        });
        return;
      }

      console.log(`Attempting to delete: ${public_id}`);

      // Call Cloudinary API to delete image
      const result: CloudinaryDeleteResult =
        await cloudinary.uploader.destroy(public_id);

      // Check if deletion was successful
      if (result.result === "ok") {
        console.log(`Successfully deleted: ${public_id}`);
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
      console.error("Delete error:", error);

      // Handle specific Cloudinary errors
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
  }
);

/**
 * Alternative: Callable function for authenticated deletion
 * Use from frontend:
 * const deleteImg = firebase.functions().httpsCallable('deleteImageCallable');
 * await deleteImg({ public_id: 'cameraman_gallery/image' });
 */
export const deleteImageCallable = functions.https.onCall(
  async (data: DeleteRequest, context) => {
    // Check user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { public_id } = data;

    if (!public_id || !public_id.startsWith("cameraman_gallery/")) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid public_id"
      );
    }

    try {
      const result: CloudinaryDeleteResult =
        await cloudinary.uploader.destroy(public_id);

      if (result.result === "ok") {
        return {
          success: true,
          message: "Image deleted successfully",
          public_id,
        };
      } else {
        throw new functions.https.HttpsError(
          "internal",
          "Failed to delete from Cloudinary"
        );
      }
    } catch (error: any) {
      throw new functions.https.HttpsError(
        "internal",
        error.message || "Failed to delete image"
      );
    }
  }
);
