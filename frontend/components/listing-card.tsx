"use client";

import ReviewsList from "./reviews-list";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";

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
  user: { uid: number; name: string } | null;
  onStatusUpdate?: (listid: number, updated: Listing) => void;
}

export default function ListingCard({
  listing,
  isExpanded,
  reviews,
  userNames,
  onExpand,
  user,
  onStatusUpdate,
}: ListingCardProps) {
  const [isAssigned, setIsAssigned] = useState(false);

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

  useEffect(() => {
    const checkAssigned = async () => {
      if (!user) return;
      try {
        const res = await fetch(`http://localhost:8080/listings/${listing.listid}/assigned-users`);
        const data = await res.json();
        const uids = Array.isArray(data) ? data.map((row: any) => row.uid ?? row) : [];
        setIsAssigned(uids.includes(user.uid));
      } catch (err) {
        console.error("Failed to fetch assigned users:", err);
        setIsAssigned(false);
      }
    };

    checkAssigned();
  }, [user, listing.listid, listing.status]); // Re-check if listing changes

  const handleAcceptTask = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `http://localhost:8080/listings/${listing.listid}/assign/${user.uid}`,
        { method: "POST" }
      );
      const message = await response.text();

      if (response.ok) {
        toast.success(message || "Successfully assigned task!");

        // Get updated listing
        const res = await fetch(`http://localhost:8080/listings/${listing.listid}`);
        const updated = await res.json();
        onStatusUpdate?.(listing.listid, updated); // tell parent

        // Re-check assignment
        const check = await fetch(`http://localhost:8080/listings/${listing.listid}/assigned-users`);
        const data = await check.json();
        const uids = Array.isArray(data) ? data.map((row: any) => row.uid ?? row) : [];
        setIsAssigned(uids.includes(user.uid));
      } else {
        toast.error(message || "Unable to assign task.");
      }
    } catch (error) {
      toast.error("Network error while assigning task.");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
                {typeof listing.status === 'string' ? listing.status.toUpperCase() : listing.status}
              </span>

              {user && (
                isAssigned ? (
                  <span
                    title="You have already accepted this task"
                    className="ml-auto px-2 py-[3px] border border-green-600 text-green-700 text-[10px] font-medium rounded-full bg-white dark:bg-transparent cursor-default select-none"
                  >
                    Accepted
                  </span>
                ) : (
                  listing.status === "open" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptTask();
                      }}
                      title="Accept Task"
                      className="relative bg-[oklch(0.828_0.189_84.4)] hover:bg-[oklch(0.828_0.189_84.4/90%)] rounded-full transition-all duration-200 overflow-hidden group h-5 w-5 hover:w-24 hover:flex hover:items-center hover:justify-center hover:pr-2 ml-auto"
                    >
                      <svg
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 transition-opacity duration-200 group-hover:opacity-0"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg
                          className="w-3 h-3 flex-shrink-0"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="ml-1 text-[10px] font-medium whitespace-nowrap text-white">
                          Accept Task
                        </span>
                      </div>
                    </button>
                  )
                )
              )}
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
            <span className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              {isExpanded ? "▼" : "▶"}
            </span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t bg-gray-50 dark:bg-gray-800">
          <div className="p-4 space-y-4">
            <h5 className="font-semibold mb-3">Reviews:</h5>
            {reviews ? (
              <ReviewsList reviews={reviews} userNames={userNames} />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Loading reviews...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
