
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Book, MessageSquare, User, CreditCard } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getStudentBookings } from "@/services/booking.service";
import { getTutors } from "@/services/profile.service";
import { format, parseISO } from "date-fns";

interface Tutor {
  id: string;
  full_name: string;
  profile_image: string;
  subjects: string[];
  rating: number;
  hourly_rate: number;
}

interface Booking {
  id: string;
  tutor_id: string;
  subject: string;
  start_time: string;
  end_time: string;
  status: string;
  profiles: {
    full_name: string;
    profile_image: string;
  };
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingLessons, setUpcomingLessons] = useState<Booking[]>([]);
  const [recommendedTutors, setRecommendedTutors] = useState<Tutor[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Get student bookings
      const bookingsData = await getStudentBookings(user!.id);
      
      // Filter for upcoming confirmed and pending lessons
      const now = new Date();
      const upcoming = bookingsData
        .filter((booking: Booking) => 
          (booking.status === 'confirmed' || booking.status === 'pending') && 
          new Date(booking.start_time) > now
        )
        .sort((a: Booking, b: Booking) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
        .slice(0, 3); // Get only next 3 lessons
      
      setUpcomingLessons(upcoming);
      
      // Get recommended tutors
      const tutorsData = await getTutors();
      setRecommendedTutors(tutorsData.slice(0, 3)); // Get top 3 tutors
      
      // For now, just mock unread messages count
      // In a real app, you would fetch this from the messages table
      setUnreadMessages(Math.floor(Math.random() * 5));
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tutorly-accent"></div>
      </div>
    );
  }

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
              <h3 className="text-2xl font-bold">{unreadMessages}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="rounded-full bg-tutorly-light-blue p-3 mr-4">
              <CreditCard className="h-6 w-6 text-tutorly-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Balance</p>
              <h3 className="text-2xl font-bold">$75.00</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Lessons */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Lessons</CardTitle>
          <CardDescription>Your scheduled tutoring sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingLessons.length > 0 ? (
            <div className="space-y-4">
              {upcomingLessons.map((lesson) => (
                <div key={lesson.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-4">
                      <AvatarImage src={lesson.profiles?.profile_image} alt={lesson.profiles?.full_name} />
                      <AvatarFallback>{lesson.profiles?.full_name?.charAt(0) || 'T'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{lesson.subject} with {lesson.profiles?.full_name || "Tutor"}</h4>
                      <p className="text-sm text-gray-500">
                        {formatDate(lesson.start_time)} at {formatTime(lesson.start_time)} ({calculateDuration(lesson.start_time, lesson.end_time)} mins)
                      </p>
                    </div>
                  </div>
                  <div className="flex mt-4 md:mt-0 space-x-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/student/messages?tutor=${lesson.tutor_id}`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Link>
                    </Button>
                    {lesson.status === "confirmed" && (
                      <Button size="sm" asChild>
                        <Link to={`/lesson/${lesson.id}`}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Join Lesson
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="rounded-full bg-gray-100 h-12 w-12 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">No upcoming lessons</h3>
              <p className="text-gray-500 mb-4">
                You don't have any scheduled lessons yet.
              </p>
              <Button asChild>
                <Link to="/tutors">Find a Tutor</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommended Tutors */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Tutors</CardTitle>
          <CardDescription>Tutors that match your learning needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recommendedTutors.length > 0 ? (
              recommendedTutors.map((tutor) => (
                <Link 
                  key={tutor.id} 
                  to={`/tutor/${tutor.id}`}
                  className="group"
                >
                  <div className="border rounded-lg p-4 h-full flex flex-col items-center text-center transition-shadow hover:shadow-md">
                    <Avatar className="h-16 w-16 mb-4">
                      <AvatarImage src={tutor.profile_image} alt={tutor.full_name} />
                      <AvatarFallback>{tutor.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h4 className="font-medium mb-1">{tutor.full_name}</h4>
                    <p className="text-sm text-gray-500 mb-2">
                      {tutor.subjects && tutor.subjects.length > 0 
                        ? tutor.subjects[0] 
                        : "Tutor"}
                    </p>
                    <div className="flex items-center mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 ${
                            i < Math.floor(tutor.rating || 5)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-gray-600">{tutor.rating || 5.0}</span>
                    </div>
                    <div className="mb-4 text-sm font-medium">${tutor.hourly_rate || 40}/hr</div>
                    <Button className="mt-auto group-hover:bg-tutorly-secondary" size="sm">
                      View Profile
                    </Button>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <div className="rounded-full bg-gray-100 h-12 w-12 flex items-center justify-center mx-auto mb-4">
                  <User className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No tutors available</h3>
                <p className="text-gray-500 mb-4">
                  There are currently no tutors available. Please check back later.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
