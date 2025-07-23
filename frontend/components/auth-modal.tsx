"use client";

import React, { Dispatch, SetStateAction, useState } from "react";

interface TaskCategory {
  category_name: string;
  category_id: number
}
interface AuthModalProps {
  showAuthModal: boolean;
  isSignup: boolean;
  authForm: {
    name: string;
    email: string;
    phone_number: string;
    contact: string;
    password: string;
  };
  isOnboarding: boolean
  onClose: () => void;
  onToggleMode: () => void;
  onFormChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onOnboardingSubmit: (e: React.FormEvent) => void;
  onOnboardingChange: Dispatch<SetStateAction<any[]>>
  setIsOnboarding: Dispatch<SetStateAction<boolean>>
  setShowModal: Dispatch<SetStateAction<boolean>>
  taskCategories: TaskCategory[]
}

export default function AuthModal({
  showAuthModal,
  isSignup,
  authForm,
  onClose,
  onToggleMode,
  onFormChange,
  onSubmit,
  isOnboarding,
  onOnboardingSubmit,
  onOnboardingChange,
  setShowModal,
  setIsOnboarding,
  taskCategories,
}: AuthModalProps) {
  if (!showAuthModal) return null;

  const [selectedCategories, setSelectedCategories] = useState<number[]>([])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">
          {isSignup ? isOnboarding ? "Let's get to know you!" : 'Sign Up' : 'Login'}
          </h2>
          {isOnboarding && <form onSubmit={onOnboardingSubmit}>
            <div className="flex flex-wrap gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {taskCategories.map((category, index) => {
            const isSelected = selectedCategories.includes(category.category_id);

            return (
              <div
                key={index}
                onClick={() => {
                  const isCurrentlySelected = selectedCategories.includes(category.category_id);
                  const updatedCategories = isCurrentlySelected
                    ? selectedCategories.filter(id => id !== category.category_id)
                    : [...selectedCategories, category.category_id];
                  
                  setSelectedCategories(updatedCategories);
                  
                  setTimeout(() => {
                    onOnboardingChange(updatedCategories);
                  }, 0);
                }}
                className={`flex-shrink-0 h-10 px-4 flex items-center rounded-full border cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <span className="text-sm font-medium whitespace-nowrap">
                  {category.category_name}
                </span>
              </div>
            );
          })}
          </div>
          <div className="flex flex-row space-x-5">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
            >
              Submit
            </button>
            <button
              onClick={() => {
                setShowModal(false)
                setIsOnboarding(false)
              }}
              className="flex-1 bg-gray-500 text-white p-2 rounded-md hover:bg-gray-400"
            >
              Skip
            </button>
          </div>
        </form>}
        
        {!isOnboarding && <form onSubmit={onSubmit}>
          {isSignup ? (
            // Signup form
            <>
              <input
                type="text"
                placeholder="Name"
                value={authForm.name}
                onChange={(e) => onFormChange('name', e.target.value)}
                className="w-full p-2 mb-3 border rounded-md dark:bg-gray-700"
                required
              />
              
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => onFormChange('email', e.target.value)}
                className="w-full p-2 mb-3 border rounded-md dark:bg-gray-700"
              />
              
              <input
                type="tel"
                placeholder="Phone Number"
                value={authForm.phone_number}
                onChange={(e) => onFormChange('phone_number', e.target.value)}
                className="w-full p-2 mb-3 border rounded-md dark:bg-gray-700"
              />
              
              <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-3">
                To signup, you need to enter either your email, phone number, or both. You can sign in later using either!
              </p>
            </>
          ) : (
            // Login form
            <>
              <input
                type="text"
                placeholder="Email or Phone Number"
                value={authForm.contact}
                onChange={(e) => onFormChange('contact', e.target.value)}
                className="w-full p-2 mb-3 border rounded-md dark:bg-gray-700"
                required
              />
            </>
          )}
          
          <input
            type="password"
            placeholder="Password"
            value={authForm.password}
            onChange={(e) => onFormChange('password', e.target.value)}
            className="w-full p-2 mb-3 border rounded-md dark:bg-gray-700"
            required
          />
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
            >
              {isSignup ? 'Sign Up' : 'Login'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>}
        
        {!isOnboarding && <p className="text-center mt-4 text-sm">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={onToggleMode}
            className="text-blue-500 hover:underline"
          >
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </p>}
      </div>
    </div>
  );
}
