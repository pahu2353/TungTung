"use client";

import ReviewsList from "./reviews-list";
import { AssignedList } from "./assigned-list";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [assignedUsers, setAssignedUsers] = useState<{ uid: number; name: string; profile_picture: string }[]>([]);

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

  // Helper function to split name into first and last
  const splitName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return { firstName, lastName };
  };

  useEffect(() => {
    const checkAssigned = async () => {
      if (!user) return;
      try {
        const res = await fetch(`http://localhost:8080/listings/${listing.listid}/assigned-users`);
        const data = await res.json();
        // For assignment check, just use uids
        const uids = Array.isArray(data)
          ? data.map((row: any) => row.uid ?? row)
          : [];
        setIsAssigned(uids.includes(user.uid));
      } catch (err) {
        console.error("Failed to fetch assigned users:", err);
        setIsAssigned(false);
      }
    };

    checkAssigned();
  }, [user, listing.listid, listing.status]); // Re-check if listing changes

    // Fetch assigned users with name and profile picture when expanded
    useEffect(() => {
      const fetchAssignedUsers = async () => {
        if (!isExpanded) return;
        try {
          const res = await fetch(`http://localhost:8080/listings/${listing.listid}/assigned-users`);
          const data = await res.json();
          // Expect data: [{ uid, name, profile_picture }]
          setAssignedUsers(Array.isArray(data) ? data : []);
        } catch (err) {
          setAssignedUsers([]);
        }
      };
      fetchAssignedUsers();
    }, [isExpanded, listing.listid]);

  const handleToggleAssignment = async () => {
    if (!user) return;

    try {
      // Assign or unassign depending on current state
      const endpoint = isAssigned 
        ? `http://localhost:8080/listings/${listing.listid}/unassign/${user.uid}`
        : `http://localhost:8080/listings/${listing.listid}/assign/${user.uid}`;
      
      const response = await fetch(endpoint, { method: "POST" });
      const message = await response.text();

      if (response.ok) {
        toast.success(message || `Successfully ${isAssigned ? "unassigned from" : "assigned to"} task!`);

        // Get updated listing
        const res = await fetch(`http://localhost:8080/listings/${listing.listid}`);
        const updated = await res.json();
        onStatusUpdate?.(listing.listid, updated); // tell parent

        // Re-fetch assigned users immediately
        const assignedRes = await fetch(`http://localhost:8080/listings/${listing.listid}/assigned-users`);
        const assignedData = await assignedRes.json();
        setAssignedUsers(Array.isArray(assignedData) ? assignedData : []);
        const uids = Array.isArray(assignedData) ? assignedData.map((row: any) => row.uid ?? row) : [];
        setIsAssigned(uids.includes(user.uid));

      } else {
        toast.error(message || `Unable to ${isAssigned ? "unassign from" : "assign to"} task.`);
      }
    } catch (error) {
      toast.error(`Network error while ${isAssigned ? "unassigning from" : "assigning to"} task.`);
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleAssignment();
                    }}
                    title="Unassign from Task"
                    className="ml-auto px-2 py-[3px] border border-amber-500 text-amber-600 hover:bg-amber-50 text-[10px] font-medium rounded-full transition-colors cursor-pointer select-none"
                  >
                    Accepted ✓
                  </button>
                ) : (
                  listing.status === "open" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAssignment();
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
            {/* Assigned Users Horizontal List */}
            <div>
              <h5 className="font-semibold mb-2">Assigned Users:</h5>
              <ScrollArea className="w-full">
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {assignedUsers.length === 0 ? (
                    <span className="text-gray-500 text-sm">No users assigned yet.</span>
                  ) : (
                    assignedUsers.map((assigned) => {
                      const { firstName, lastName } = splitName(assigned.name || '');
                      return (
                        <div key={assigned.uid} className="flex flex-col items-center min-w-[80px]">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={assigned.profile_picture || "https://placecats.com/300/300"} />
                            <AvatarFallback>
                              {assigned.name
                                ? assigned.name.split(" ").map((n) => n[0]).join("")
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-xs mt-1 text-center leading-tight min-h-[24px] flex flex-col justify-center">
                            <div className="font-medium">{firstName}</div>
                            {lastName && <div className="text-gray-600 dark:text-gray-400">{lastName}</div>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
            {/* Reviews List */}
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
