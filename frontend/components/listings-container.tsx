"use client";

import ListingCard from "./listing-card";

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

interface ListingsContainerProps {
  listings: Listing[];
  statusFilter: string;
  expandedListing: number | null;
  listingReviews: { [key: number]: Review[] };
  userNames: { [key: number]: string };
  onStatusFilterChange: (status: string) => void;
  onExpandListing: (listingId: number) => void;
}

export default function ListingsContainer({
  listings,
  statusFilter,
  expandedListing,
  listingReviews,
  userNames,
  onStatusFilterChange,
  onExpandListing,
}: ListingsContainerProps) {
  // Filter listings based on status
  const filteredListings = listings.filter((listing) => {
    if (statusFilter === "all") return true;
    return listing.status === statusFilter;
  });

  if (listings.length === 0) return null;

  return (
    <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 w-full max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Listings:</h3>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium">
            Filter by status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-1 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
          >
            <option value="all">All ({listings.length})</option>
            <option value="open">
              Open ({listings.filter((l) => l.status === "open").length})
            </option>
            <option value="taken">
              Taken ({listings.filter((l) => l.status === "taken").length})
            </option>
            <option value="completed">
              Completed ({listings.filter((l) => l.status === "completed").length})
            </option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredListings.map((listing, index) => (
          <ListingCard
            key={index}
            listing={listing}
            isExpanded={expandedListing === listing.listid}
            reviews={listingReviews[listing.listid] || null}
            userNames={userNames}
            onExpand={onExpandListing}
          />
        ))}
      </div>

      {filteredListings.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No listings found with status "{statusFilter}".
        </p>
      )}
    </div>
  );
}
