
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MessageSquare, Clock, Calendar as CalendarIcon, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTutorBookings, confirmBooking, cancelBooking, completeBooking } from "@/services/booking.service";
import { toast } from "@/hooks/use-toast";
import { format, parseISO, isPast } from "date-fns";

interface Booking {
  id: string;
  student_id: string;
  subject: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number;
  profiles: {
    full_name: string;
    profile_image: string;
  };
}

const TutorBookingsPage = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>("pending");
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
      console.log("Fetching bookings for tutor:", user.id);
      const data = await getTutorBookings(user.id);
      console.log("Bookings data received:", data);
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

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      await confirmBooking(bookingId);
      await loadBookings();
      
      toast({
        title: "Booking accepted",
        description: "The lesson has been added to your schedule."
      });
    } catch (error) {
      console.error("Failed to accept booking:", error);
      toast({
        title: "Error",
        description: "Failed to accept booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      await loadBookings();
      
      toast({
        title: "Booking declined",
        description: "The lesson request has been declined."
      });
    } catch (error) {
      console.error("Failed to decline booking:", error);
      toast({
        title: "Error",
        description: "Failed to decline booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      await completeBooking(bookingId);
      await loadBookings();
      
      toast({
        title: "Lesson completed",
        description: "The lesson has been marked as completed."
      });
    } catch (error) {
      console.error("Failed to mark booking as completed:", error);
      toast({
        title: "Error",
        description: "Failed to complete booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter bookings based on selected tab
  const filteredBookings = bookings.filter((booking) => {
    if (selectedTab === "pending") {
      return booking.status === "pending";
    } else if (selectedTab === "upcoming") {
      return booking.status === "confirmed" && !isPast(new Date(booking.end_time));
    } else if (selectedTab === "completed") {
      return booking.status === "completed" || (booking.status === "confirmed" && isPast(new Date(booking.end_time)));
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
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'h:mm a');
    } catch (e) {
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
      return 60; // Default to 60 minutes if there's an error
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500">Pending</Badge>;
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

      <Tabs defaultValue="pending" onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        {["pending", "upcoming", "completed", "cancelled"].map((tabValue) => (
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
                    {tabValue === "pending"
                      ? "You don't have any pending lesson requests."
                      : tabValue === "upcoming"
                      ? "You don't have any upcoming lessons scheduled."
                      : tabValue === "completed"
                      ? "You haven't completed any lessons yet."
                      : "You don't have any cancelled lessons."}
                  </p>
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
                          <AvatarFallback>{booking.profiles?.full_name?.charAt(0) || 'S'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-lg mb-1">
                            {booking.subject} with {booking.profiles?.full_name || "Student"}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500">
                            <div className="flex items-center mr-4">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              <span>{formatDate(booking.start_time)}</span>
                            </div>
                            <div className="flex items-center mr-4">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>
                                {formatTime(booking.start_time)} - {formatTime(booking.end_time)} ({calculateDuration(booking.start_time, booking.end_time)} mins)
                              </span>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <div className="text-right mr-4">
                          <div className="font-medium">${booking.price}</div>
                          <div className="text-xs text-gray-500">Earnings</div>
                        </div>
                        
                        {booking.status === "pending" && (
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleAcceptBooking(booking.id)}
                            >
                              <Check className="h-4 w-4 mr-1" /> Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleDeclineBooking(booking.id)}
                            >
                              <X className="h-4 w-4 mr-1" /> Decline
                            </Button>
                          </div>
                        )}
                        
                        {booking.status === "confirmed" && (
                          <div className="flex space-x-2">
                            {isPast(new Date(booking.end_time)) ? (
                              <Button 
                                size="sm"
                                onClick={() => handleCompleteBooking(booking.id)}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Mark Complete
                              </Button>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" asChild>
                                  <Link to={`/tutor/messages?student=${booking.student_id}`}>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Message
                                  </Link>
                                </Button>
                                <Button size="sm" asChild>
                                  <Link to={`/lesson/${booking.id}`}>
                                    Join Lesson
                                  </Link>
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                        
                        {booking.status === "completed" && (
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/tutor/messages?student=${booking.student_id}`}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message
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

export default TutorBookingsPage;
