
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export interface ProfileUpdateData {
  full_name?: string;
  email?: string;
  phone?: string;
  education?: string;
  about?: string;
  subjects?: string[];
  hourly_rate?: number;
  profile_image?: string;
  availability?: AvailabilitySchedule;
  updated_at?: string;
}

export interface AvailabilitySchedule {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

export interface TimeSlot {
  start: string; // Format: "HH:MM" (24-hour format)
  end: string; // Format: "HH:MM" (24-hour format)
}

export const getProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Error getting profile:", error);
    toast({
      title: "Error retrieving profile",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }
};

export const updateProfile = async (userId: string, updateData: ProfileUpdateData) => {
  try {
    // Update timestamp
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully",
    });
    
    return data;
  } catch (error: any) {
    console.error("Error updating profile:", error);
    toast({
      title: "Error updating profile",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }
};

export const uploadProfileImage = async (userId: string, file: File) => {
  try {
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `profile-images/${fileName}`;
    
    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('tutorly')
      .upload(filePath, file);

    if (uploadError) throw uploadError;
    
    // Get the public URL for the file
    const { data: { publicUrl } } = supabase
      .storage
      .from('tutorly')
      .getPublicUrl(filePath);

    // Update the profile with the new image URL
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({ profile_image: publicUrl })
      .eq('id', userId)
      .select()
      .single();

    if (profileError) throw profileError;
    
    toast({
      title: "Profile image updated",
      description: "Your profile image has been updated successfully",
    });
    
    return profileData;
  } catch (error: any) {
    console.error("Error uploading profile image:", error);
    toast({
      title: "Error uploading image",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  }
};

export const getTutors = async (subject?: string) => {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'tutor')
      .eq('is_verified', true);
      
    if (subject) {
      query = query.contains('subjects', [subject]);
    }
    
    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error("Error fetching tutors:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to load tutors",
      variant: "destructive",
    });
    throw error;
  }
};

export const getTutorById = async (tutorId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', tutorId)
      .eq('role', 'tutor')
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Error fetching tutor:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to load tutor profile",
      variant: "destructive",
    });
    throw error;
  }
};

export const checkTutorVerification = async (tutorId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_verified, subjects')
      .eq('id', tutorId)
      .eq('role', 'tutor')
      .single();

    if (error) throw error;
    
    return {
      isVerified: data.is_verified || false,
      subjects: data.subjects || []
    };
  } catch (error: any) {
    console.error("Error checking tutor verification:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to check verification status",
      variant: "destructive",
    });
    // Return default values if there's an error
    return {
      isVerified: false,
      subjects: []
    };
  }
};

// Function to get tutor availability
export const getTutorAvailability = async (tutorId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('availability')
      .eq('id', tutorId)
      .single();
      
    if (error) throw error;
    
    return data.availability || {};
  } catch (error: any) {
    console.error("Error fetching tutor availability:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to load availability",
      variant: "destructive",
    });
    return {};
  }
};

// Function to update tutor availability
export const updateTutorAvailability = async (tutorId: string, availability: AvailabilitySchedule) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        availability: availability,
        updated_at: new Date().toISOString()
      })
      .eq('id', tutorId)
      .select()
      .single();
      
    if (error) throw error;
    
    toast({
      title: "Availability updated",
      description: "Your availability schedule has been updated successfully",
    });
    
    return data;
  } catch (error: any) {
    console.error("Error updating tutor availability:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to update availability",
      variant: "destructive",
    });
    throw error;
  }
};
