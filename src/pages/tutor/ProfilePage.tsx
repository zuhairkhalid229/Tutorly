
import { useEffect, useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { 
  getProfile, 
  updateProfile, 
  uploadProfileImage, 
  ProfileUpdateData 
} from "@/services/profile.service";
import { Heading } from "@/components/ui/heading";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { MultiSelect } from "@/components/ui/multi-select";

// Define popular subject options
const SUBJECT_OPTIONS = [
  { value: "Mathematics", label: "Mathematics" },
  { value: "Physics", label: "Physics" },
  { value: "Chemistry", label: "Chemistry" },
  { value: "Biology", label: "Biology" },
  { value: "Computer Science", label: "Computer Science" },
  { value: "English", label: "English" },
  { value: "History", label: "History" },
  { value: "Geography", label: "Geography" },
  { value: "Economics", label: "Economics" },
  { value: "Business Studies", label: "Business Studies" },
  { value: "Psychology", label: "Psychology" },
  { value: "Sociology", label: "Sociology" },
  { value: "French", label: "French" },
  { value: "Spanish", label: "Spanish" },
  { value: "German", label: "German" },
  { value: "Art", label: "Art" },
  { value: "Music", label: "Music" },
  { value: "Physical Education", label: "Physical Education" },
  { value: "Statistics", label: "Statistics" },
  { value: "Calculus", label: "Calculus" }
];

const TutorProfilePage = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    education: "",
    phone: "",
    about: "",
    hourly_rate: 0,
    subjects: [] as string[]
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const profileData = await getProfile(user.id);
      setFullProfile(profileData);
      setProfile({
        full_name: profileData.full_name || "",
        email: user.email || "",
        education: profileData.education || "",
        phone: profileData.phone || "",
        about: profileData.about || "",
        hourly_rate: profileData.hourly_rate || 0,
        subjects: profileData.subjects || []
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const updateData: ProfileUpdateData = {
        full_name: profile.full_name,
        phone: profile.phone,
        education: profile.education,
        about: profile.about,
        subjects: profile.subjects,
        hourly_rate: profile.hourly_rate
      };
      
      const updatedProfile = await updateProfile(user.id, updateData);
      setFullProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('current-password') as string;
    const newPassword = formData.get('new-password') as string;
    const confirmPassword = formData.get('confirm-password') as string;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Your password has been updated",
      });
      
      // Reset form
      e.currentTarget.reset();
    } catch (error: any) {
      console.error("Failed to update password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!user?.id || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsLoading(true);
    
    try {
      const updatedProfile = await uploadProfileImage(user.id, file);
      setFullProfile(updatedProfile);
      
      // Update local profile state with new image
      if (updatedProfile.profile_image) {
        setFullProfile(prev => ({ ...prev, profile_image: updatedProfile.profile_image }));
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectsChange = (selectedOptions: { value: string, label: string }[]) => {
    setProfile({
      ...profile,
      subjects: selectedOptions.map(option => option.value)
    });
  };

  if (isLoading && !fullProfile) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tutorly-accent"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Heading 
          title="My Profile" 
          description="Manage your personal information and account settings"
        />
        <Button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="bg-tutorly-accent hover:bg-tutorly-accent/90"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="subjects">Subjects & Rates</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={fullProfile?.profile_image} alt={profile.full_name} />
                    <AvatarFallback>{profile.full_name?.charAt(0) || "T"}</AvatarFallback>
                  </Avatar>
                  
                  {isEditing && (
                    <div className="absolute bottom-0 right-0">
                      <Label htmlFor="profileImage" className="cursor-pointer p-1 bg-tutorly-accent text-white rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                          <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                          <path d="m15 5 4 4"></path>
                        </svg>
                        <Input 
                          id="profileImage" 
                          type="file" 
                          onChange={handleImageUpload} 
                          className="sr-only" 
                          accept="image/*"
                        />
                      </Label>
                    </div>
                  )}
                </div>
                <div>
                  <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input 
                    id="full_name" 
                    value={profile.full_name} 
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    disabled={!isEditing} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={profile.email} 
                    disabled={true} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    value={profile.phone} 
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    disabled={!isEditing} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Input 
                    id="education" 
                    value={profile.education} 
                    onChange={(e) => setProfile({...profile, education: e.target.value})}
                    disabled={!isEditing} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="about">About Me</Label>
                  <textarea 
                    id="about" 
                    rows={4}
                    className="w-full p-2 border rounded-md"
                    value={profile.about} 
                    onChange={(e) => setProfile({...profile, about: e.target.value})}
                    disabled={!isEditing} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Subjects & Hourly Rate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subjects">Subjects You Teach</Label>
                  <MultiSelect
                    value={profile.subjects.map(subject => ({ value: subject, label: subject }))}
                    onChange={handleSubjectsChange}
                    options={SUBJECT_OPTIONS}
                    placeholder="Select subjects..."
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input 
                    id="hourly_rate" 
                    type="number"
                    value={profile.hourly_rate} 
                    onChange={(e) => setProfile({...profile, hourly_rate: parseFloat(e.target.value) || 0})}
                    disabled={!isEditing} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" name="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" name="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" name="confirm-password" type="password" />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TutorProfilePage;
