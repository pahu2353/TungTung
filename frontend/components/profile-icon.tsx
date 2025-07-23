import React from "react";

interface ProfileIconProps {
  profilePicture: string;
  onLogout: () => void;
}

export default function ProfileIcon({ profilePicture, onLogout }: ProfileIconProps) {
  return (
    <div className="relative flex items-center gap-4">
      <img
        src={profilePicture}
        alt="Profile"
        className="w-12 h-12 rounded-full border border-gray-300"
      />
      <button
        onClick={onLogout}
        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}
