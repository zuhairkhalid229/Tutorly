
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Video, MessageSquare, Book, User, Clock } from "lucide-react";
import { format } from "date-fns";

interface VirtualClassroomProps {
  bookingId: string;
  tutorName: string;
  tutorImage: string;
  studentName: string;
  studentImage: string;
  subject: string;
  startTime: string;
  endTime: string;
  onEndSession: () => void;
}

const VirtualClassroom = ({
  bookingId,
  tutorName,
  tutorImage,
  studentName,
  studentImage,
  subject,
  startTime,
  endTime,
  onEndSession
}: VirtualClassroomProps) => {
  const [activeTab, setActiveTab] = useState("video");
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [messages, setMessages] = useState<{id: string; sender: string; text: string; time: string}[]>([]);
  const [message, setMessage] = useState("");
  const [whiteboard, setWhiteboard] = useState<{lines: any[]}>({ lines: [] });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState("");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Format date
  const formattedStart = format(new Date(startTime), "h:mm a");
  const formattedEnd = format(new Date(endTime), "h:mm a");
  
  // Connect to virtual classroom (simulated)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnecting(false);
      toast({
        title: "Connected to session",
        description: "You've joined the virtual classroom",
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Session timer
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(endTime);
      const diff = end.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining("Session ended");
        return;
      }
      
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${minutes}m ${seconds}s remaining`);
    };
    
    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(timer);
  }, [endTime]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Draw on canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all lines
    whiteboard.lines.forEach(line => {
      if (line.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(line[0].x, line[0].y);
      
      for (let i = 1; i < line.length; i++) {
        ctx.lineTo(line[i].x, line[i].y);
      }
      
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [whiteboard]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentLine([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentLine(prev => [...prev, { x, y }]);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    setWhiteboard(prev => ({
      lines: [...prev.lines, currentLine]
    }));
    setCurrentLine([]);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: Math.random().toString(36).substring(7),
      sender: "You",
      text: message,
      time: format(new Date(), "h:mm a")
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Simulate response after a short delay
    setTimeout(() => {
      const responseMessages = [
        "That's a great point!",
        "Let me explain that concept further...",
        "Do you have any questions about that?",
        "Let's try a different approach to this problem.",
        "You're making excellent progress!"
      ];
      
      const responseMessage = {
        id: Math.random().toString(36).substring(7),
        sender: tutorName,
        text: responseMessages[Math.floor(Math.random() * responseMessages.length)],
        time: format(new Date(), "h:mm a")
      };
      
      setMessages(prev => [...prev, responseMessage]);
    }, 1000 + Math.random() * 2000);
    
    setMessage("");
  };

  const handleClearWhiteboard = () => {
    setWhiteboard({ lines: [] });
  };

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="animate-pulse flex flex-col items-center">
          <Video className="h-16 w-16 text-tutorly-accent mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connecting to Session</h2>
          <p className="text-gray-500">Setting up your virtual classroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[85vh]">
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{subject} Session</CardTitle>
              <CardDescription>
                {formattedStart} - {formattedEnd} • <span className="text-tutorly-accent">{timeRemaining}</span>
              </CardDescription>
            </div>
            <Button variant="destructive" onClick={onEndSession}>End Session</Button>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
        <div className="md:col-span-2 flex flex-col space-y-4">
          <Tabs defaultValue="video" value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
            <TabsList className="w-full justify-start mb-2">
              <TabsTrigger value="video" className="flex items-center">
                <Video className="h-4 w-4 mr-2" />
                Video
              </TabsTrigger>
              <TabsTrigger value="whiteboard" className="flex items-center">
                <Book className="h-4 w-4 mr-2" />
                Whiteboard
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="video" className="flex-grow flex flex-col">
              <Card className="flex-grow flex flex-col">
                <CardContent className="flex-grow p-0 relative">
                  <div className="bg-gray-800 w-full h-full flex items-center justify-center rounded-md overflow-hidden">
                    {isVideoOff ? (
                      <div className="flex flex-col items-center justify-center">
                        <User className="h-16 w-16 text-gray-400 mb-2" />
                        <p className="text-gray-400">Camera is off</p>
                      </div>
                    ) : (
                      // Show a placeholder gradient as a video simulation
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                        <div className="relative z-10">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                              <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-[320px] h-[240px] rounded-lg flex items-center justify-center">
                                <Avatar className="h-24 w-24">
                                  <AvatarImage src={tutorImage} alt={tutorName} />
                                  <AvatarFallback>{tutorName.charAt(0)}</AvatarFallback>
                                </Avatar>
                              </div>
                              <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
                                {tutorName}
                              </div>
                            </div>
                            <div className="relative">
                              <div className="bg-gradient-to-br from-green-500 to-teal-600 w-[320px] h-[240px] rounded-lg flex items-center justify-center">
                                <Avatar className="h-24 w-24">
                                  <AvatarImage src={studentImage} alt={studentName} />
                                  <AvatarFallback>{studentName.charAt(0)}</AvatarFallback>
                                </Avatar>
                              </div>
                              <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
                                {studentName}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center py-4 space-x-4">
                  <Button 
                    variant={isMuted ? "destructive" : "outline"} 
                    size="icon" 
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </Button>
                  <Button 
                    variant={isVideoOff ? "destructive" : "outline"} 
                    size="icon"
                    onClick={() => setIsVideoOff(!isVideoOff)}
                  >
                    {isVideoOff ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setActiveTab("whiteboard")}
                  >
                    <Book className="h-6 w-6" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="whiteboard" className="flex-grow flex flex-col">
              <Card className="flex-grow flex flex-col">
                <CardContent className="flex-grow p-2 relative">
                  <div className="bg-white w-full h-full rounded-md shadow-inner overflow-hidden border">
                    <canvas 
                      ref={canvasRef}
                      width={900}
                      height={500}
                      className="w-full h-full cursor-crosshair"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between py-4">
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleClearWhiteboard}>Clear Board</Button>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("video")}
                  >
                    Back to Video
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex flex-col space-y-4">
          <Card className="flex-grow flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto p-3">
              <div className="space-y-4">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">
                    Session started. You can chat here during the lesson.
                  </p>
                </div>
                
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.sender === "You" 
                        ? "bg-tutorly-accent text-white ml-8" 
                        : "bg-gray-100 mr-8"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{msg.sender}</span>
                      <span className="text-xs opacity-70">{msg.time}</span>
                    </div>
                    <p>{msg.text}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="p-3">
              <div className="flex w-full space-x-2">
                <Input 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage} size="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VirtualClassroom;
