"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { House } from "lucide-react";
import { useUser } from "../UserContext";

export default function InfoPage() {
  const { user } = useUser();
  const [postings, setPostings] = useState<{ uid: number; listid: number }[]>([]);
  const [assignments, setAssignments] = useState<{ uid: number; listid: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [users, setUsers] = useState<
    {
      uid: number;
      name: string;
      profile_picture: string;
      email?: string;
      phone_number?: string;
      overall_rating?: number;
    }[]
  >([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Get user's geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
      });
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch postings, assignments, and users (original functionality)
        const postingsRes = await fetch("http://localhost:8080/postings");
        const assignmentsRes = await fetch("http://localhost:8080/assignments");
        const usersRes = await fetch("http://localhost:8080/info/users");

        // Fetch listings with match scores (enhanced functionality)
        const params = new URLSearchParams();
        params.append("sort", "--");
        params.append("search", "");
        params.append("uid", user?.uid?.toString() || "0");
        params.append("latitude", userLocation?.latitude?.toString() || "43.4723");
        params.append("longitude", userLocation?.longitude?.toString() || "-80.5449");
        
        const listingsRes = await fetch(`http://localhost:8080/listings/filterAndSort?${params.toString()}`);

        if (!postingsRes.ok || !assignmentsRes.ok || !listingsRes.ok || !usersRes.ok) {
          throw new Error("Failed to fetch info data");
        }

        const postingsData = await postingsRes.json();
        const assignmentsData = await assignmentsRes.json();
        const listingsData = await listingsRes.json();
        const usersData = await usersRes.json();

        setPostings(postingsData);
        setAssignments(assignmentsData);
        setListings(listingsData);
        setUsers(usersData);

        // Debug: log top 10
        console.log("Listings with match score (first 10):", listingsData.slice(0, 10));
        console.log("Users (first 10):", usersData.slice(0, 10));

        setError(null);
      } catch (err) {
        setError("Failed to load info data");
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch data when user and userLocation are available
    if (user && userLocation) {
      fetchData();
    }
  }, [user, userLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading info data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-blue-700 hover:text-blue-900 transition-colors">
          <House className="w-6 h-6" />
          <span className="ml-2">Back to Home</span>
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-4">Raw Network Data</h1>

      {/* Users Table */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">UID</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Profile Picture</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Phone Number</th>
                <th className="p-2 border">Overall Rating</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 border">{user.uid}</td>
                  <td className="p-2 border">{user.name}</td>
                  <td className="p-2 border">
                    <img src={user.profile_picture} alt="User" className="w-8 h-8 rounded-full" />
                  </td>
                  <td className="p-2 border">{user.email}</td>
                  <td className="p-2 border">{user.phone_number}</td>
                  <td className="p-2 border">{user.overall_rating ?? "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Listings Table with Match Scores */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Listings (with Match Score)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">ListID</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Price</th>
                <th className="p-2 border">Address</th>
                <th className="p-2 border">Match Score</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 border">{listing.listid}</td>
                  <td className="p-2 border">{listing.listing_name}</td>
                  <td className="p-2 border">{listing.status}</td>
                  <td className="p-2 border">{listing.price}</td>
                  <td className="p-2 border">{listing.address}</td>
                  <td className="p-2 border">{listing.match_score?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Postings Table */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Postings (User → Listing)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-blue-100">
                <th className="p-2 border">User UID</th>
                <th className="p-2 border">Listing ID</th>
              </tr>
            </thead>
            <tbody>
              {postings.map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 border">{row.uid}</td>
                  <td className="p-2 border">{row.listid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignments Table */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Assignments (User → Listing)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-teal-100">
                <th className="p-2 border">User UID</th>
                <th className="p-2 border">Listing ID</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 border">{row.uid}</td>
                  <td className="p-2 border">{row.listid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
}
