const CLOUDINARY_CLOUD_NAME = "dh3adqhdd";
const UPLOAD_PRESET = "cameraman_gallery";
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    [key: string]: unknown;
}

/**
 * Uploads an image directly to Cloudinary using the cameraman_gallery preset.
 * The response includes secure_url and public_id that Firestore relies on.
 */
export const uploadImageToCloudinary = async (
    file: File
): Promise<CloudinaryUploadResult> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(UPLOAD_URL, {
        method: "POST",
        body: formData
    });

    const data = await response.json();

    if (!response.ok) {
        const message = data.error?.message || "Failed to upload image";
        throw new Error(message);
    }

    return data;
};
