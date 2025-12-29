import React, { useState } from 'react';
import { X, Loader2, Star, MessageSquareHeart } from 'lucide-react';
import { toast } from 'sonner';
import { reviewService } from '../../services/reviewService';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    context?: {
        recipeId: string;
        recipeName: string;
    } | null;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, context }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    if (!isOpen || !context) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            await reviewService.createReview({
                recipeId: context.recipeId,
                rating,
                comment
            });

            toast.success("Feedback Received!", {
                description: `Thanks for rating ${context.recipeName}`
            });

            // Reset and Close
            setComment('');
            setRating(5);
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to submit review");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <MessageSquareHeart className="w-5 h-5 text-pink-500" />
                        Rate Recipe
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-slate-950/30 px-6 py-3 border-b border-slate-800">
                    <p className="text-sm text-slate-400">
                        How is <span className="text-blue-400 font-semibold">{context.recipeName}</span> working for you?
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Star Rating */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                type="button"
                                key={star}
                                className="focus:outline-none transition-transform hover:scale-110"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    className={`w-8 h-8 ${(hoverRating || rating) >= star
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-slate-700 fill-slate-900'
                                        } transition-colors`}
                                />
                            </button>
                        ))}
                    </div>
                    <div className="text-center text-xs text-slate-500 font-medium uppercase tracking-wide">
                        {rating === 5 ? "Excellent" : rating === 4 ? "Good" : rating === 3 ? "Okay" : rating === 2 ? "Poor" : "Terrible"}
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Comment (Optional)</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            placeholder="Tell us what you like or dislike..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all placeholder-slate-600 resize-none"
                        />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Submit Review
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
