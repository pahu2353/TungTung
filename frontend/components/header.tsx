"use client";

interface User {
  name: string;
  uid: number;
  email?: string;
  phone_number?: string;
}

interface HeaderProps {
  user: User | null;
  onShowAuthModal: () => void;
  onLogout: () => void;
}

export default function Header({ user, onShowAuthModal, onLogout }: HeaderProps) {
  return (
    <header className="w-full flex justify-between items-center mb-8">
      <div className="text-left">
        <h1 className="text-4xl font-bold">TungTung.</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">
          Get what you need done.
        </p>
      </div>
      
      <div>
        {user ? (
          <div className="flex items-center gap-2">
            <span>Welcome, {user.name}!</span>
            <button 
              onClick={onLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={onShowAuthModal}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Login / Sign Up
          </button>
        )}
      </div>
    </header>
  );
}
