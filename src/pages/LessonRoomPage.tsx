
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import VirtualClassroom from "@/components/lesson/VirtualClassroom";
import { getBookingDetails } from "@/services/booking.service";
import { toast } from "@/hooks/use-toast";
import { completeBooking } from "@/services/booking.service";

const LessonRoomPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId && user?.id) {
      loadBookingData();
    }
  }, [bookingId, user]);

  const loadBookingData = async () => {
    setIsLoading(true);
    try {
      const data = await getBookingDetails(bookingId!);
      
      if (!data) {
        setError("Booking not found");
        toast({
          title: "Error",
          description: "This session could not be found or has ended",
          variant: "destructive",
        });
        return;
      }

      // Check if user is part of this booking
      if (data.student_id !== user?.id && data.tutor_id !== user?.id) {
        setError("You are not authorized to join this session");
        toast({
          title: "Unauthorized",
          description: "You are not authorized to join this session",
          variant: "destructive",
        });
        return;
      }

      // Check if booking is confirmed
      if (data.status !== "confirmed") {
        setError(`This session is ${data.status}`);
        toast({
          title: "Session Unavailable",
          description: `This session is ${data.status}`,
          variant: "destructive",
        });
        return;
      }

      setBookingData(data);
    } catch (error) {
      console.error("Error loading booking:", error);
      setError("Failed to load session data");
      toast({
        title: "Error",
        description: "Failed to load session data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async () => {
    try {
      // Check if the current user is the tutor (only tutors can complete a booking)
      if (user?.id === bookingData.tutor_id) {
        await completeBooking(bookingId!);
        toast({
          title: "Session Completed",
          description: "The session has been marked as completed",
        });
      }
      
      // Redirect based on user role
      const redirectPath = user?.id === bookingData.tutor_id
        ? "/tutor/bookings"
        : "/student/bookings";
      
      navigate(redirectPath);
    } catch (error) {
      console.error("Error ending session:", error);
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tutorly-accent"></div>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Session Unavailable</h2>
          <p className="text-gray-500 mb-6">{error || "This session is not available"}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-tutorly-accent text-white rounded-md hover:bg-tutorly-secondary transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <VirtualClassroom
      bookingId={bookingId!}
      tutorName={bookingData.profiles?.tutor_id?.full_name || "Tutor"}
      tutorImage={bookingData.profiles?.tutor_id?.profile_image || ""}
      studentName={bookingData.profiles?.student_id?.full_name || "Student"}
      studentImage={bookingData.profiles?.student_id?.profile_image || ""}
      subject={bookingData.subject}
      startTime={bookingData.start_time}
      endTime={bookingData.end_time}
      onEndSession={handleEndSession}
    />
  );
};

export default LessonRoomPage;
