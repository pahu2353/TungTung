"use client"

import { useEffect } from "react"; // Add useEffect import
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Wrench, NotebookPen, House, Star, MapPin, Clock, DollarSign, Calendar, User, Mail, Phone } from "lucide-react";
import { useUser } from "../UserContext";

export default function ProfilePage() {
  const { user, setUser } = useUser();

  useEffect(() => {
    const savedUser = localStorage.getItem("tungTungUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, [setUser]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your profile</h1>
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  const listingsCreated = [
    {
      id: 1,
      listingName: "Deep House Cleaning Service",
      description: "Professional deep cleaning for 3-bedroom apartments",
      price: 85.00,
      capacity: 2,
      duration: 180, // minutes
      address: "Downtown Toronto, ON",
      status: "completed",
      category: "Cleaning",
      postingTime: "2024-07-15T10:30:00Z",
      deadline: "2024-07-20T18:00:00Z",
      earnings: 85.00
    },
    {
      id: 2,
      listingName: "Math Tutoring Sessions",
      description: "High school calculus and algebra tutoring",
      price: 40.00,
      capacity: 1,
      duration: 60,
      address: "University District, Waterloo, ON",
      status: "open",
      category: "Education",
      postingTime: "2024-07-20T14:00:00Z",
      deadline: "2024-08-15T20:00:00Z",
      earnings: 0
    },
    {
      id: 3,
      listingName: "Garden Landscaping Project",
      description: "Complete backyard garden redesign and planting",
      price: 320.00,
      capacity: 3,
      duration: 480,
      address: "Uptown Waterloo, ON",
      status: "taken",
      category: "Landscaping",
      postingTime: "2024-07-18T09:15:00Z",
      deadline: "2024-07-25T17:00:00Z",
      earnings: 320.00
    }
  ];

  const listingsAssigned = [
    {
      id: 4,
      listingName: "Emergency Plumbing Repair",
      description: "Fix leaking kitchen sink and replace faucet",
      price: 120.00,
      duration: 120,
      address: "King Street, Waterloo, ON",
      status: "completed",
      category: "Home Repair",
      assignedTime: "2024-07-10T08:00:00Z",
      completedTime: "2024-07-10T11:30:00Z",
      earnings: 120.00
    },
    {
      id: 5,
      listingName: "Pet Sitting - Golden Retriever",
      description: "Weekend pet sitting for friendly golden retriever",
      price: 75.00,
      duration: 2880, // 48 hours
      address: "Beechwood, Waterloo, ON",
      status: "completed",
      category: "Pet Care",
      assignedTime: "2024-07-12T18:00:00Z",
      completedTime: "2024-07-14T18:00:00Z",
      earnings: 75.00
    },
    {
      id: 6,
      listingName: "Moving Assistance",
      description: "Help with packing and loading moving truck",
      price: 95.00,
      duration: 240,
      address: "Columbia Street, Waterloo, ON",
      status: "in_progress",
      category: "Moving",
      assignedTime: "2024-07-22T07:00:00Z",
      earnings: 0
    }
  ];

  // const reviews = [
  //   {
  //     id: 1,
  //     listingName: "Deep House Cleaning Service",
  //     reviewerName: "Michael Chen",
  //     rating: 5,
  //     comment: "Absolutely fantastic work! Sarah was thorough, professional, and left my apartment spotless. Highly recommend!",
  //     timestamp: "2024-07-16T15:30:00Z"
  //   },
  //   {
  //     id: 2,
  //     listingName: "Emergency Plumbing Repair",
  //     reviewerName: "Jennifer Park",
  //     rating: 5,
  //     comment: "Sarah fixed my plumbing issue quickly and efficiently. Great communication and fair pricing.",
  //     timestamp: "2024-07-10T16:45:00Z"
  //   },
  //   {
  //     id: 3,
  //     listingName: "Pet Sitting - Golden Retriever",
  //     reviewerName: "David Wilson",
  //     rating: 4,
  //     comment: "Max loved Sarah! She sent regular updates and took great care of him. Very reliable.",
  //     timestamp: "2024-07-15T10:20:00Z"
  //   }
  // ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'taken': return 'bg-orange-100 text-orange-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 1440) {
      return `${Math.floor(minutes / 1440)} days`;
    } else if (minutes >= 60) {
      return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center text-navy-600 hover:text-navy-800 transition-colors">
            <House className="w-6 h-6 text-blue-900" />
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Profile Header */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <Avatar className="w-24 h-24 ring-4 ring-blue-100">
                <AvatarImage src={user.profile_picture} />
                <AvatarFallback className="text-2xl font-semibold bg-blue-500 text-white">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{user.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {/* hard coded overall rating for now */}
                    <span className="font-semibold">{user.overall_rating ?? 0}</span>
                    <span className="text-gray-500 text-sm">({user.reviews && user.reviews.length} reviews)</span>
                  </div>
                </div>
              </div>
              
              {/* hard coded numbers for user stats at the moment */}
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(user.total_earnings ?? 0)}</p>
                  <p className="text-sm text-gray-500">Total Earned</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">7</p>
                  <p className="text-sm text-gray-500">Jobs Completed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Posted */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <NotebookPen className="w-5 h-5" />
              Services Posted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {listingsCreated.map((listing) => (
              <div key={listing.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{listing.listingName}</h3>
                    <p className="text-gray-600 text-sm mt-1">{listing.description}</p>
                  </div>
                  <Badge className={getStatusColor(listing.status)}>
                    {listing.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="font-medium">{formatCurrency(listing.price)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>{formatDuration(listing.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="truncate">{listing.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4 text-purple-500" />
                    <span>Capacity: {listing.capacity}</span>
                  </div>
                </div>
                
                {listing.earnings > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-green-600 font-medium">Earned: {formatCurrency(listing.earnings)}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Services Completed */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Assigned to You
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {listingsAssigned.map((listing) => (
              <div key={listing.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{listing.listingName}</h3>
                    <p className="text-gray-600 text-sm mt-1">{listing.description}</p>
                  </div>
                  <Badge className={getStatusColor(listing.status)}>
                    {listing.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="font-medium">{formatCurrency(listing.price)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>{formatDuration(listing.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="truncate">{listing.address}</span>
                  </div>
                </div>
                
                {listing.earnings > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-green-600 font-medium">Earned: {formatCurrency(listing.earnings)}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Star className="w-5 h-5" />
              Recent Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {user.reviews && user.reviews.map((review: any) => (
              <div key={review.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{review.listingName}</h4>
                    <p className="text-sm text-gray-600">by {review.reviewerName}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                <p className="text-xs text-gray-500">
                  {new Date(review.timestamp).toLocaleDateString()}
                </p>
                <Separator />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
