import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MessageSquare, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStudentBookings, cancelBooking } from "@/services/booking.service";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

interface Tutor {
  id: string;
  full_name: string;
  profile_image: string;
}

interface Booking {
  id: string;
  tutor_id: string;
  subject: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number;
  profiles: Tutor;
}

const StudentBookingsPage = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      console.log("Fetching bookings for user:", user.id);
      const data = await getStudentBookings(user.id);
      console.log("Bookings data:", data);
      setBookings(data || []);
    } catch (error) {
      console.error("Failed to load bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load your bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been successfully cancelled",
      });
      loadBookings();
    } catch (error) {
      console.error("Failed to cancel booking:", error);
    }
  };

  // Filter bookings based on selected tab
  const filteredBookings = bookings.filter((booking) => {
    const now = new Date();
    const startTime = new Date(booking.start_time);
    
    if (selectedTab === "upcoming") {
      return (booking.status === "pending" || booking.status === "confirmed") && startTime > now;
    } else if (selectedTab === "completed") {
      return booking.status === "completed";
    } else if (selectedTab === "cancelled") {
      return booking.status === "cancelled";
    }
    return true;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'h:mm a');
    } catch (e) {
      console.error("Error formatting time:", dateString, e);
      return dateString;
    }
  };

  // Calculate duration in minutes
  const calculateDuration = (startTime: string, endTime: string) => {
    try {
      const start = parseISO(startTime);
      const end = parseISO(endTime);
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    } catch (e) {
      console.error("Error calculating duration:", startTime, endTime, e);
      return 60; // Default to 60 minutes if there's an error
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "confirmed":
        return <Badge className="bg-blue-500">Confirmed</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Bookings</h2>
      </div>

      <Tabs defaultValue="upcoming" onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        {["upcoming", "completed", "cancelled"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tutorly-accent"></div>
              </div>
            ) : filteredBookings.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="rounded-full bg-gray-100 h-12 w-12 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-6 w-6 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No {tabValue} bookings</h3>
                  <p className="text-gray-500 mb-4">
                    {tabValue === "upcoming"
                      ? "You don't have any upcoming lessons scheduled."
                      : tabValue === "completed"
                      ? "You haven't completed any lessons yet."
                      : "You don't have any cancelled lessons."}
                  </p>
                  {tabValue === "upcoming" && (
                    <Button asChild>
                      <Link to="/tutors">Find a Tutor</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="flex items-center mb-4 md:mb-0">
                        <Avatar className="h-12 w-12 mr-4">
                          <AvatarImage src={booking.profiles?.profile_image} alt={booking.profiles?.full_name} />
                          <AvatarFallback>{booking.profiles?.full_name?.charAt(0) || "T"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-lg mb-1">
                            {booking.subject} with {booking.profiles?.full_name || "Unknown Tutor"}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500">
                            <div className="flex items-center mr-4">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              <span>{formatDate(booking.start_time)}</span>
                            </div>
                            <div className="flex items-center mr-4">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>
                                {formatTime(booking.start_time)} ({calculateDuration(booking.start_time, booking.end_time)} mins)
                              </span>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <div className="text-right mr-4">
                          <div className="font-medium">${booking.price}</div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                        
                        {(booking.status === "pending" || booking.status === "confirmed") && (
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/student/messages?tutor=${booking.tutor_id}`}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Message
                              </Link>
                            </Button>
                            {booking.status === "confirmed" && (
                              <Button size="sm" asChild>
                                <Link to={`/lesson/${booking.id}`}>Join Lesson</Link>
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                        
                        {booking.status === "completed" && (
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/tutor/${booking.tutor_id}`}>
                              Leave Review
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default StudentBookingsPage;
