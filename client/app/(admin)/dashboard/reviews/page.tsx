'use client';
import { useEffect, useState } from 'react';
import { Star, Check, X } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = () => {
    apiClient.get('/reviews')
      .then(({ data }) => setReviews(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReviews(); }, []);

  const handleApprove = async (id: string) => {
    await apiClient.put(`/reviews/${id}/approve`);
    loadReviews();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await apiClient.delete(`/reviews/${id}`);
    loadReviews();
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>

      <div className="space-y-4">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          ))
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No reviews yet</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                      {review.customer?.firstName?.[0]}{review.customer?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review.customer?.firstName} {review.customer?.lastName}
                      </p>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        {review.isVerifiedPurchase && (
                          <span className="text-xs text-green-600 font-medium">Verified Purchase</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="font-semibold text-gray-900 mb-1">{review.title}</p>
                  <p className="text-gray-600">{review.comment}</p>
                  
                  <div className="mt-3">
                    <p className="text-sm text-gray-500">
                      Product: <span className="font-medium text-gray-700">{review.product?.title}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {!review.isApproved && (
                    <button
                      onClick={() => handleApprove(review._id)}
                      className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition"
                      title="Approve"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                    title="Delete"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {review.isApproved && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
                    ✓ Approved
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
