
import { supabase } from './supabase';

// Function to initialize app data
export const initializeAppData = async () => {
  try {
    // Check if we need to add dummy data
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'tutor')
      .limit(1);
      
    if (error) {
      console.error('Error checking for existing tutors:', error);
      return;
    }
    
    // If no tutors exist, add dummy tutors
    if (!profiles || profiles.length === 0) {
      console.log('No tutors found, initializing dummy tutors...');
      await insertDummyTutors();
    } else {
      console.log('Tutors already exist, not adding dummy data');
    }
  } catch (error) {
    console.error('Error initializing app data:', error);
  }
};

// Function to insert dummy tutors for testing
export const insertDummyTutors = async () => {
  try {
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
        profile_image: 'https://ui-avatars.com/api/?name=John+Smith&background=random',
        role: 'tutor',
        is_verified: true
      },
      {
        email: 'language_tutor@tutorly.com',
        password: 'Password123!',
        full_name: 'Sarah Johnson',
        subjects: ['English', 'Spanish', 'Literature'],
        about: 'Passionate about languages and literature. I help students improve their writing and speaking skills through personalized instruction.',
        education: 'MA in Linguistics, Stanford University',
        hourly_rate: 40,
        profile_image: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=random',
        role: 'tutor',
        is_verified: true
      },
      {
        email: 'science_tutor@tutorly.com',
        password: 'Password123!',
        full_name: 'Michael Chen',
        subjects: ['Biology', 'Chemistry', 'Earth Science'],
        about: 'Science educator specializing in biology and chemistry. I use practical examples and experiments to make science interesting and accessible.',
        education: 'BSc in Biochemistry, University of California',
        hourly_rate: 38,
        profile_image: 'https://ui-avatars.com/api/?name=Michael+Chen&background=random',
        role: 'tutor',
        is_verified: true
      },
      {
        email: 'history_tutor@tutorly.com',
        password: 'Password123!',
        full_name: 'Emma Rodriguez',
        subjects: ['History', 'Geography', 'Social Studies'],
        about: 'History enthusiast with a knack for storytelling. I make historical events come alive through engaging discussions and multimedia resources.',
        education: 'PhD in History, Columbia University',
        hourly_rate: 42,
        profile_image: 'https://ui-avatars.com/api/?name=Emma+Rodriguez&background=random',
        role: 'tutor',
        is_verified: true
      },
      {
        email: 'tech_tutor@tutorly.com',
        password: 'Password123!',
        full_name: 'David Wilson',
        subjects: ['Computer Science', 'Programming', 'Web Development'],
        about: 'Software developer and educator with expertise in multiple programming languages. I help students build practical skills through hands-on projects.',
        education: 'MS in Computer Science, Georgia Tech',
        hourly_rate: 50,
        profile_image: 'https://ui-avatars.com/api/?name=David+Wilson&background=random',
        role: 'tutor',
        is_verified: true
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
            role: tutor.role
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
          is_verified: tutor.is_verified,
          role: tutor.role
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

export default initializeAppData;
