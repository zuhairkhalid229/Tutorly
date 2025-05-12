import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

// Function to create a new booking request
export const createBooking = async (
  studentId: string, 
  tutorId: string, 
  startTime: string, 
  endTime: string,
  subject: string,
  rate: number,
  notes?: string
) => {
  try {
    // Check if tutor is available during this time
    const { data: conflictingBookings, error: conflictError } = await supabase
      .from('bookings')
      .select('*')
      .eq('tutor_id', tutorId)
      .not('status', 'eq', 'cancelled')
      .or(`and(start_time.lte.${startTime},end_time.gt.${startTime}),and(start_time.lt.${endTime},end_time.gte.${endTime}),and(start_time.gte.${startTime},end_time.lte.${endTime})`);
      
    if (conflictError) throw conflictError;
    
    if (conflictingBookings && conflictingBookings.length > 0) {
      toast({
        title: 'Booking Failed',
        description: 'The tutor is not available during this time',
        variant: 'destructive',
      });
      throw new Error('Tutor is not available during this time');
    }
    
    const bookingId = uuidv4();
    
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        id: bookingId,
        student_id: studentId,
        tutor_id: tutorId,
        subject: subject,
        start_time: startTime,
        end_time: endTime,
        status: 'pending',
        notes: notes,
        price: rate,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: 'Booking Created',
      description: 'Your booking request has been submitted',
    });
    
    return data;
  } catch (error: any) {
    console.error('Error creating booking:', error);
    if (error.message !== 'Tutor is not available during this time') {
      toast({
        title: 'Booking Failed',
        description: error.message || 'Failed to create booking',
        variant: 'destructive',
      });
    }
    throw error;
  }
};

// Function for a tutor to confirm a booking
export const confirmBooking = async (bookingId: string, paymentMethod: string = 'wallet') => {
  try {
    // Update booking status to confirmed
    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: 'Booking Confirmed',
      description: 'Your booking has been confirmed',
    });
    
    return data;
  } catch (error: any) {
    console.error('Error confirming booking:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to confirm booking',
      variant: 'destructive',
    });
    throw error;
  }
};

// Function to mark a booking as completed
export const completeBooking = async (bookingId: string) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: 'Booking Completed',
      description: 'The session has been marked as completed',
    });
    
    return data;
  } catch (error: any) {
    console.error('Error completing booking:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to complete booking',
      variant: 'destructive',
    });
    throw error;
  }
};

// Function to cancel a booking
export const cancelBooking = async (bookingId: string) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: 'Booking Cancelled',
      description: 'Your booking has been cancelled',
    });
    
    return data;
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to cancel booking',
      variant: 'destructive',
    });
    throw error;
  }
};

// Function to get bookings for a student
export const getStudentBookings = async (studentId: string) => {
  try {
    console.log("Getting bookings for student:", studentId);
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles!bookings_tutor_id_fkey(id, full_name, profile_image, about, subjects)
      `)
      .eq('student_id', studentId);
      
    if (error) {
      console.error("Supabase error when fetching bookings:", error);
      throw error;
    }
    
    console.log("Bookings data fetched:", data);
    return data || [];
  } catch (error: any) {
    console.error('Error fetching student bookings:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to load bookings',
      variant: 'destructive',
    });
    throw error;
  }
};

// Function to get bookings for a tutor
export const getTutorBookings = async (tutorId: string) => {
  try {
    console.log("Getting bookings for tutor:", tutorId);
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles!bookings_student_id_fkey(id, full_name, profile_image, about)
      `)
      .eq('tutor_id', tutorId);
      
    if (error) {
      console.error("Supabase error when fetching tutor bookings:", error);
      throw error;
    }
    
    console.log("Tutor bookings data:", data);
    return data || [];
  } catch (error: any) {
    console.error('Error fetching tutor bookings:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to load bookings',
      variant: 'destructive',
    });
    throw error;
  }
};

// Function to get specific booking details
export const getBookingDetails = async (bookingId: string) => {
  try {
    // First fetch the basic booking info
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
      
    if (bookingError) throw bookingError;
    if (!bookingData) return null;
    
    // Then fetch the student profile separately
    const { data: studentData, error: studentError } = await supabase
      .from('profiles')
      .select('id, full_name, profile_image, phone, about')
      .eq('id', bookingData.student_id)
      .single();
      
    if (studentError) throw studentError;
    
    // Then fetch the tutor profile separately
    const { data: tutorData, error: tutorError } = await supabase
      .from('profiles')
      .select('id, full_name, profile_image, phone, education, about')
      .eq('id', bookingData.tutor_id)
      .single();
      
    if (tutorError) throw tutorError;
    
    // Combine the data
    const combinedData = {
      ...bookingData,
      profiles: {
        student_id: studentData,
        tutor_id: tutorData
      }
    };
    
    return combinedData;
  } catch (error: any) {
    console.error('Error fetching booking details:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to load booking details',
      variant: 'destructive',
    });
    throw error;
  }
};
