"use client";

import { useState } from "react";
import { X, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: number;
  listingName: string;
  assignedUsers: Array<{
    uid: number;
    name: string;
    profile_picture?: string;
  }>;
  reviewerUid: number;
  onSubmitReview: (review: {
    listid: number;
    reviewer_uid: number;
    reviewee_uid: number;
    rating: number;
    comment: string;
  }) => Promise<void>;
}

export default function ReviewModal({
  isOpen,
  onClose,
  listingId,
  listingName,
  assignedUsers,
  reviewerUid,
  onSubmitReview,
}: ReviewModalProps) {
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  if (!isOpen || assignedUsers.length === 0) return null;

  const currentUser = assignedUsers[currentUserIndex];
  const totalUsers = assignedUsers.length;
  const isFirstUser = currentUserIndex === 0;
  const isLastUser = currentUserIndex === totalUsers - 1;

  const handleNext = async () => {
    if (rating > 0) {
      setIsSubmitting(true);
      try {
        await onSubmitReview({
          listid: listingId,
          reviewer_uid: reviewerUid,
          reviewee_uid: currentUser.uid,
          rating,
          comment,
        });
        
        // Reset form for next user
        setRating(0);
        setComment("");
        
        // Move to next user or close if last
        if (isLastUser) {
          onClose();
        } else {
          setCurrentUserIndex(currentUserIndex + 1);
        }
      } catch (error) {
        console.error("Error submitting review:", error);
        alert("Failed to submit review. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      alert("Please select a rating before submitting");
    }
  };

  const handlePrevious = () => {
    if (currentUserIndex > 0) {
      setCurrentUserIndex(currentUserIndex - 1);
      setRating(0);
      setComment("");
    }
  };

  const handleSkip = () => {
    if (isLastUser) {
      onClose();
    } else {
      setCurrentUserIndex(currentUserIndex + 1);
      setRating(0);
      setComment("");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Rate Your Experience</h2>
          <p className="text-sm text-gray-600 mt-1">
            {listingName} ({currentUserIndex + 1}/{totalUsers})
          </p>
        </div>

        <div className="flex flex-col items-center mb-6">
          <Avatar className="w-20 h-20 mb-4">
            <AvatarImage src={currentUser.profile_picture || "https://placecats.com/300/300"} />
            <AvatarFallback className="bg-blue-500 text-white text-xl">
              {getInitials(currentUser.name)}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-lg font-medium">{currentUser.name}</h3>
        </div>

        <div className="mb-6">
          <div className="flex justify-center space-x-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredStar || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm font-medium text-gray-700 mb-2">
            {rating > 0 ? `You rated: ${rating}/5` : "Select a rating"}
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
            Comments (optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Share your experience working with this person..."
          ></textarea>
        </div>

        <div className="flex justify-between">
          <div>
            {!isFirstUser && (
              <button
                onClick={handlePrevious}
                className="flex items-center text-blue-600 hover:text-blue-800"
                disabled={isSubmitting}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              disabled={isSubmitting}
            >
              Skip
            </button>
            
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : isLastUser ? "Finish" : "Next"}
              {!isLastUser && !isSubmitting && <ChevronRight className="w-4 h-4 ml-1" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
