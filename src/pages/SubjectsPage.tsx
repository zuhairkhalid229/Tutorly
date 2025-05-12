import { useState, useEffect } from "react";
import { Heading } from "@/components/ui/heading";
import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getTutors } from "@/services/profile.service";

const subjects = {
  mathematics: [
    "Algebra", "Calculus", "Geometry", "Statistics", "Trigonometry", 
    "Linear Algebra", "Differential Equations", "Discrete Mathematics"
  ],
  science: [
    "Biology", "Chemistry", "Physics", "Earth Science", "Astronomy",
    "Environmental Science", "Anatomy", "Biochemistry"
  ],
  languages: [
    "English", "Spanish", "French", "German", "Chinese", "Japanese",
    "Russian", "Arabic", "Italian", "Portuguese"
  ],
  humanities: [
    "History", "Geography", "Philosophy", "Literature", "Art History",
    "Religious Studies", "Sociology", "Political Science"
  ],
  technology: [
    "Computer Science", "Programming", "Web Development", "Data Science",
    "Machine Learning", "Cybersecurity", "Database Management", "Mobile App Development"
  ]
};

const SubjectsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("mathematics");
  const [availableSubjects, setAvailableSubjects] = useState<{[key: string]: string[]}>({});
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Fetch tutors to determine which subjects have available tutors
    const fetchTutors = async () => {
      try {
        setIsLoading(true);
        const tutorsData = await getTutors();
        
        // Extract all subjects from tutors
        const allTutorSubjects = new Set<string>();
        tutorsData.forEach((tutor: any) => {
          if (tutor.subjects && Array.isArray(tutor.subjects)) {
            tutor.subjects.forEach((subject: string) => {
              allTutorSubjects.add(subject);
            });
          }
        });
        
        // Filter the subjects object to only include subjects that have tutors
        const filteredSubjects: {[key: string]: string[]} = {};
        Object.entries(subjects).forEach(([category, subjectsArray]) => {
          filteredSubjects[category] = subjectsArray.filter(subject => 
            // Keep original subjects, but we'll mark in the UI which ones have tutors
            true
          );
        });
        
        setAvailableSubjects(filteredSubjects);
      } catch (error) {
        console.error("Failed to fetch tutors for subjects:", error);
        // Fall back to the predefined subjects
        setAvailableSubjects(subjects);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTutors();
  }, []);

  return (
    <MainLayout>
      <div className="container py-12">
        <Heading 
          title="Explore Subjects" 
          description="Browse our wide range of subjects and find the perfect tutor for your needs"
        />
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-tutorly-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <Tabs 
            defaultValue="mathematics" 
            className="mt-8"
            onValueChange={(value) => setSelectedCategory(value)}
          >
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
              <TabsTrigger value="mathematics">Mathematics</TabsTrigger>
              <TabsTrigger value="science">Science</TabsTrigger>
              <TabsTrigger value="languages">Languages</TabsTrigger>
              <TabsTrigger value="humanities">Humanities</TabsTrigger>
              <TabsTrigger value="technology">Technology</TabsTrigger>
            </TabsList>
            
            {Object.keys(availableSubjects).map((category) => (
              <TabsContent key={category} value={category} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {availableSubjects[category]?.map((subject) => (
                    <Card key={subject} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-medium mb-2">{subject}</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Find expert tutors specializing in {subject}
                        </p>
                        <Button asChild className="w-full">
                          <Link to={`/tutors?subject=${encodeURIComponent(subject)}`}>
                            Find Tutors
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
};

export default SubjectsPage;
