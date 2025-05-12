
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { createBooking } from "@/services/booking.service";
import { useNavigate } from "react-router-dom";

interface BookTutorButtonProps {
  tutor: any;
  className?: string;
}

const BookTutorButton = ({ tutor, className }: BookTutorButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Generate time slots from 8 AM to 8 PM
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const hourStr = hour.toString().padStart(2, "0");
    return `${hourStr}:00`;
  });

  const calculateEndTime = (start: string) => {
    if (!start) return "";
    
    // Default to 1 hour session
    const [hours, minutes] = start.split(":").map(Number);
    const endHour = (hours + 1) % 24;
    return `${endHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    setEndTime(calculateEndTime(time));
  };

  const handleBooking = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!date || !startTime || !endTime || !selectedSubject) {
      return;
    }

    setIsLoading(true);
    try {
      // Format date and times for API
      const formattedDate = format(date, "yyyy-MM-dd");
      const startDateTime = `${formattedDate}T${startTime}:00`;
      const endDateTime = `${formattedDate}T${endTime}:00`;
      
      await createBooking(
        user.id,
        tutor.id,
        startDateTime,
        endDateTime,
        selectedSubject,
        tutor.hourly_rate || 40,
        notes
      );
      
      setIsOpen(false);
      navigate("/student/bookings");
    } catch (error) {
      console.error("Failed to book tutor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormComplete = date && startTime && endTime && selectedSubject;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setDate(undefined);
      setStartTime("");
      setEndTime("");
      setSelectedSubject("");
      setNotes("");
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className={cn("w-full", className)}>Book Tutor</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book a Session with {tutor.full_name}</DialogTitle>
          <DialogDescription>
            Schedule a one-on-one tutoring session. You'll only be charged after
            the tutor confirms your booking.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {tutor.subjects?.map((subject: string) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Select value={startTime} onValueChange={handleStartTimeChange}>
                <SelectTrigger id="start-time">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={`start-${time}`} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="end-time">End Time</Label>
              <Select 
                value={endTime} 
                onValueChange={setEndTime}
                disabled={!startTime}
              >
                <SelectTrigger id="end-time">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots
                    .filter((time) => time > startTime)
                    .map((time) => (
                      <SelectItem key={`end-${time}`} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Any specific topics you'd like to cover?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <div className="w-full flex flex-col">
            <div className="mb-4 p-3 bg-gray-50 rounded-md text-center">
              <p className="text-sm text-gray-500">Session Rate</p>
              <p className="text-lg font-semibold">${tutor.hourly_rate || 40}/hour</p>
            </div>
            <Button 
              onClick={handleBooking} 
              disabled={!isFormComplete || isLoading}
              className="w-full"
            >
              {isLoading ? "Booking..." : "Book Session"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookTutorButton;
