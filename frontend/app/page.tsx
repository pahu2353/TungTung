"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import AuthModal from "@/components/auth-modal";
import CategoryFilters from "@/components/category-filters";
import SearchBar from "@/components/search-bar";
import ListingsContainer from "@/components/listings-container";
import LoadingIndicator from "@/components/loading-indicator";
import CreateListingModal from "@/components/create-listing-modal";
import type { Listing } from "@/components/listings-container";
import { useUser } from "./UserContext";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const [taskCategories, setTaskCategories] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [expandedListing, setExpandedListing] = useState<number | null>(null);
  const [listingReviews, setListingReviews] = useState<{
    [key: number]: any[];
  }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [userNames, setUserNames] = useState<{ [key: number]: string }>({});
  const [sortOption, setSortOption] = useState("best-match");

  // Auth state
  // const [user, setUser] = useState<any>(null);
  const { user, setUser } = useUser(); // Replace local user state with context
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingCategories, setOnboardingCategories] = useState<number[]>([])
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    contact: "", // Email/phone_number
    password: "",
  });

  const [showCreateListingModal, setShowCreateListingModal] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.get("search");
    const expand = searchParams.get("expand");

    if (search) {
      setSearchQuery(search); 
    }
    if (expand) {
      const listingIdToExpand = Number(expand);
      if (listingIdToExpand && expandedListing !== listingIdToExpand) {
        handleExpandListing(listingIdToExpand);
      }
    }
  }, [listings, searchParams]);

  // Use localStorage to check if user is logged in, update to use context setuser
  useEffect(() => {
    const savedUser = localStorage.getItem("tungTungUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, [setUser]);

  const applyFilters = (
    allListings: any[],
    search: string,
    categories: string[]
  ): any[] => {
    if (!Array.isArray(allListings)) return [];

    let filtered = [...allListings];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (listing) =>
          listing.listing_name?.toLowerCase().includes(searchLower) ||
          listing.description?.toLowerCase().includes(searchLower) ||
          listing.address?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const baseFilteredListings = applyFilters(listings, searchQuery, selectedCategories);
  const finalListings = baseFilteredListings.filter((l) =>
    statusFilter === "all" ? true : l.status === statusFilter
  );

  const fetchFilteredSortedListings = async (
    selected: string[] = selectedCategories,
    search = searchQuery,
    status = statusFilter,
    sort = sortOption
  ) => {
    const params = new URLSearchParams();
    selected.forEach((cat) => params.append("categories", cat));
    params.append("status", status);
    params.append("sort", sort);
    params.append("search", search);
    params.append("uid", user?.uid || "0");
    params.append("latitude", "43.4723");
    params.append("longitude", "-80.5449");

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8080/listings/filterAndSort?${params.toString()}`);
      const data = await response.json();
      setListings(data);
    } catch (err) {
      console.error("Error fetching listings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredSortedListings();
  }, [selectedCategories, statusFilter, sortOption, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSortChange = (sort: string) => {
    setSortOption(sort);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
  };

  const handleGetTaskCategories = async () => {
    try {
      const response = await fetch("http://localhost:8080/taskcategories");
      const data = await response.json();
      setTaskCategories(data);
    } catch (error) {
      console.error("Error fetching task categories:", error);
    }
  };

  const toggleCategory = async (categoryName: string, skipAPICall = false) => {
    const updated = selectedCategories.includes(categoryName)
      ? selectedCategories.filter((c) => c !== categoryName)
      : [...selectedCategories, categoryName];

    setSelectedCategories(updated);

    if (skipAPICall) return;

    await fetchFilteredSortedListings(updated);
  };

  const handleClearCategoryFilters = async () => {
    setSelectedCategories([]);
    await fetchFilteredSortedListings([]);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const endpoint = isSignup ? "/signup" : "/login";

      let body;
      if (isSignup) {
        body = {
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          phone_number: authForm.phone_number,
        };
      } else {
        body = {
          email: authForm.contact,
          phone_number: authForm.contact,
          password: authForm.password,
        };
      }

      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("tungTungUser", JSON.stringify(data));
        setUser(data);
        // log user details
        console.log("Logged in user details:", data);
        if (!isSignup) {
          setShowAuthModal(false);
        } else {
          setIsOnboarding(true)
        }
        setAuthForm({ name: "", email: "", phone_number: "", contact: "", password: "" });
      } else {
        alert(data.error || "Authentication failed");
      }
    } catch (error) {
      alert("Network error");
    }
  };

  const handleUserPreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    if (onboardingCategories.length === 0) {
      // show error toast
      return
    }
    try {
      const url = `http://localhost:8080/preferences/${user.uid}`
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(onboardingCategories),
      });
      setShowAuthModal(false)
      setIsOnboarding(false)
      setOnboardingCategories([])
    } catch (e) {
      console.error(e)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("tungTungUser");
    setUser(null);
  };

  const handleAuthFormChange = (field: string, value: string) => {
    setAuthForm(prev => ({ ...prev, [field]: value }));
  };

  // Fetch user name by UID
  const fetchUserName = async (uid: number) => {
    if (userNames[uid]) return userNames[uid];

    try {
      const response = await fetch(`http://localhost:8080/users/${uid}/name`);
      const name = await response.text();
      setUserNames((prev) => ({ ...prev, [uid]: name }));
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

        const uniqueUIDs = new Set<number>();
        reviews.forEach((review: any) => {
          if (review.reviewer_uid) uniqueUIDs.add(review.reviewer_uid);
          if (review.reviewee_uid) uniqueUIDs.add(review.reviewee_uid);
        });

        // Fetch names for all unique UIDs
        await Promise.all(Array.from(uniqueUIDs).map(fetchUserName));

        setListingReviews((prev) => ({
          ...prev,
          [listingId]: reviews,
        }));
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    }
  };

  const handleCreateListing = async (listingData: any) => {
    try {
      const response = await fetch("http://localhost:8080/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listingData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Listing created successfully!");
        setShowCreateListingModal(false);
        await fetchFilteredSortedListings();
      } else {
        alert(data.error || "Failed to create listing");
      }
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("Network error. Please try again.");
    }
  };

  const handleUpdateListing = (listid: number, updated: Listing) => {
    setListings((prev) =>
      prev.map((listing) =>
        listing.listid === listid ? updated : listing
      )
    );
  };

  useEffect(() => {
    handleGetTaskCategories();
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Header 
        user={user}
        onShowAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onShowCreateListing={user ? () => setShowCreateListingModal(true) : undefined}
      />
      
      <main className="flex flex-col gap-[32px] row-start-2 items-center w-full max-w-6xl">
        <AuthModal
          showAuthModal={showAuthModal}
          isSignup={isSignup}
          authForm={authForm}
          onClose={() => setShowAuthModal(false)}
          onToggleMode={() => setIsSignup(!isSignup)}
          onFormChange={handleAuthFormChange}
          onSubmit={handleAuth}
          isOnboarding={isOnboarding}
          onOnboardingSubmit={handleUserPreferences}
          onOnboardingChange={setOnboardingCategories}
          setShowModal={setShowAuthModal}
          setIsOnboarding={setIsOnboarding}
          taskCategories={taskCategories}
        />

        <CreateListingModal
          showModal={showCreateListingModal}
          taskCategories={taskCategories}
          user={user}
          onClose={() => setShowCreateListingModal(false)}
          onSubmit={handleCreateListing}
        />

        <LoadingIndicator 
          loading={loading} 
          hasData={listings.length > 0 || taskCategories.length > 0} 
        />

        <CategoryFilters
          taskCategories={taskCategories}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          onClearFilters={handleClearCategoryFilters}
        />

        <SearchBar
          onSearch={handleSearch}
          listings={listings}
          loading={loading}
        />

        <ListingsContainer
          listings={finalListings}
          baseFilteredListings={baseFilteredListings}
          statusFilter={statusFilter}
          expandedListing={expandedListing}
          listingReviews={listingReviews}
          userNames={userNames}
          onStatusFilterChange={handleStatusFilterChange}
          onExpandListing={handleExpandListing}
          user={user}
          onUpdateListing={handleUpdateListing}
          sortOption={sortOption}
          onSortChange={handleSortChange}
        />
      </main>
    </div>
  );
}
