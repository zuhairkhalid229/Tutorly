import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, MessageSquare, CreditCard, CheckCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getTutorBookings, confirmBooking, cancelBooking } from "@/services/booking.service";
import { getProfile, checkTutorVerification } from "@/services/profile.service";
import { getUnreadCount } from "@/services/message.service";
import { format, parseISO } from "date-fns";
import { toast } from "@/hooks/use-toast";

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

const TutorDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingLessons, setUpcomingLessons] = useState<Booking[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState({
    isVerified: false,
    subjects: [] as string[]
  });
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [stats, setStats] = useState({
    totalLessons: 0,
    lessonsThisMonth: 0,
    totalEarnings: 0,
    earningsThisMonth: 0,
    rating: 5.0,
    reviews: 0,
  });

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Get tutor profile
      const profile = await getProfile(user!.id);
      setProfileData(profile);
      
      // Get verification status
      const verification = await checkTutorVerification(user!.id);
      setVerificationStatus(verification);
      
      // Get unread message count
      const { unreadCount } = await getUnreadCount(user!.id);
      setUnreadMessageCount(unreadCount);
      
      // Get tutor bookings
      const bookingsData = await getTutorBookings(user!.id);
      
      // Filter for upcoming confirmed and pending lessons
      const now = new Date();
      const upcoming = bookingsData
        .filter((booking: any) => 
          (booking.status === 'confirmed' || booking.status === 'pending') && 
          new Date(booking.start_time) > now
        )
        .sort((a: any, b: any) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
        .slice(0, 3); // Get only next 3 lessons
      
      setUpcomingLessons(upcoming);
      
      // Calculate statistics
      const completedBookings = bookingsData.filter((booking: any) => booking.status === 'completed');
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const completedThisMonth = completedBookings.filter((booking: any) => {
        const bookingDate = new Date(booking.end_time);
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      });
      
      const totalEarnings = completedBookings.reduce((sum: number, booking: any) => 
        sum + (booking.price || 0), 0);
        
      const earningsThisMonth = completedThisMonth.reduce((sum: number, booking: any) => 
        sum + (booking.price || 0), 0);
      
      setStats({
        totalLessons: completedBookings.length,
        lessonsThisMonth: completedThisMonth.length,
        totalEarnings,
        earningsThisMonth,
        rating: profile.rating || 5.0,
        reviews: Math.floor(Math.random() * 50) // Mock data for now
      });
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please refresh and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      await confirmBooking(bookingId);
      toast({
        title: "Booking Confirmed",
        description: "You have successfully confirmed this booking.",
      });
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error("Error accepting booking:", error);
      toast({
        title: "Error",
        description: "Failed to confirm booking. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      toast({
        title: "Booking Declined",
        description: "You have declined this booking request.",
      });
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error("Error declining booking:", error);
      toast({
        title: "Error",
        description: "Failed to decline booking. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tutorly-accent"></div>
      </div>
    );
  }

  // Calculate verification progress percentage
  const verificationProgress = verificationStatus.isVerified ? 100 : 
    (profileData && profileData.subjects && profileData.subjects.length > 0) ? 80 : 40;

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-tutorly-light-blue p-3 mr-4">
              <Calendar className="h-6 w-6 text-tutorly-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming Lessons</p>
              <h3 className="text-2xl font-bold">{upcomingLessons.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-tutorly-light-blue p-3 mr-4">
              <MessageSquare className="h-6 w-6 text-tutorly-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Unread Messages</p>
              <h3 className="text-2xl font-bold">{unreadMessageCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-tutorly-light-blue p-3 mr-4">
              <CreditCard className="h-6 w-6 text-tutorly-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Earnings (This month)</p>
              <h3 className="text-2xl font-bold">${stats.earningsThisMonth}.00</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Status */}
      <Card className="border border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle>Profile Status</CardTitle>
          <CardDescription>Your profile verification and visibility status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">AI Verification Progress</h4>
                <span className="text-sm text-tutorly-accent font-medium">{verificationProgress}%</span>
              </div>
              <Progress value={verificationProgress} className="h-2" />
            </div>
            
            {verificationStatus.isVerified ? (
              <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <div className="flex items-start">
                  <div className="rounded-full bg-green-100 p-2 mr-4">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-green-800">Verification Complete</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Your profile is verified. You can start receiving booking requests from students.
                    </p>
                    
                    {verificationStatus.subjects && verificationStatus.subjects.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-green-700">Verified subjects:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {verificationStatus.subjects.map((subject, index) => (
                            <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      className="mt-3 border-green-400 text-green-700 hover:bg-green-100"
                      asChild
                    >
                      <Link to="/tutor/test">
                        Verify More Subjects
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                <div className="flex items-start">
                  <div className="rounded-full bg-amber-100 p-2 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-800">Verification Required</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Your profile needs verification. Complete the AI assessment to become fully verified and start teaching.
                    </p>
                    <Button 
                      variant="default"
                      size="sm"
                      className="mt-3 bg-amber-600 hover:bg-amber-700"
                      asChild
                    >
                      <Link to="/tutor/test">
                        Take AI Assessment Now
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Lessons */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Lessons</CardTitle>
          <CardDescription>Your scheduled lessons for the next few days</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingLessons.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">You don't have any upcoming lessons</p>
              <p className="text-sm text-gray-400 mt-1">
                Students will be able to book sessions once your profile is verified
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingLessons.map((lesson) => (
                <div 
                  key={lesson.id} 
                  className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between"
                >
                  <div className="flex items-start md:items-center space-x-4 mb-4 md:mb-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={lesson.profiles?.profile_image} alt={lesson.profiles?.full_name} />
                      <AvatarFallback>{lesson.profiles?.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{lesson.profiles?.full_name || "Student"}</h4>
                      <p className="text-sm text-gray-500">{lesson.subject}</p>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDate(lesson.start_time)} • {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                        <span className="ml-2 text-xs text-gray-400">
                          ({calculateDuration(lesson.start_time, lesson.end_time)} mins)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                    {lesson.status === 'pending' ? (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => handleAcceptBooking(lesson.id)}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeclineBooking(lesson.id)}
                        >
                          Decline
                        </Button>
                      </>
                    ) : (
                      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                        <Link to={`/tutor/messages?student=${lesson.student_id}`}>
                          <Button size="sm" variant="outline">
                            Message Student
                          </Button>
                        </Link>
                        <Link to={`/lesson/${lesson.id}`}>
                          <Button size="sm">Join Lesson</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="text-center pt-2">
                <Button asChild variant="link">
                  <Link to="/tutor/bookings">View All Bookings</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorDashboard;
