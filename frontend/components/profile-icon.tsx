import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProfileIconProps {
  profilePicture: string;
  onLogout: () => void;
}

export default function ProfileIcon({ profilePicture, onLogout }: ProfileIconProps) {
  return (
    <div className="relative flex items-center gap-4">
      <Link href="/profile">
        <Avatar className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-blue-400 transition">
          <AvatarImage src={profilePicture} alt="Profile" />
          <AvatarFallback>
            {/* Optionally show initials or a default icon */}
            <span className="text-lg font-semibold">U</span>
          </AvatarFallback>
        </Avatar>
      </Link>
      <button
        onClick={onLogout}
        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}
