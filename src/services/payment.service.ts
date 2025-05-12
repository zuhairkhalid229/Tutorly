
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export const addFunds = async (userId: string, amount: number, paymentMethod: string) => {
  try {
    // Create a payment record
    const paymentId = uuidv4();
    const { data, error } = await supabase
      .from('payments')
      .insert({
        id: paymentId,
        payer_id: userId,
        amount: amount,
        payment_method: paymentMethod,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: 'Payment Submitted',
      description: 'Your payment is pending admin approval',
    });
    
    return data;
  } catch (error: any) {
    console.error('Error adding funds:', error);
    toast({
      title: 'Payment Failed',
      description: error.message || 'Failed to process payment',
      variant: 'destructive',
    });
    throw error;
  }
};

export const getPaymentHistory = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .or(`payer_id.eq.${userId},payee_id.eq.${userId}`)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching payment history:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to load payment history',
      variant: 'destructive',
    });
    throw error;
  }
};

export const getPendingPayments = async () => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, profiles!payments_payer_id_fkey(*)')
      .eq('status', 'pending');
      
    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching pending payments:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to load pending payments',
      variant: 'destructive',
    });
    throw error;
  }
};

export const approvePayment = async (paymentId: string) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: 'Payment Approved',
      description: 'Payment has been approved successfully',
    });
    
    return data;
  } catch (error: any) {
    console.error('Error approving payment:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to approve payment',
      variant: 'destructive',
    });
    throw error;
  }
};

export const bookTutor = async (
  studentId: string, 
  tutorId: string, 
  startTime: Date, 
  endTime: Date,
  subject: string,
  rate: number
) => {
  try {
    const paymentId = uuidv4();
    const bookingId = uuidv4();
    
    // Create a payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        id: paymentId,
        payer_id: studentId,
        payee_id: tutorId,
        amount: rate,
        payment_method: 'wallet',
        status: 'completed',
        booking_id: bookingId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (paymentError) throw paymentError;
    
    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        id: bookingId,
        student_id: studentId,
        tutor_id: tutorId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        subject: subject,
        status: 'confirmed',
        price: rate,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (bookingError) throw bookingError;
    
    toast({
      title: 'Booking Successful',
      description: 'Your session has been booked successfully',
    });
    
    return { booking, payment };
  } catch (error: any) {
    console.error('Error booking tutor:', error);
    toast({
      title: 'Booking Failed',
      description: error.message || 'Failed to book tutor session',
      variant: 'destructive',
    });
    throw error;
  }
};
