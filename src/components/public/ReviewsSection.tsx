import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, onSnapshot, where } from "firebase/firestore";
import { Star, MessageSquarePlus, X } from "lucide-react";

interface Review {
    id: string;
    name: string;
    rating: number;
    message: string;
    eventType: string;
    createdAt: any;
    approved?: boolean;
}

export const ReviewsSection = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [eventType, setEventType] = useState("");
    const [rating, setRating] = useState(5);
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [totalReviews, setTotalReviews] = useState(0);
    const [averageRating, setAverageRating] = useState(0);

    useEffect(() => {
        // Real-time listener for total approved reviews
        const qCount = query(collection(db, "reviews"), where("approved", "==", true));
        const unsubscribe = onSnapshot(qCount, (snapshot) => {
            setTotalReviews(snapshot.size);

            if (snapshot.size > 0) {
                let totalRatingStr = 0;
                snapshot.forEach(doc => {
                    const data = doc.data();
                    totalRatingStr += (data.rating || 0);
                });
                setAverageRating(totalRatingStr / snapshot.size);
            } else {
                setAverageRating(0);
            }
        }, (error) => {
            console.error("Error listening to reviews:", error);
        });

        fetchReviews();

        return () => unsubscribe();
    }, []);

    const fetchReviews = async () => {
        try {
            // Fetch reviews sorted by date descending.
            // Using a simple query and filtering locally to avoid forcing complex composite index creation immediately.
            const q = query(
                collection(db, "reviews"),
                orderBy("createdAt", "desc"),
                limit(20)
            );

            const snapshot = await getDocs(q);
            const fetched: Review[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.rating >= 4 && data.approved === true && fetched.length < 6) {
                    fetched.push({ id: doc.id, ...data } as Review);
                }
            });

            // If empty (new collection), supply a placeholder review matching the example exactly.
            if (fetched.length === 0) {
                fetched.push({
                    id: "placeholder",
                    name: "Rahul Singh",
                    eventType: "Wedding Photography",
                    rating: 5,
                    message: "Cameraman Pro ne hamari wedding memories beautifully capture ki. Highly recommended.",
                    createdAt: new Date(),
                    approved: true
                });
            }

            setReviews(fetched);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            // On failure (like missing index for createdAt before first record), fallback to placeholder
            setReviews([{
                id: "placeholder",
                name: "Rahul Singh",
                eventType: "Wedding Photography",
                rating: 5,
                message: "Cameraman Pro ne hamari wedding memories beautifully capture ki. Highly recommended.",
                createdAt: new Date(),
                approved: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await addDoc(collection(db, "reviews"), {
                name,
                eventType,
                rating,
                message,
                createdAt: serverTimestamp(),
                approved: false
            });
            setShowForm(false);
            setName("");
            setEventType("");
            setRating(5);
            setMessage("");
            alert("Thank you! Your review has been submitted and is pending approval.");
            // Refresh reviews to show new ones instantly
            fetchReviews();
        } catch (error) {
            console.error("Error adding review:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="py-24 bg-[var(--bg-primary)] border-y border-[var(--border-light)] relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
                    <div className="text-center md:text-left">
                        <span className="text-[var(--accent-primary)] font-bold tracking-wider uppercase text-sm mb-2 block">
                            Client Reviews
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
                            What our clients say about us
                        </h2>
                        {totalReviews > 0 && (
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={24}
                                            className={star <= Math.round(averageRating) ? "text-amber-400 fill-amber-400 drop-shadow-sm" : "text-gray-400/20 fill-gray-400/20"}
                                        />
                                    ))}
                                </div>
                                <span className="text-xl font-bold text-[var(--text-primary)]">
                                    {averageRating.toFixed(1)}<span className="text-[var(--text-secondary)] text-lg font-normal">/5</span>
                                </span>
                                <span className="text-lg text-[var(--text-secondary)] ml-1">
                                    Average Rating ({totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'})
                                </span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--surface-base)] border border-[var(--border-light)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] font-semibold transition-all shadow-sm group"
                    >
                        {showForm ? <X size={20} className="group-hover:rotate-90 transition-transform" /> : <MessageSquarePlus size={20} className="group-hover:scale-110 transition-transform" />}
                        {showForm ? "Close Form" : "Write a Review"}
                    </button>
                </div>

                {/* Review Form (Dropdown) */}
                {showForm && (
                    <div className="mb-16 max-w-2xl mx-auto bg-[var(--surface-base)] border border-[var(--border-light)] p-8 rounded-3xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Share your experience</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Your Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                                        placeholder="e.g. Rahul Singh"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Event Type *</label>
                                    <input
                                        type="text"
                                        required
                                        value={eventType}
                                        onChange={(e) => setEventType(e.target.value)}
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                                        placeholder="e.g. Wedding Photography"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Rating *</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="focus:outline-none"
                                        >
                                            <Star
                                                size={36}
                                                className={`transition-colors ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-400/30 fill-transparent hover:text-amber-400/50'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Review Message *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-light)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all resize-none"
                                    placeholder="Share your feedback..."
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8 py-3 rounded-xl bg-[var(--accent-primary)] text-white font-bold hover:shadow-lg hover:shadow-[var(--accent-primary)]/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:transform-none"
                                >
                                    {submitting ? "Submitting..." : "Submit Review"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Reviews Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-primary)]"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="bg-[var(--surface-base)] border border-[var(--border-light)] p-8 rounded-3xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col group cursor-default"
                            >
                                <div className="flex gap-1 mb-6 transition-transform group-hover:scale-105 origin-left">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={20}
                                            className={i < review.rating ? "text-amber-400 fill-amber-400 drop-shadow-sm" : "text-gray-400/20 fill-gray-400/20"}
                                        />
                                    ))}
                                </div>
                                <p className="text-[var(--text-primary)] text-lg italic leading-relaxed mb-8 flex-grow">
                                    "{review.message}"
                                </p>
                                <div className="mt-auto pt-6 border-t border-[var(--border-light)]">
                                    <h4 className="font-bold text-[var(--text-primary)] text-lg">{review.name}</h4>
                                    <p className="text-[var(--text-secondary)] text-sm">{review.eventType}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </section>
    );
};
