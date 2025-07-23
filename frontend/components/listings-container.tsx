"use client";

import ListingCard from "./listing-card";

export interface Listing {
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
  baseFilteredListings: Listing[];
  statusFilter: string;
  expandedListing: number | null;
  listingReviews: { [key: number]: Review[] };
  userNames: { [key: number]: string };
  onStatusFilterChange: (status: string) => void;
  onExpandListing: (listingId: number) => void;
  user: { uid: number; name: string } | null;
  onUpdateListing: (listid: number, updated: Listing) => void;
  sortOption: string;
  onSortChange: (sort: string) => void;
}

export default function ListingsContainer({
  listings,
  baseFilteredListings,
  statusFilter,
  expandedListing,
  listingReviews,
  userNames,
  onStatusFilterChange,
  onSortChange,
  onExpandListing,
  user,
  onUpdateListing,
}: ListingsContainerProps) {
  const filteredListings = listings; // listings from props = already category + search filtered
  const finalListings = filteredListings.filter((listing) => {
    if (statusFilter === "all") return true;
    return listing.status === statusFilter;
  });

  if (listings.length === 0) return null;

  return (
    <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 w-full max-w-4xl">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
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
              Open ({baseFilteredListings.filter((l) => l.status === "open").length})
            </option>
            <option value="taken">
              Taken ({baseFilteredListings.filter((l) => l.status === "taken").length})
            </option>
            <option value="completed">
              Completed ({baseFilteredListings.filter((l) => l.status === "completed").length})
            </option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm font-medium">
            Sort by:
          </label>
          <select
            id="sort-select"
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-1 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
          >
            <option value="--">--</option>
            <option value="best-match">Best Match</option>
            <option value="distance">Distance</option>
            <option value="price">Price</option>
            <option value="category">Category Match</option>
            <option value="deadline">Deadline</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {finalListings.map((listing, index) => (
          <ListingCard
            key={index}
            listing={listing}
            isExpanded={expandedListing === listing.listid}
            reviews={listingReviews[listing.listid] || null}
            userNames={userNames}
            onExpand={onExpandListing}
            user={user}
            onStatusUpdate={onUpdateListing}
          />
        ))}
      </div>

      {finalListings.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No listings found with status "{statusFilter}".
        </p>
      )}
    </div>
  );
}
