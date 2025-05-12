
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { sendMessage } from "@/services/message.service";
import { toast } from "@/hooks/use-toast";

interface MessageTutorButtonProps {
  tutor: any;
  className?: string;
}

const MessageTutorButton = ({ tutor, className }: MessageTutorButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Empty Message",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      await sendMessage({
        sender_id: user.id,
        receiver_id: tutor.id,
        content: message.trim(),
      });

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });

      setIsOpen(false);
      setMessage("");
      
      // Navigate to messages page with this tutor preselected
      navigate(`/messages?tutor=${tutor.id}`);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          Message Tutor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Message {tutor.full_name}</DialogTitle>
          <DialogDescription>
            Send a message to this tutor about what you'd like to learn.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="resize-none"
          />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSendMessage}
            disabled={isSending || !message.trim()}
          >
            {isSending ? "Sending..." : "Send Message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageTutorButton;
