"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [message, setMessage] = useState<string>("");
  const [taskCategories, setTaskCategories] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [expandedListing, setExpandedListing] = useState<number | null>(null);
  const [listingReviews, setListingReviews] = useState<{[key: number]: any[]}>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userNames, setUserNames] = useState<{[key: number]: string}>({});

  const handleGetTaskCategories = async () => {
    try {
      const response = await fetch("http://localhost:8080/taskcategories");
      const data = await response.json();
      setTaskCategories(data);
    } catch (error) {
      console.error("Error fetching task categories:", error);
      setMessage("Error connecting to backend");
    }
  };

  const handleGetListings = async () => {
    try {
      const response = await fetch("http://localhost:8080/listings");
      const data = await response.json();
      setListings(data);
    } catch (error) {
      console.error("Error fetching listings:", error);
      setMessage("Error connecting to backend");
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        handleGetTaskCategories(),
        handleGetListings()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Fetch user name by UID
  const fetchUserName = async (uid: number) => {
    if (userNames[uid]) {
      return userNames[uid];
    }

    try {
      const response = await fetch(`http://localhost:8080/accounts/${uid}/name`);
      const name = await response.text();
      setUserNames(prev => ({
        ...prev,
        [uid]: name
      }));
      return name;
    } catch (error) {
      console.error(`Error fetching name for UID ${uid}:`, error);
      return `User ${uid}`;
    }
  };

  const handleExpandListing = async (listingId: number) => {
    if (expandedListing === listingId) {
      setExpandedListing(null);
      return;
    }

    setExpandedListing(listingId);
    
    // Fetch reviews for this listing if not already loaded
    if (!listingReviews[listingId]) {
      try {
        const response = await fetch(`http://localhost:8080/listings/${listingId}/reviews`);
        const reviews = await response.json();
        
        // Fetch names for all reviewer and reviewee UIDs in the reviews
        const uniqueUIDs = new Set();
        interface Review {
          reviewer_uid: number;
          reviewee_uid: number;
          review_id: number;
          rating?: number;
          comment?: string;
          timestamp?: string;
        }

        reviews.forEach((review: Review) => {
          if (review.reviewer_uid) uniqueUIDs.add(review.reviewer_uid);
          if (review.reviewee_uid) uniqueUIDs.add(review.reviewee_uid);
        });

        // Fetch names for all unique UIDs
        const namePromises = Array.from(uniqueUIDs).map(uid => fetchUserName(uid));
        await Promise.all(namePromises);
        
        setListingReviews(prev => ({
          ...prev,
          [listingId]: reviews
        }));
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    }
  };

  // Filter listings based on status
  const filteredListings = listings.filter(listing => {
    if (statusFilter === "all") return true;
    return listing.status === statusFilter;
  });

  // Get status badge color
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
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold mb-4">TungTung.</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get what you need done.
          </p>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Loading data...</p>
          </div>
        )}

        {/* Display message from hello endpoint */}
        {message && (
          <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 w-full max-w-md">
            <h3 className="font-semibold mb-2">Response:</h3>
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Horizontal scrolling task categories */}
        {taskCategories.length > 0 && (
          <div className="w-full max-w-4xl">
            <h3 className="font-semibold mb-4">Browse by category (under construction!):</h3>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              {taskCategories.map((category, index) => (
                <div 
                  key={index} 
                  className="flex-shrink-0 px-4 py-2 bg-white dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                >
                  <span className="text-sm font-medium whitespace-nowrap">{category.category_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Display listings with filter */}
        {listings.length > 0 && (
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
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
                >
                  <option value="all">All ({listings.length})</option>
                  <option value="open">Open ({listings.filter(l => l.status === "open").length})</option>
                  <option value="taken">Taken ({listings.filter(l => l.status === "taken").length})</option>
                  <option value="completed">Completed ({listings.filter(l => l.status === "completed").length})</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredListings.map((listing, index) => (
                <div key={index} className="bg-white dark:bg-gray-700 rounded-lg border overflow-hidden">
                  {/* Listing Header - Clickable */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleExpandListing(listing.listid)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">{listing.listing_name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(listing.status)}`}>
                            {listing.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{listing.description}</p>
                        <div className="flex gap-4 text-sm">
                          <span><strong>Price:</strong> ${listing.price}</span>
                          <span><strong>Duration:</strong> {listing.duration} min</span>
                          <span><strong>People Needed:</strong> {listing.capacity}</span>
                        </div>
                        <div className="flex gap-4 text-sm mt-1">
                          <span><strong>Address:</strong> {listing.address}</span>
                          <span><strong>Deadline:</strong> {new Date(listing.deadline).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className="text-2xl">
                          {expandedListing === listing.listid ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content - Reviews */}
                  {expandedListing === listing.listid && (
                    <div className="border-t bg-gray-50 dark:bg-gray-800">
                      <div className="p-4">
                        <h5 className="font-semibold mb-3">Review:</h5>
                        {listingReviews[listing.listid] && listingReviews[listing.listid].length > 0 ? (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {listingReviews[listing.listid].map((review, reviewIndex) => (
                              <div key={reviewIndex} className="p-3 bg-white dark:bg-gray-700 rounded border">
                                <div className="flex justify-between items-start mb-2">
                                  {review.rating && (
                                    <span className="text-yellow-500">
                                      {'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}
                                    </span>
                                  )}
                                </div>
                                {review.comment && <p className="text-sm mb-2">{review.comment}</p>}
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  <span>Reviewed By: {userNames[review.reviewer_uid] || `User ${review.reviewer_uid}`}</span>
                                  <span className="ml-4">Fulfilled By: {userNames[review.reviewee_uid] || `User ${review.reviewee_uid}`}</span>
                                  {review.timestamp && <span className="ml-4">Date: {review.timestamp}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : listingReviews[listing.listid] ? (
                          <p className="text-gray-500 dark:text-gray-400">No reviews yet for this listing.</p>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">Loading reviews...</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredListings.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No listings found with status "{statusFilter}".
              </p>
            )}
          </div>
        )}

        {/* Show placeholder when no data is loaded and not loading */}
        {!loading && listings.length === 0 && taskCategories.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No data available. Check your backend connection.</p>
          </div>
        )}
      </main>
    </div>
  );
}
