"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { debounce } from "lodash";

interface SearchBarProps {
  onSearch: (query: string) => void;
  listings: any[];
  loading?: boolean;
}

interface SearchSuggestion {
  type: 'listing' | 'category' | 'location';
  text: string;
  listingId?: number;
  category?: string;
  location?: string;
}

export default function SearchBar({ onSearch, listings, loading = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // The search is debounced to make it more efficient
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      onSearch(searchQuery);
    }, 300),
    [onSearch]
  );

  const generateSuggestions = useCallback((searchQuery: string): SearchSuggestion[] => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];

    const lowercaseQuery = searchQuery.toLowerCase();
    const suggestions: SearchSuggestion[] = [];
    const addedTexts = new Set<string>();

    // Search in listing names + descriptions
    listings.forEach((listing) => {
      const nameMatch = listing.listing_name?.toLowerCase().includes(lowercaseQuery);
      const descMatch = listing.description?.toLowerCase().includes(lowercaseQuery);
      
      if (nameMatch) {
        const suggestionText = listing.listing_name;
        if (!addedTexts.has(suggestionText.toLowerCase())) {
          suggestions.push({
            type: 'listing',
            text: suggestionText,
            listingId: listing.listid
          });
          addedTexts.add(suggestionText.toLowerCase());
        }
      }
      
      if (descMatch && !nameMatch) {
        const suggestionText = `${listing.listing_name} - ${listing.description?.substring(0, 50)}...`;
        if (!addedTexts.has(listing.listing_name.toLowerCase())) {
          suggestions.push({
            type: 'listing',
            text: suggestionText,
            listingId: listing.listid
          });
          addedTexts.add(listing.listing_name.toLowerCase());
        }
      }
    });

    // Search in locations + addresses
    const locationMatches = new Set<string>();
    listings.forEach((listing) => {
      if (listing.address?.toLowerCase().includes(lowercaseQuery)) {
        // Main location — WIP until we get Places API
        const addressParts = listing.address.split(',');
        const mainLocation = addressParts[addressParts.length - 1]?.trim() || listing.address;
        if (!locationMatches.has(mainLocation.toLowerCase())) {
          locationMatches.add(mainLocation.toLowerCase());
          suggestions.push({
            type: 'location',
            text: `Near ${mainLocation}`,
            location: mainLocation
          });
        }
      }
    });

    // Category keywords
    const keywords = [
      'cleaning', 'tutoring', 'gardening', 'cooking', 'tech', 'repair', 
      'assembly', 'painting', 'moving', 'delivery', 'pet', 'babysitting'
    ];
    
    keywords.forEach(keyword => {
      if (keyword.includes(lowercaseQuery) && !addedTexts.has(keyword)) {
        const matchingListings = listings.filter(listing => 
          listing.listing_name?.toLowerCase().includes(keyword) ||
          listing.description?.toLowerCase().includes(keyword)
        );
        
        if (matchingListings.length > 0) {
          suggestions.push({
            type: 'category',
            text: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} services`,
            category: keyword
          });
          addedTexts.add(keyword);
        }
      }
    });

    // max 8 suggestions for better performance
    return suggestions.slice(0, 8);
  }, [listings]);

  useEffect(() => {
    const newSuggestions = generateSuggestions(query);
    setSuggestions(newSuggestions);
    setSelectedIndex(-1);
  }, [query, generateSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
    
    debouncedSearch(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        searchRef.current?.blur();
        break;
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    let searchTerm = "";
    
    switch (suggestion.type) {
      case 'listing':
        searchTerm = suggestion.text.includes(' - ') 
          ? suggestion.text.split(' - ')[0] 
          : suggestion.text;
        break;
      case 'category':
        searchTerm = suggestion.category || suggestion.text;
        break;
      case 'location':
        searchTerm = suggestion.location || suggestion.text;
        break;
    }
    
    setQuery(searchTerm);
    setShowSuggestions(false);
    onSearch(searchTerm);
    searchRef.current?.blur();
  };

  const handleSearch = () => {
    setShowSuggestions(false);
    onSearch(query);
    searchRef.current?.blur();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    onSearch("");
    searchRef.current?.focus();
  };

  return (
    <div className="relative w-full flex justify-center mb-6">
      <div className="relative w-full max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(query.length >= 2)}
          placeholder="Search listings, locations, or services..."
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white shadow-sm"
        />
        
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-8 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        <button
          onClick={handleSearch}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-500 hover:text-blue-700"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
        
        {loading && (
          <div className="absolute inset-y-0 right-12 flex items-center pr-3">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full max-w-2xl mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    {suggestion.type === 'listing' && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                    {suggestion.type === 'category' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    {suggestion.type === 'location' && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {suggestion.text}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {suggestion.type}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
