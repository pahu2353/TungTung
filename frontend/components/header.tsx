"use client";

import ProfileIcon from "./profile-icon";

interface User {
  name: string;
  uid: number;
  email?: string;
  phone_number?: string;
}

interface HeaderProps {
  user: any;
  onShowAuthModal: () => void;
  onLogout: () => void;
  onShowCreateListing?: () => void;
}

export default function Header({ 
  user, 
  onShowAuthModal, 
  onLogout,
  onShowCreateListing 
}: HeaderProps) {
  return (
    <header className="row-start-1 flex gap-6 flex-wrap items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
          T
        </div>
        <span className="text-xl font-bold">TungTung</span>
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-600">
              Welcome, {user.name}!
            </span>
            <ProfileIcon 
              profilePicture={user.profile_picture || "https://placecats.com/300/300"} 
              onLogout={onLogout} 
            />
            {onShowCreateListing && (
              <button
                onClick={onShowCreateListing}
                className="bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
              >
                + New Listing
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onShowAuthModal}
            className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            Login/Signup
          </button>
        )}
      </div>
    </header>
  );
}
