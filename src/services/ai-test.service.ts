
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

const GEMINI_API_KEY = 'AIzaSyA_UjLHifHqp8gaXunMIaSarvS121RTfT0';

// Function to get test by subject
export const getAITest = async (subject: string) => {
  try {
    const prompt = `Create a knowledge assessment test for tutors who want to teach ${subject}. 
    The test should include 5 multiple-choice questions that assess deep knowledge of ${subject}.
    Each question should have 4 options (A, B, C, D) with only one correct answer.
    Format the response as a JSON with this structure:
    {
      "subject": "${subject}",
      "questions": [
        {
          "id": "1",
          "question": "Question text here",
          "options": [
            {"id": "A", "text": "Option A"},
            {"id": "B", "text": "Option B"},
            {"id": "C", "text": "Option C"},
            {"id": "D", "text": "Option D"}
          ],
          "correctAnswer": "A"
        },
        ...more questions
      ]
    }`;
    
    // Updated to use the correct Gemini API format
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.95,
          topK: 40
        }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
      throw new Error('No valid response from Gemini API');
    }
    
    // Extract text from the proper location in the response
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // Extract the JSON part from the text response
    const jsonStart = textResponse.indexOf('{');
    const jsonEnd = textResponse.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('Could not extract JSON from response');
    }
    
    const jsonStr = textResponse.substring(jsonStart, jsonEnd);
    const testData = JSON.parse(jsonStr);
    
    return testData;
  } catch (error: any) {
    console.error('Error fetching AI test:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to generate test',
      variant: 'destructive',
    });
    throw error;
  }
};

// Function to submit test answers and get evaluation
export const submitTestAnswers = async (userId: string, subject: string, answers: Record<string, string>, correctAnswers: Record<string, string>) => {
  try {
    // Compare answers with correct answers
    const totalQuestions = Object.keys(correctAnswers).length;
    let correctCount = 0;
    
    Object.keys(correctAnswers).forEach(questionId => {
      if (answers[questionId] === correctAnswers[questionId]) {
        correctCount++;
      }
    });
    
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 70;
    
    // Update user's subjects if passed
    if (passed) {
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('subjects')
        .eq('id', userId)
        .single();
        
      if (fetchError) throw fetchError;
      
      let currentSubjects = profile.subjects || [];
      
      // Add subject if not already in array
      if (!currentSubjects.includes(subject)) {
        currentSubjects.push(subject);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subjects: currentSubjects,
            is_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (updateError) throw updateError;
      }
    }
    
    // Result to return to user
    const result = {
      score,
      passed,
      feedback: passed
        ? `Congratulations! You passed the ${subject} test with a score of ${score}%. You are now verified to teach this subject.`
        : `You scored ${score}% on the ${subject} test. A minimum score of 70% is required to be verified. Please review the material and try again.`
    };
    
    toast({
      title: passed ? 'Test Passed!' : 'Test Not Passed',
      description: result.feedback,
      variant: passed ? 'default' : 'destructive',
    });
    
    return result;
  } catch (error: any) {
    console.error('Error submitting test answers:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to submit test answers',
      variant: 'destructive',
    });
    throw error;
  }
};

// Function to check if a tutor is verified for a specific subject
export const checkTutorVerification = async (tutorId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_verified, subjects')
      .eq('id', tutorId)
      .single();
      
    if (error) throw error;
    
    return {
      isVerified: data.is_verified || false,
      subjects: data.subjects || []
    };
  } catch (error: any) {
    console.error('Error checking tutor verification:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to check tutor verification',
      variant: 'destructive',
    });
    
    // Return default values if there's an error
    return {
      isVerified: false,
      subjects: []
    };
  }
};

// Function to get available subjects that aren't verified yet
export const getAvailableSubjects = async (tutorId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('subjects')
      .eq('id', tutorId)
      .single();
      
    if (error) throw error;
    
    const verifiedSubjects = data.subjects || [];
    
    // Available subject options (should match those in AITestPage)
    const ALL_SUBJECTS = [
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Computer Science",
      "English",
      "History",
      "Geography",
      "Economics",
      "Business Studies",
      "Psychology",
      "French",
      "Spanish",
      "Literature"
    ];
    
    // Filter out already verified subjects
    const availableSubjects = ALL_SUBJECTS.filter(
      subject => !verifiedSubjects.includes(subject)
    );
    
    return {
      verifiedSubjects,
      availableSubjects
    };
  } catch (error: any) {
    console.error('Error getting available subjects:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to get available subjects',
      variant: 'destructive',
    });
    throw error;
  }
};
