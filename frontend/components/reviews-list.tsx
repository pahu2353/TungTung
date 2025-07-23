"use client";

interface Review {
  reviewer_uid: number;
  reviewee_uid: number;
  rating?: number;
  comment?: string;
  timestamp?: string;
}

interface ReviewsListProps {
  reviews: Review[];
  userNames: { [key: number]: string };
}

export default function ReviewsList({ reviews, userNames }: ReviewsListProps) {
  if (!reviews || reviews.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        No reviews yet for this listing.
      </p>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {reviews.map((review, reviewIndex) => (
        <div
          key={reviewIndex}
          className="p-3 bg-white dark:bg-gray-700 rounded border"
        >
          <div className="flex justify-between items-start mb-2">
            {review.rating && (
              <span className="text-yellow-500">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </span>
            )}
          </div>
          {review.comment && (
            <p className="text-sm mb-2">{review.comment}</p>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <span>
              Reviewed By:{" "}
              {userNames[review.reviewer_uid] || `User ${review.reviewer_uid}`}
            </span>
            <span className="ml-4">
              Fulfilled By:{" "}
              {userNames[review.reviewee_uid] || `User ${review.reviewee_uid}`}
            </span>
            {review.timestamp && (
              <span className="ml-4">Date: {review.timestamp}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
