
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, X } from "lucide-react";
import { AvailabilitySchedule, TimeSlot, updateTutorAvailability } from "@/services/profile.service";
import { toast } from "@/hooks/use-toast";

interface AvailabilitySchedulerProps {
  tutorId: string;
  initialAvailability: AvailabilitySchedule;
  onUpdate: (newAvailability: AvailabilitySchedule) => void;
}

const weekdays = [
  "monday", 
  "tuesday", 
  "wednesday", 
  "thursday", 
  "friday", 
  "saturday", 
  "sunday"
];

const AvailabilityScheduler: React.FC<AvailabilitySchedulerProps> = ({ 
  tutorId, 
  initialAvailability, 
  onUpdate 
}) => {
  const [availability, setAvailability] = useState<AvailabilitySchedule>(initialAvailability || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addTimeSlot = (day: string) => {
    const dayKey = day as keyof AvailabilitySchedule;
    const newAvailability = { ...availability };
    
    if (!newAvailability[dayKey]) {
      newAvailability[dayKey] = [];
    }
    
    // Add a new empty time slot
    newAvailability[dayKey]?.push({ start: "09:00", end: "17:00" });
    setAvailability(newAvailability);
  };

  const removeTimeSlot = (day: string, index: number) => {
    const dayKey = day as keyof AvailabilitySchedule;
    const newAvailability = { ...availability };
    
    if (newAvailability[dayKey] && newAvailability[dayKey]!.length > index) {
      newAvailability[dayKey] = [
        ...newAvailability[dayKey]!.slice(0, index),
        ...newAvailability[dayKey]!.slice(index + 1)
      ];
      
      if (newAvailability[dayKey]!.length === 0) {
        delete newAvailability[dayKey];
      }
      
      setAvailability(newAvailability);
    }
  };

  const updateTimeSlot = (day: string, index: number, field: 'start' | 'end', value: string) => {
    const dayKey = day as keyof AvailabilitySchedule;
    const newAvailability = { ...availability };
    
    if (newAvailability[dayKey] && newAvailability[dayKey]!.length > index) {
      const updatedSlots = [...newAvailability[dayKey]!];
      updatedSlots[index] = { ...updatedSlots[index], [field]: value };
      newAvailability[dayKey] = updatedSlots;
      setAvailability(newAvailability);
    }
  };

  const validateTimeSlots = () => {
    let isValid = true;
    
    for (const day of weekdays) {
      const dayKey = day as keyof AvailabilitySchedule;
      const slots = availability[dayKey];
      
      if (slots && slots.length > 0) {
        // Check each slot has valid start and end times
        for (const slot of slots) {
          if (!slot.start || !slot.end) {
            toast({
              title: "Error",
              description: `Please set both start and end times for all slots on ${day}.`,
              variant: "destructive",
            });
            isValid = false;
            break;
          }
          
          // Check end time is after start time
          if (slot.start >= slot.end) {
            toast({
              title: "Error",
              description: `End time must be after start time on ${day}.`,
              variant: "destructive",
            });
            isValid = false;
            break;
          }
        }
        
        // Check for overlapping slots
        if (slots.length > 1) {
          // Sort slots by start time
          const sortedSlots = [...slots].sort((a, b) => 
            a.start.localeCompare(b.start)
          );
          
          for (let i = 0; i < sortedSlots.length - 1; i++) {
            if (sortedSlots[i].end > sortedSlots[i + 1].start) {
              toast({
                title: "Error",
                description: `You have overlapping time slots on ${day}.`,
                variant: "destructive",
              });
              isValid = false;
              break;
            }
          }
        }
      }
      
      if (!isValid) break;
    }
    
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateTimeSlots()) return;
    
    setIsSubmitting(true);
    try {
      const updatedProfile = await updateTutorAvailability(tutorId, availability);
      onUpdate(availability);
    } catch (error) {
      console.error("Failed to update availability:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Your Availability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {weekdays.map((day) => (
            <div key={day} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">{formatDay(day)}</h3>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => addTimeSlot(day)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Time Slot
                </Button>
              </div>
              
              {availability[day as keyof AvailabilitySchedule]?.length ? (
                <div className="space-y-3">
                  {availability[day as keyof AvailabilitySchedule]?.map((slot, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="grid grid-cols-2 gap-4 flex-1">
                        <div>
                          <Label htmlFor={`${day}-start-${index}`}>Start Time</Label>
                          <Input
                            id={`${day}-start-${index}`}
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateTimeSlot(day, index, 'start', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${day}-end-${index}`}>End Time</Label>
                          <Input
                            id={`${day}-end-${index}`}
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateTimeSlot(day, index, 'end', e.target.value)}
                          />
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost"
                        className="mt-6"
                        onClick={() => removeTimeSlot(day, index)}
                      >
                        <X className="h-5 w-5 text-gray-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No availability set for {formatDay(day)}. Click "Add Time Slot" to add your available hours.
                </p>
              )}
            </div>
          ))}
          
          <Button 
            className="w-full mt-6" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Availability"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityScheduler;
