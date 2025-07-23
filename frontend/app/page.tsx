"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import AuthModal from "@/components/auth-modal";
import CategoryFilters from "@/components/category-filters";
import ListingsContainer from "@/components/listings-container";
import LoadingIndicator from "@/components/loading-indicator";
import CreateListingModal from "@/components/create-listing-modal";

export default function Home() {
  const [taskCategories, setTaskCategories] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [expandedListing, setExpandedListing] = useState<number | null>(null);
  const [listingReviews, setListingReviews] = useState<{
    [key: number]: any[];
  }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [userNames, setUserNames] = useState<{ [key: number]: string }>({});

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    contact: "", // Email/phone_number
    password: "",
  });

  const [showCreateListingModal, setShowCreateListingModal] = useState(false);

  // Use localStorage to check if user is logged in
  useEffect(() => {
    const savedUser = localStorage.getItem("tungTungUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleGetTaskCategories = async () => {
    try {
      const response = await fetch("http://localhost:8080/taskcategories");
      const data = await response.json();
      setTaskCategories(data);
    } catch (error) {
      console.error("Error fetching task categories:", error);
    }
  };

  const handleGetListings = async () => {
    try {
      const response = await fetch("http://localhost:8080/listings");
      const data = await response.json();
      setListings(data);
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([handleGetTaskCategories(), handleGetListings()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const toggleCategory = async (categoryName: string) => {
    const updated = selectedCategories.includes(categoryName)
      ? selectedCategories.filter((c) => c !== categoryName)
      : [...selectedCategories, categoryName];

    setSelectedCategories(updated);

    if (updated.length === 0) {
      await handleGetListings(); // Reset to all listings
    } else {
      // Manually fetch filtered listings
      const params = new URLSearchParams();
      updated.forEach((cat) => params.append("categories", cat));

      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/listings/filter?${params.toString()}`);
        const data = await response.json();
        setListings(data);
      } catch (error) {
        console.error("Error fetching filtered listings:", error);
      } finally {
        setLoading(false);
      }
    }
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
        setShowAuthModal(false);
        setAuthForm({ name: "", email: "", phone_number: "", contact: "", password: "" });
      } else {
        alert(data.error || "Authentication failed");
      }
    } catch (error) {
      alert("Network error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("tungTungUser");
    setUser(null);
  };

  const handleAuthFormChange = (field: string, value: string) => {
    setAuthForm(prev => ({ ...prev, [field]: value }));
  };

  const handleClearCategoryFilters = async () => {
    setSelectedCategories([]);
    await handleGetListings();
  };

  // Fetch user name by UID
  const fetchUserName = async (uid: number) => {
    if (userNames[uid]) {
      return userNames[uid];
    }

    try {
      const response = await fetch(`http://localhost:8080/users/${uid}/name`);
      const name = await response.text();
      setUserNames((prev) => ({
        ...prev,
        [uid]: name,
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
        const response = await fetch(
          `http://localhost:8080/listings/${listingId}/reviews`
        );
        const reviews = await response.json();

        const uniqueUIDs = new Set();
        interface Review {
          reviewer_uid: number;
          reviewee_uid: number;
          rating?: number;
          comment?: string;
          timestamp?: string;
        }

        reviews.forEach((review: Review) => {
          if (review.reviewer_uid) uniqueUIDs.add(review.reviewer_uid);
          if (review.reviewee_uid) uniqueUIDs.add(review.reviewee_uid);
        });

        // Fetch names for all unique UIDs
        const namePromises = Array.from(uniqueUIDs).map((uid) =>
          fetchUserName(uid as number)
        );
        await Promise.all(namePromises);

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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(listingData)
      });

      const data = await response.json();

      if (response.ok) {
        alert("Listing created successfully!");
        setShowCreateListingModal(false);
        await handleGetListings();
      } else {
        alert(data.error || "Failed to create listing");
      }
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("Network error. Please try again.");
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Header 
        user={user}
        onShowAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onShowCreateListing={user ? () => setShowCreateListingModal(true) : undefined}
      />
      
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <AuthModal
          showAuthModal={showAuthModal}
          isSignup={isSignup}
          authForm={authForm}
          onClose={() => setShowAuthModal(false)}
          onToggleMode={() => setIsSignup(!isSignup)}
          onFormChange={handleAuthFormChange}
          onSubmit={handleAuth}
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

        <ListingsContainer
          listings={listings}
          statusFilter={statusFilter}
          expandedListing={expandedListing}
          listingReviews={listingReviews}
          userNames={userNames}
          onStatusFilterChange={setStatusFilter}
          onExpandListing={handleExpandListing}
        />
      </main>
    </div>
  );
}
