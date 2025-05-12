
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// These values come from the environment variables
// They are automatically injected by the Lovable Supabase integration
const supabaseUrl = 'https://qdrzqxoupoqpfmumvwrd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcnpxeG91cG9xcGZtdW12d3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4NDc3ODgsImV4cCI6MjA2MTQyMzc4OH0.H6Qv0Feu6beTrwaK_ZMENIeEsTfD6X6POKYXb5rH2Oo';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof localStorage !== 'undefined' ? localStorage : undefined
  }
});

// Function to insert dummy data (tutors) for testing
export const insertDummyTutors = async () => {
  try {
    // First check if we already have tutors in the database
    const { data: existingTutors, error: countError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'tutor')
      .limit(1);
      
    if (countError) throw countError;
    
    // If tutors already exist, don't add more
    if (existingTutors && existingTutors.length > 0) {
      console.log('Tutors already exist, not adding dummy data');
      return;
    }
    
    // Sample tutors data
    const tutors = [
      {
        email: 'math_tutor@tutorly.com',
        password: 'Password123!',
        full_name: 'John Smith',
        subjects: ['Mathematics', 'Physics', 'Calculus'],
        about: 'I am a mathematics specialist with 10+ years of teaching experience. I focus on making complex concepts easy to understand.',
        education: 'PhD in Mathematics, MIT',
        hourly_rate: 45,
        profile_image: 'https://ui-avatars.com/api/?name=John+Smith&background=random'
      },
      {
        email: 'language_tutor@tutorly.com',
        password: 'Password123!',
        full_name: 'Sarah Johnson',
        subjects: ['English', 'Spanish', 'Literature'],
        about: 'Passionate about languages and literature. I help students improve their writing and speaking skills through personalized instruction.',
        education: 'MA in Linguistics, Stanford University',
        hourly_rate: 40,
        profile_image: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=random'
      },
      {
        email: 'science_tutor@tutorly.com',
        password: 'Password123!',
        full_name: 'Michael Chen',
        subjects: ['Biology', 'Chemistry', 'Earth Science'],
        about: 'Science educator specializing in biology and chemistry. I use practical examples and experiments to make science interesting and accessible.',
        education: 'BSc in Biochemistry, University of California',
        hourly_rate: 38,
        profile_image: 'https://ui-avatars.com/api/?name=Michael+Chen&background=random'
      },
      {
        email: 'history_tutor@tutorly.com',
        password: 'Password123!',
        full_name: 'Emma Rodriguez',
        subjects: ['History', 'Geography', 'Social Studies'],
        about: 'History enthusiast with a knack for storytelling. I make historical events come alive through engaging discussions and multimedia resources.',
        education: 'PhD in History, Columbia University',
        hourly_rate: 42,
        profile_image: 'https://ui-avatars.com/api/?name=Emma+Rodriguez&background=random'
      },
      {
        email: 'tech_tutor@tutorly.com',
        password: 'Password123!',
        full_name: 'David Wilson',
        subjects: ['Computer Science', 'Programming', 'Web Development'],
        about: 'Software developer and educator with expertise in multiple programming languages. I help students build practical skills through hands-on projects.',
        education: 'MS in Computer Science, Georgia Tech',
        hourly_rate: 50,
        profile_image: 'https://ui-avatars.com/api/?name=David+Wilson&background=random'
      }
    ];
    
    // Add tutors to the database one by one
    for (const tutor of tutors) {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tutor.email,
        password: tutor.password,
        options: {
          data: {
            name: tutor.full_name,
            role: 'tutor'
          }
        }
      });
      
      if (authError) {
        console.error('Error creating tutor account:', authError);
        continue;
      }
      
      if (!authData.user) {
        console.error('No user returned from signup');
        continue;
      }
      
      // Update profile with additional information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: tutor.full_name,
          about: tutor.about,
          education: tutor.education,
          subjects: tutor.subjects,
          hourly_rate: tutor.hourly_rate,
          profile_image: tutor.profile_image,
          is_verified: true // All dummy tutors are verified
        })
        .eq('id', authData.user.id);
        
      if (profileError) {
        console.error('Error updating tutor profile:', profileError);
      }
    }
    
    console.log('Successfully added dummy tutors');
  } catch (error) {
    console.error('Error inserting dummy tutors:', error);
  }
};

export default supabase;
