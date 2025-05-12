
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import MainLayout from "@/components/layouts/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MessageCircle, User, FileBadge, Book, Star, Edit } from "lucide-react";
import { getTutorById } from "@/services/profile.service";
import { useAuth } from "@/contexts/AuthContext";
import BookTutorButton from "@/components/tutor/BookTutorButton";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import AvailabilityScheduler from "@/components/tutor/AvailabilityScheduler";

interface TutorProfilePageProps {
  isOwnProfile?: boolean;
}

const TutorProfilePage = ({ isOwnProfile }: TutorProfilePageProps) => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [tutor, setTutor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");
  const [isEditMode, setIsEditMode] = useState(false);
  
  const tutorId = isOwnProfile ? user?.id : id;

  useEffect(() => {
    if (tutorId) {
      loadTutorProfile();
    }
  }, [tutorId]);

  const loadTutorProfile = async () => {
    setIsLoading(true);
    try {
      const tutorData = await getTutorById(tutorId!);
      setTutor(tutorData);
      console.log("Tutor data loaded:", tutorData);
    } catch (error) {
      console.error("Failed to load tutor profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = (updatedProfile: any) => {
    setTutor(updatedProfile);
    setIsEditMode(false);
  };

  const handleAvailabilityUpdate = (newAvailability: any) => {
    setTutor({...tutor, availability: newAvailability});
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-tutorly-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!tutor) {
    return (
      <MainLayout>
        <div className="tutorly-container py-12 text-center">
          <h2 className="text-2xl font-bold text-red-600">Tutor Profile Not Found</h2>
          <p className="mt-4 text-gray-600">
            Sorry, we couldn't find the tutor profile you were looking for.
          </p>
          <Button asChild className="mt-6">
            <Link to="/tutors">Browse Tutors</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="tutorly-container py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="md:w-1/3">
            <Card className="sticky top-24">
              <CardContent className="p-6 flex flex-col items-center">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={tutor.profile_image} alt={tutor.full_name} />
                  <AvatarFallback>
                    {tutor.full_name?.substring(0, 2)?.toUpperCase() || "TU"}
                  </AvatarFallback>
                </Avatar>

                <h1 className="text-2xl font-bold mt-4 text-center">
                  {tutor.full_name}
                </h1>

                {tutor.subjects && tutor.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    {tutor.subjects.map((subject: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center mt-4 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(tutor.rating || 5)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-medium">{tutor.rating || 5.0}</span>
                </div>

                <div className="w-full mt-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-bold text-lg text-tutorly-primary">
                        ${tutor.hourly_rate || 0}/hr
                      </div>
                      <div className="text-xs text-gray-500">Hourly Rate</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-bold text-lg text-tutorly-primary">
                        {tutor.education ? "Yes" : "No"}
                      </div>
                      <div className="text-xs text-gray-500">Verified</div>
                    </div>
                  </div>
                </div>

                {isOwnProfile ? (
                  <Button 
                    className="w-full mt-6" 
                    onClick={() => setIsEditMode(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" /> Edit Profile
                  </Button>
                ) : (
                  <div className="w-full space-y-3 mt-6">
                    <BookTutorButton tutor={tutor} />
                    <Button 
                      className="w-full" 
                      variant="outline"
                      asChild
                    >
                      <Link to={`/messages?tutor=${tutor.id}`}>
                        <MessageCircle className="h-4 w-4 mr-2" /> Message
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Content Section */}
          <div className="md:w-2/3">
            {isEditMode && isOwnProfile ? (
              <>
                <ProfileEditForm 
                  profile={tutor} 
                  onSave={handleProfileUpdate} 
                  onCancel={() => setIsEditMode(false)} 
                />
                
                <div className="mt-8">
                  <AvailabilityScheduler 
                    tutorId={tutorId!}
                    initialAvailability={tutor.availability || {}} 
                    onUpdate={handleAvailabilityUpdate}
                  />
                </div>
              </>
            ) : (
              <Tabs 
                defaultValue="about" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold flex items-center mb-4">
                        <User className="h-5 w-5 mr-2" /> About Me
                      </h2>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {tutor.about || "No bio information available."}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold flex items-center mb-4">
                        <FileBadge className="h-5 w-5 mr-2" /> Education & Credentials
                      </h2>
                      <p className="text-gray-700">
                        {tutor.education || "No education information available."}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold flex items-center mb-4">
                        <Book className="h-5 w-5 mr-2" /> Teaching Subjects
                      </h2>
                      {tutor.subjects && tutor.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {tutor.subjects.map((subject: string, index: number) => (
                            <Badge key={index} variant="outline" className="px-3 py-1 text-sm">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-700">No subjects listed.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold flex items-center mb-4">
                        <Calendar className="h-5 w-5 mr-2" /> Weekly Availability
                      </h2>
                      
                      {tutor.availability && Object.keys(tutor.availability).length > 0 ? (
                        <div className="space-y-4">
                          {Object.entries(tutor.availability).map(([day, slots]) => (
                            <div key={day} className="border-b pb-3">
                              <h3 className="font-medium capitalize mb-2">{day}</h3>
                              <div className="space-y-1">
                                {Array.isArray(slots) && slots.map((slot: any, index: number) => (
                                  <div key={index} className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                    <span>
                                      {slot.start} - {slot.end}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-700">
                          No availability schedule has been set.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold flex items-center mb-4">
                        <Clock className="h-5 w-5 mr-2" /> Book a Session
                      </h2>
                      <p className="text-gray-700 mb-4">
                        Ready to learn with {tutor.full_name}? Book a session at your preferred time.
                      </p>
                      <BookTutorButton tutor={tutor} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold flex items-center mb-4">
                        <Star className="h-5 w-5 mr-2" /> Student Reviews
                      </h2>
                      <div className="text-center py-8">
                        <p className="text-gray-500">No reviews yet.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TutorProfilePage;
