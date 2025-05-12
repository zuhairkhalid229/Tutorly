
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Send } from "lucide-react";
import { getConversations, getConversation, sendMessage } from "@/services/message.service";
import { Heading } from "@/components/ui/heading";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  name: string;
  image: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface MessagesPageProps {
  userType?: "student" | "tutor" | "admin";
}

const MessagesPage = ({ userType = "student" }: MessagesPageProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadConversations();
      
      // Check if a specific tutor/student was passed via query params
      const searchParams = new URLSearchParams(location.search);
      const tutorId = searchParams.get('tutor');
      const studentId = searchParams.get('student');
      
      if (tutorId || studentId) {
        const otherId = tutorId || studentId;
        fetchUserAndSelectConversation(otherId!);
      }
    }
  }, [user, location]);

  const fetchUserAndSelectConversation = async (userId: string) => {
    try {
      setIsLoading(true);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Create a user object from the profile
      const userObj: User = {
        id: profile.id,
        name: profile.full_name || 'Unknown User',
        image: profile.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'U')}&background=random`,
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        isOnline: false
      };
      
      setSelectedUser(userObj);
      
      // Load messages for this user
      const messagesData = await getConversation(user!.id, userId);
      setMessages(messagesData);
      
      // Also refresh the conversations list to include this new conversation if it's not there
      await loadConversations();
    } catch (error) {
      console.error("Error fetching user:", error);
      toast({
        title: "Error",
        description: "Failed to load user information",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const data = await getConversations(user.id);
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load your conversations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!user?.id || !selectedUser?.id) return;
    
    setIsLoading(true);
    try {
      const data = await getConversation(user.id, selectedUser.id);
      setMessages(data);
      
      // Update conversation to mark as read
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === selectedUser.id ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && selectedUser?.id) {
      loadMessages();
    }
  }, [selectedUser?.id]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUser || !user?.id || isSending) return;

    setIsSending(true);
    try {
      const messageData = {
        sender_id: user.id,
        receiver_id: selectedUser.id,
        content: messageText,
      };
      
      const newMessage = await sendMessage(messageData);
      setMessages(prev => [...prev, newMessage]);
      setMessageText("");
      
      // Update the conversation list
      setConversations(prevConversations => {
        const existingConvIndex = prevConversations.findIndex(conv => conv.id === selectedUser.id);
        
        if (existingConvIndex !== -1) {
          // Update existing conversation
          const updatedConvs = [...prevConversations];
          updatedConvs[existingConvIndex] = {
            ...updatedConvs[existingConvIndex],
            lastMessage: messageText,
            lastMessageTime: new Date().toISOString()
          };
          return updatedConvs;
        } else {
          // This is a new conversation, add it to the list
          return [
            {
              id: selectedUser.id,
              name: selectedUser.name,
              image: selectedUser.image,
              lastMessage: messageText,
              lastMessageTime: new Date().toISOString(),
              unreadCount: 0,
              isOnline: false
            },
            ...prevConversations
          ];
        }
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  // Format time for display
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, 'HH:mm');
  };
  
  // Format last message time for conversation list
  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="h-[calc(100vh-220px)] flex flex-col">
      <Heading 
        title="Messages" 
        description="Chat with your students and tutors"
      />
      
      <div className="flex flex-col md:flex-row shadow-sm rounded-lg overflow-hidden flex-grow mt-4">
        {/* Contacts List */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Chats</h2>
          </div>
          <div className="overflow-y-auto h-[calc(100%-60px)]">
            {isLoading && !conversations.length ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tutorly-accent"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No conversations yet
              </div>
            ) : (
              conversations.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`flex items-center p-4 cursor-pointer ${
                    selectedUser?.id === u.id
                      ? "bg-tutorly-light-blue"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={u.image} alt={u.name} />
                      <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {u.isOnline && (
                      <span className="absolute bottom-0 right-2 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{u.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{u.lastMessage}</p>
                  </div>
                  <div className="flex flex-col items-end ml-2">
                    <span className="text-xs text-gray-500">{formatLastMessageTime(u.lastMessageTime)}</span>
                    {u.unreadCount > 0 && (
                      <span className="bg-tutorly-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center mt-1">
                        {u.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedUser ? (
          <div className="flex-1 flex flex-col bg-gray-50">
            {/* Chat Header */}
            <div className="bg-white p-4 shadow-sm flex items-center">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={selectedUser.image} alt={selectedUser.name} />
                <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500">
                  {selectedUser.isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {isLoading && !messages.length ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-tutorly-accent"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 my-8">
                    No messages yet. Start a conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUserMessage = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isUserMessage ? "justify-end" : "justify-start"}`}
                      >
                        <Card className={`max-w-[75%] ${isUserMessage ? "bg-tutorly-accent text-white" : "bg-white"}`}>
                          <CardContent className="p-3">
                            <p>{msg.content}</p>
                            <div className={`text-xs mt-1 ${isUserMessage ? "text-white/70" : "text-gray-500"}`}>
                              {formatMessageTime(msg.created_at)}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t">
              <div className="flex items-center">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 mr-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage} 
                  size="icon"
                  disabled={isSending || !messageText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <div className="rounded-full bg-gray-200 h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-medium mb-2">No conversation selected</h3>
              <p className="text-gray-500 mb-4">
                Choose a conversation from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MessageSquare = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

export default MessagesPage;
