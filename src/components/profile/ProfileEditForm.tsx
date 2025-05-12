
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/services/profile.service";
import { toast } from "@/hooks/use-toast";

interface ProfileEditFormProps {
  profile: any;
  onSave: (updatedProfile: any) => void;
  onCancel: () => void;
}

// Corrected Option type to match MultiSelect
interface Option {
  label: string;
  value: string;
}

const subjectOptions = [
  { label: "Mathematics", value: "Mathematics" },
  { label: "Physics", value: "Physics" },
  { label: "Chemistry", value: "Chemistry" },
  { label: "Biology", value: "Biology" },
  { label: "English", value: "English" },
  { label: "History", value: "History" },
  { label: "Geography", value: "Geography" },
  { label: "Computer Science", value: "Computer Science" },
  { label: "Economics", value: "Economics" },
  { label: "Business Studies", value: "Business Studies" },
  { label: "Psychology", value: "Psychology" },
  { label: "Sociology", value: "Sociology" },
  { label: "Spanish", value: "Spanish" },
  { label: "French", value: "French" },
  { label: "German", value: "German" },
  { label: "Music", value: "Music" },
  { label: "Art", value: "Art" },
  { label: "Physical Education", value: "Physical Education" },
];

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ profile, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    email: profile.email || "",
    phone: profile.phone || "",
    about: profile.about || "",
    education: profile.education || "",
    subjects: profile.subjects || [],
    hourly_rate: profile.hourly_rate || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData((prev) => ({ ...prev, hourly_rate: value }));
    }
  };
  
  // Fixed - this function expects an array of Option objects and extracts their values
  const handleSubjectChange = (options: Option[]) => {
    const selectedValues = options.map(option => option.value);
    setFormData((prev) => ({ ...prev, subjects: selectedValues }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Convert hourly_rate to number
      const dataToSubmit = {
        ...formData,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
      };
      
      const updatedProfile = await updateProfile(profile.id, dataToSubmit);
      onSave(updatedProfile);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert string array to Option array for MultiSelect
  const selectedSubjectOptions = formData.subjects.map(subject => ({
    label: subject,
    value: subject
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g., +1 123-456-7890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="about">About</Label>
            <Textarea
              id="about"
              name="about"
              value={formData.about}
              onChange={handleChange}
              placeholder="Tell students about yourself, your teaching style, and experience..."
              rows={5}
            />
          </div>

          {profile.role === "tutor" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="education">Education & Qualifications</Label>
                <Textarea
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  placeholder="Share your educational background and qualifications..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjects">Subjects You Teach</Label>
                {/* Use a simple select with multiple selection instead */}
                <div className="relative">
                  <select
                    id="subjects"
                    multiple
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.subjects}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
                      setFormData(prev => ({ ...prev, subjects: selectedOptions }));
                    }}
                  >
                    {subjectOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hold Ctrl (or Cmd) to select multiple subjects
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    id="hourly_rate"
                    name="hourly_rate"
                    value={formData.hourly_rate}
                    onChange={handleRateChange}
                    className="pl-7"
                    placeholder="e.g., 25"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ProfileEditForm;
