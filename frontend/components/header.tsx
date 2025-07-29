"use client";

import ProfileIcon from "./profile-icon";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

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
  const router = useRouter();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // This completely resets to the root URL, clearing any query params, hash, etc.
    window.location.assign(window.location.origin + '/');
  };

  return (
    <>
    <header className="row-start-1 flex gap-6 flex-wrap items-center justify-between w-full">
      <div onClick={handleLogoClick} className="flex items-center gap-2 cursor-pointer">
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
                className="cursor-pointer bg-green-500 text-white px-4 py-2 rounded-md  font-medium hover:bg-green-600 transition-colors"
              >
                Create Listing
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

      {/* Bottom right graph icon button */}
      {user && (
        <div className="fixed bottom-13 right-13 z-50">
          <Link href="/graph">
            <button
              className="flex items-center justify-center w-14 h-14 rounded-full border border-blue-300 bg-blue-500/80 backdrop-blur-md cursor-pointer hover:bg-blue-600/90"
              title="View Network Graph"
              aria-label="View Network Graph"
            >
              <BarChart3 className="w-7 h-7 text-white" />
            </button>
          </Link>
        </div>
      )}
    </>
  );
}
