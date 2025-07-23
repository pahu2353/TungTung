"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface CreateListingModalProps {
  showModal: boolean;
  taskCategories: any[];
  user: any;
  onClose: () => void;
  onSubmit: (listingData: any) => Promise<void>;
}

export default function CreateListingModal({
  showModal,
  taskCategories,
  user,
  onClose,
  onSubmit
}: CreateListingModalProps) {
  const [formData, setFormData] = useState({
    listing_name: "",
    description: "",
    price: "",
    capacity: "1",
    duration: "",
    address: "",
    selectedCategories: [] as number[]
  });

  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [deadlineTime, setDeadlineTime] = useState("12:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (formData.address.trim().length > 3) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}`)
          .then(res => res.json())
          .then(data => setSuggestions(data))
          .catch(err => console.error("Error fetching address suggestions", err));
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [formData.address]);

  const handleSelectSuggestion = (suggestion: any) => {
    setFormData(prev => ({ ...prev, address: suggestion.display_name }));
    setSelectedCoords({ lat: parseFloat(suggestion.lat), lon: parseFloat(suggestion.lon) });
    setSuggestions([]);
  };

  if (!showModal) return null;

  const handleInputChange = (field: string, value: string | number[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryToggle = (categoryId: number) => {
    const isSelected = formData.selectedCategories.includes(categoryId);
    const updated = isSelected
      ? formData.selectedCategories.filter(id => id !== categoryId)
      : [...formData.selectedCategories, categoryId];
    
    handleInputChange("selectedCategories", updated);
  };

 const getMinDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

  const getMinDeadline = () => {
    const now = new Date();
    if (formData.duration) {
      const durationMinutes = parseInt(formData.duration);
      now.setMinutes(now.getMinutes() + durationMinutes);
    }
    return now;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoords) {
      alert("Please select a valid address from the dropdown suggestions.");
      return;
    }

    if (formData.selectedCategories.length === 0) {
      alert("Please select at least one category");
      return;
    }

    if (!deadline) {
      alert("Please select a deadline date");
      return;
    }

    const [hours, minutes] = deadlineTime.split(':').map(Number);
    const deadlineDateTime = new Date(deadline);
    deadlineDateTime.setHours(hours, minutes, 0, 0);

    if (formData.duration) {
      const minDeadline = getMinDeadline();
      
      if (deadlineDateTime <= minDeadline) {
        alert(`Deadline must be at least ${formData.duration} minutes from now`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const listingData = {
        listing_name: formData.listing_name,
        description: formData.description,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity),
        duration: parseInt(formData.duration),
        deadline: deadlineDateTime.toISOString(),
        address: formData.address,
        longitude: selectedCoords.lon,
        latitude: selectedCoords.lat,
        poster_uid: user.uid,
        category_ids: formData.selectedCategories
      };

      await onSubmit(listingData);
      
      setFormData({
        listing_name: "",
        description: "",
        price: "",
        capacity: "1",
        duration: "",
        address: "",
        selectedCategories: []
      });
      setDeadline(undefined);
      setDeadlineTime("12:00");
      setSelectedCoords(null);
    } catch (error) {
      console.error("Error creating listing:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      listing_name: "",
      description: "",
      price: "",
      capacity: "1",
      duration: "",
      address: "",
      selectedCategories: []
    });
    setDeadline(undefined);
    setDeadlineTime("12:00");
    setSelectedCoords(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Listing</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Listing Name *</label>
            <input
              type="text"
              value={formData.listing_name}
              onChange={(e) => handleInputChange("listing_name", e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Number of People Needed *</label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => handleInputChange("capacity", e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes) *</label>
              <input
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Deadline *</label>
              <div className="space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={setDeadline}
                      disabled={(date) => date < getMinDate()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {formData.duration && (
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least {formData.duration} minutes from now
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {suggestions.length > 0 && (
              <ul className="border mt-2 rounded-md bg-white max-h-40 overflow-auto text-sm">
                {suggestions.map((sugg, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelectSuggestion(sugg)}
                    className="p-2 hover:bg-blue-100 cursor-pointer"
                  >
                    {sugg.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Categories * (Select at least one)
            </label>
            <div className="flex flex-wrap gap-2">
              {taskCategories.map((category) => {
                const isSelected = formData.selectedCategories.includes(category.category_id);
                return (
                  <button
                    key={category.category_id}
                    type="button"
                    onClick={() => handleCategoryToggle(category.category_id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                      isSelected
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {category.category_name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}