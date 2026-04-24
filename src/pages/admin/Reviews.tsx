import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { Star, CheckCircle, Trash2, EyeOff, ShieldCheck } from "lucide-react";

interface Review {
    id: string;
    name: string;
    rating: number;
    message: string;
    eventType: string;
    createdAt: any;
    approved: boolean;
}

export const AdminReviews = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const q = query(
                collection(db, "reviews"),
                orderBy("createdAt", "desc")
            );

            const snapshot = await getDocs(q);
            const fetched: Review[] = [];

            snapshot.forEach((doc) => {
                fetched.push({ id: doc.id, ...doc.data() } as Review);
            });

            setReviews(fetched);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await updateDoc(doc(db, "reviews", id), {
                approved: true
            });
            // Optimistic update
            setReviews(reviews.map(r => r.id === id ? { ...r, approved: true } : r));
        } catch (error) {
            console.error("Error approving review:", error);
            alert("Failed to approve review.");
        }
    };

    const handleHide = async (id: string) => {
        try {
            await updateDoc(doc(db, "reviews", id), {
                approved: false
            });
            // Optimistic update
            setReviews(reviews.map(r => r.id === id ? { ...r, approved: false } : r));
        } catch (error) {
            console.error("Error hiding review:", error);
            alert("Failed to hide review.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;

        try {
            await deleteDoc(doc(db, "reviews", id));
            setReviews(reviews.filter(r => r.id !== id));
        } catch (error) {
            console.error("Error deleting review:", error);
            alert("Failed to delete review.");
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Manage Reviews</h1>
                <p className="text-[var(--text-secondary)]">Approve client reviews before they appear on the public website.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
                </div>
            ) : reviews.length === 0 ? (
                <div className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-12 text-center">
                    <MessageSquareIcon className="mx-auto h-12 w-12 text-[var(--text-tertiary)] mb-4" />
                    <h3 className="text-xl font-medium text-[var(--text-primary)] mb-2">No reviews found</h3>
                    <p className="text-[var(--text-secondary)]">When clients submit reviews, they will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className={`bg-[var(--surface-base)] border ${review.approved ? 'border-[var(--border-light)]' : 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]'} rounded-2xl p-6 flex flex-col relative`}
                        >
                            {review.approved ? (
                                <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                    <ShieldCheck size={12} />
                                    Approved
                                </div>
                            ) : (
                                <div className="absolute -top-3 -right-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                    <EyeOff size={12} />
                                    Hidden
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-[var(--text-primary)]">{review.name}</h3>
                                    <p className="text-sm text-[var(--text-secondary)]">{review.eventType}</p>
                                </div>
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={16}
                                            className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                                        />
                                    ))}
                                </div>
                            </div>

                            <p className="text-[var(--text-secondary)] text-sm mb-6 flex-grow">
                                "{review.message}"
                            </p>

                            <div className="text-xs text-[var(--text-tertiary)] mb-4">
                                Submitted: {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Unknown Date'}
                            </div>

                            <div className="flex gap-2 mt-auto pt-4 border-t border-[var(--border-light)]">
                                {!review.approved ? (
                                    <button
                                        onClick={() => handleApprove(review.id)}
                                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={16} />
                                        Approve
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleHide(review.id)}
                                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 px-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <EyeOff size={16} />
                                        Hide
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(review.id)}
                                    className="px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    title="Delete Review"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Need this missing icon for empty state
const MessageSquareIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);
