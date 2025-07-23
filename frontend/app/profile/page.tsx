"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Wrench, NotebookPen, House, Star, MapPin, Clock, DollarSign, Calendar, User, Mail, Phone } from "lucide-react";
import { useUser } from "../UserContext";
import { useRouter, useSearchParams } from "next/navigation";
import ReviewModal from "@/components/review-modal";

export default function ProfilePage() {
  const { user, setUser } = useUser();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentListingForReview, setCurrentListingForReview] = useState<any>(null);
  const [assignedUsersForReview, setAssignedUsersForReview] = useState<any[]>([]);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const uidParam = searchParams.get('uid');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First try to get a user from context or localStorage
        let currentUser = user;
        if (!currentUser) {
          const savedUser = localStorage.getItem("tungTungUser");
          if (savedUser) {
            currentUser = JSON.parse(savedUser);
            setUser(currentUser);
          }
        }
        
        // If there's a uid in the URL, use that; otherwise use the logged-in user
        const targetUid = uidParam || (currentUser ? currentUser.uid : null);
        
        if (!targetUid) {
          setError("Please log in to view profiles");
          setLoading(false);
          return;
        }
        
        // Fetch profile data for the target user
        const response = await fetch(`http://localhost:8080/profile/${targetUid}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }
        
        const data = await response.json();
        setProfileData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [uidParam, user, setUser]);

  const handleSubmitReview = async (review: any) => {
    try {
      const response = await fetch("http://localhost:8080/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(review),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      return data;
    } catch (error) {
      console.error("Error submitting review:", error);
      throw error;
    }
  };

  const handleMarkComplete = async (listingId: number) => {
    try {
      const response = await fetch(`http://localhost:8080/listings/${listingId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ poster_uid: user?.uid }),
      });

      const message = await response.text();

      if (response.ok) {
        // Update the listing status locally
        const updatedListing = createdListings.find(listing => listing.listid === listingId);
        const updatedCreatedListings = createdListings.map(listing => 
          listing.listid === listingId ? { ...listing, status: 'completed' } : listing
        );
        
        // Update the state with the new listings data
        setProfileData({
          ...profileData,
          created_listings: updatedCreatedListings
        });
        
        alert("Task marked as complete!");
        
        const assignedResponse = await fetch(`http://localhost:8080/listings/${listingId}/assigned-users`);
        if (assignedResponse.ok) {
          const assignedUsers = await assignedResponse.json();
          if (assignedUsers && assignedUsers.length > 0) {
            setCurrentListingForReview({
              listid: listingId,
              listing_name: updatedListing?.listing_name || `Listing #${listingId}`
            });
            setAssignedUsersForReview(assignedUsers);
            setShowReviewModal(true);
          }
        }
      } else {
        alert(message || "Failed to mark task as complete");
      }
    } catch (error) {
      console.error("Error marking task as complete:", error);
      alert("An error occurred. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading profile...</h1>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || "Please log in to view profiles"}</h1>
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'taken': return 'bg-orange-100 text-orange-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount || 0);
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 1440) {
      return `${Math.floor(minutes / 1440)} days`;
    } else if (minutes >= 60) {
      return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const createdListings = profileData.created_listings || [];
  const assignedListings = profileData.assigned_listings || [];
  const reviews = profileData.reviews || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center text-navy-600 hover:text-navy-800 transition-colors">
            <House className="w-6 h-6 text-blue-900" />
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Profile Header */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <Avatar className="w-24 h-24 ring-4 ring-blue-100">
                  <AvatarImage src={profileData.profile_picture} />
                  <AvatarFallback className="text-2xl font-semibold bg-blue-500 text-white">
                    {profileData.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{profileData.name}</h1>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {profileData.email && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{profileData.email}</span>
                      </div>
                    )}
                    {profileData.phone_number && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{profileData.phone_number}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{profileData.overall_rating ?? 0}</span>
                      <span className="text-gray-500 text-sm">({reviews.length} reviews)</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(profileData.total_earnings ?? 0)}</p>
                    <p className="text-sm text-gray-500">Total Earned</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{assignedListings.filter((l: any) => l.status === 'completed').length}</p>
                    <p className="text-sm text-gray-500">Jobs Completed</p>
                </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {user.preferences && user.preferences.map((category: string, index: number) => {
                  return (
                    <div
                      key={index}
                      className={`flex-shrink-0 h-10 px-4 flex items-center rounded-full border transition-colors ${
                        'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <span className="text-sm font-medium whitespace-nowrap">
                        {category}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Posted */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <NotebookPen className="w-5 h-5" />
              Services Posted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {createdListings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No services posted yet</p>
            ) : (
              createdListings.map((listing: any) => (
                <div key={listing.listid} className="space-y-3">
                    <button
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow focus:outline-none cursor-pointer"
                    onClick={() => {
                        router.push(`/?search=${encodeURIComponent(listing.listing_name)}&expand=${listing.listid}`);
                    }}
                    >
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{listing.listing_name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{listing.description}</p>
                        </div>
                        <Badge className={getStatusColor(listing.status)}>
                        {listing.status.replace('_', ' ')}
                        </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="font-medium">{formatCurrency(listing.price)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>{formatDuration(listing.duration)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="truncate">{listing.address}</span>
                        </div>
                        <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-purple-500" />
                        <span>Capacity: {listing.capacity}</span>
                        </div>
                    </div>
                    </button>
                    
                    {/* Mark as complete button - now properly outside the clickable area */}
                    {user && user.uid === profileData.uid && listing.status === 'taken' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <button 
                        onClick={() => handleMarkComplete(listing.listid)}
                        className="cursor-pointer px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="w-4 h-4" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Mark as Complete
                        </button>
                    </div>
                    )}
                </div>
                ))
            )}
          </CardContent>
        </Card>

        {/* Services Completed */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Assigned to {user && user.uid === profileData.uid ? 'You' : profileData.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedListings.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No services assigned yet</p>
            ) : (
              assignedListings.map((listing: any) => (
                <div key={listing.listid} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{listing.listing_name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{listing.description}</p>
                    </div>
                    <Badge className={getStatusColor(listing.status)}>
                      {listing.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-medium">{formatCurrency(listing.price)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>{formatDuration(listing.duration)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="truncate">{listing.address}</span>
                    </div>
                  </div>
                  
                  {listing.status === 'completed' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-green-600 font-medium">Earned: {formatCurrency(listing.price)}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Star className="w-5 h-5" />
              Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No reviews yet</p>
            ) : (
              reviews.map((review: any, index: number) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Review for <span className="text-blue-600">{review.listing_name}</span>
                      </h4>
                      <p className="text-sm text-gray-600">
                        by <span className="font-medium">{review.reviewer_name}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(review.timestamp).toLocaleDateString()}
                  </p>
                  {index < reviews.length - 1 && <Separator />}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        listingId={currentListingForReview?.listid}
        listingName={currentListingForReview?.listing_name}
        assignedUsers={assignedUsersForReview}
        reviewerUid={user?.uid}
        onSubmitReview={handleSubmitReview}
      />
    </div>
  );
}
