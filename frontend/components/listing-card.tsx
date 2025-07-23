"use client";

import ReviewsList from "./reviews-list";

interface Listing {
  listid: number;
  listing_name: string;
  description: string;
  price: number;
  duration: number;
  capacity: number;
  address: string;
  deadline: string;
  status: string;
}

interface Review {
  reviewer_uid: number;
  reviewee_uid: number;
  rating?: number;
  comment?: string;
  timestamp?: string;
}

interface ListingCardProps {
  listing: Listing;
  isExpanded: boolean;
  reviews: Review[] | null;
  userNames: { [key: number]: string };
  onExpand: (listingId: number) => void;
}

export default function ListingCard({
  listing,
  isExpanded,
  reviews,
  userNames,
  onExpand,
}: ListingCardProps) {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "taken":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg border overflow-hidden">
      {/* Listing Header - Clickable */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        onClick={() => onExpand(listing.listid)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-lg">{listing.listing_name}</h4>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                  listing.status
                )}`}
              >
                {listing.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {listing.description}
            </p>
            <div className="flex gap-4 text-sm">
              <span>
                <strong>Price:</strong> ${listing.price}
              </span>
              <span>
                <strong>Duration:</strong> {listing.duration} min
              </span>
              <span>
                <strong>People Needed:</strong> {listing.capacity}
              </span>
            </div>
            <div className="flex gap-4 text-sm mt-1">
              <span>
                <strong>Address:</strong> {listing.address}
              </span>
              <span>
                <strong>Deadline:</strong>{" "}
                {new Date(listing.deadline).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <span className="text-2xl">{isExpanded ? "▼" : "▶"}</span>
          </div>
        </div>
      </div>

      {/* Expanded Content - Reviews */}
      {isExpanded && (
        <div className="border-t bg-gray-50 dark:bg-gray-800">
          <div className="p-4">
            <h5 className="font-semibold mb-3">Review:</h5>
            {reviews ? (
              <ReviewsList reviews={reviews} userNames={userNames} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Loading reviews...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
