import { useState, useEffect, useCallback, useRef } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { uploadImageToCloudinary } from "../lib/cloudinary";
import { GalleryImage, GalleryCategory } from "../types";
import toast from "react-hot-toast";

const GALLERY_COLLECTION = "gallery";
const CATEGORY_OPTIONS: GalleryCategory[] = ["Wedding", "Pre-Wedding", "Drone", "Cinematic"];

export const useGallery = () => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const unsubscribeRef = useRef<() => void>();

    const loadLiveGallery = useCallback(() => {
        setLoading(true);
        setError(null);
        unsubscribeRef.current?.();
        const galleryRef = collection(db, GALLERY_COLLECTION);
        const galleryQuery = query(galleryRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(
            galleryQuery,
            (snapshot) => {
                const mapped = snapshot.docs.map((docSnapshot) => {
                    const data = docSnapshot.data() as Record<string, any>;
                    const createdAtValue = data.createdAt;
                    const createdAtMillis =
                        typeof createdAtValue === "number"
                            ? createdAtValue
                            : createdAtValue?.toMillis?.() ?? Date.now();

                    const rawCategory = data.category as string;
                    const category = CATEGORY_OPTIONS.includes(rawCategory as GalleryCategory)
                        ? (rawCategory as GalleryCategory)
                        : "Wedding";

                    return {
                        id: docSnapshot.id,
                        title: data.title ?? "Untitled",
                        category,
                        imageUrl: data.imageUrl ?? "",
                        publicId: data.publicId ?? "",
                        createdAt: createdAtMillis
                    } satisfies GalleryImage;
                });

                setImages(mapped);
                setLoading(false);
            },
            (snapshotError) => {
                const message = snapshotError?.message || "Failed to load gallery";
                console.error("Gallery listener failed:", snapshotError);
                setError(message);
                setLoading(false);
            }
        );

        unsubscribeRef.current = unsubscribe;
        return unsubscribe;
    }, []);

    useEffect(() => {
        const unsubscribe = loadLiveGallery();
        return () => {
            unsubscribe();
            unsubscribeRef.current = undefined;
        };
    }, [loadLiveGallery]);

    const uploadImage = async (file: File, category: GalleryCategory, title: string) => {
        if (!file || !title.trim()) {
            toast.error("Please select an image and provide a title");
            return;
        }

        const loadingToast = toast.loading("Uploading image...");
        try {
            const response = await uploadImageToCloudinary(file);
            const galleryRef = collection(db, GALLERY_COLLECTION);
            await addDoc(galleryRef, {
                title: title.trim(),
                category,
                imageUrl: response.secure_url,
                publicId: response.public_id,
                createdAt: serverTimestamp()
            });

            toast.success("Image added to public gallery", { id: loadingToast });
        } catch (uploadError: any) {
            const message = uploadError?.message || "Upload failed";
            console.error("Upload failed:", uploadError);
            setError(message);
            toast.error(message, { id: loadingToast });
        }
    };

    const removeImage = async (id: string) => {
        if (!id) {
            toast.error("Unable to delete image");
            return;
        }

        const loadingToast = toast.loading("Removing image...");
        try {
            await deleteDoc(doc(db, GALLERY_COLLECTION, id));
            toast.success("Image removed from gallery", { id: loadingToast });
            setImages((prev) => prev.filter((img) => img.id !== id));
        } catch (deleteError: any) {
            const message = deleteError?.message || "Deletion failed";
            console.error("Deletion failed:", deleteError);
            setError(message);
            toast.error(message, { id: loadingToast });
        }
    };

    const updateImage = async (id: string, newTitle: string, newCategory: GalleryCategory) => {
        if (!id) {
            toast.error("Invalid image");
            return;
        }

        const trimmedTitle = newTitle.trim();
        if (!trimmedTitle) {
            toast.error("Title cannot be empty");
            return;
        }

        const loadingToast = toast.loading("Saving changes...");
        try {
            await updateDoc(doc(db, GALLERY_COLLECTION, id), {
                title: trimmedTitle,
                category: newCategory
            });
            toast.success("Gallery metadata updated", { id: loadingToast });
        } catch (updateError: any) {
            const message = updateError?.message || "Update failed";
            console.error("Update failed:", updateError);
            setError(message);
            toast.error(message, { id: loadingToast });
        }
    };

    const refreshGallery = useCallback(() => {
        loadLiveGallery();
    }, [loadLiveGallery]);

    return {
        images,
        loading,
        error,
        uploadImage,
        removeImage,
        updateImage,
        refreshGallery
    };
};
