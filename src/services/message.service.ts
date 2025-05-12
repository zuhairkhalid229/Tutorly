
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "@/hooks/use-toast";

export const sendMessage = async (messageData: { sender_id: string, receiver_id: string, content: string }) => {
  try {
    const newMessage = {
      ...messageData,
      id: uuidv4(),
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert([newMessage])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Error sending message:", error);
    toast({
      title: "Error sending message",
      description: error.message || "Failed to send message. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
};

export const getMessages = async (userId: string, otherUserId: string) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    // Filter to get only messages between these two users
    const filteredMessages = data?.filter(msg => 
      (msg.sender_id === userId && msg.receiver_id === otherUserId) ||
      (msg.sender_id === otherUserId && msg.receiver_id === userId)
    );
    
    // Mark messages sent by other user as read
    const messagesToUpdate = filteredMessages?.filter(msg => 
      msg.sender_id === otherUserId && 
      msg.receiver_id === userId && 
      !msg.is_read
    ) || [];
    
    if (messagesToUpdate.length > 0) {
      const promises = messagesToUpdate.map(msg => 
        supabase
          .from('messages')
          .update({ is_read: true })
          .eq('id', msg.id)
      );
      
      await Promise.all(promises);
    }
    
    return filteredMessages || [];
  } catch (error: any) {
    console.error("Error getting messages:", error);
    toast({
      title: "Error retrieving messages",
      description: error.message || "Failed to load messages. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
};

export const getConversation = async (userId: string, otherUserId: string) => {
  try {
    // Get all messages between these two users
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    
    // Mark messages from other user as read
    const messagesToUpdate = data?.filter(msg => 
      msg.sender_id === otherUserId && 
      msg.receiver_id === userId && 
      !msg.is_read
    ) || [];
    
    if (messagesToUpdate.length > 0) {
      for (const msg of messagesToUpdate) {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('id', msg.id);
          
        if (updateError) console.error("Error marking message as read:", updateError);
      }
    }
    
    return data || [];
  } catch (error: any) {
    console.error("Error getting conversation:", error);
    toast({
      title: "Error retrieving conversation",
      description: error.message || "Failed to load conversation. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
};

export const getConversations = async (userId: string) => {
  try {
    // Get all messages for this user
    const { data: allMessages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Get unique conversation partners
    const conversations = new Map();
    
    // Process each message
    for (const msg of allMessages || []) {
      // Determine the other person in the conversation
      const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      
      // Skip if we've already processed this conversation partner
      if (conversations.has(otherId)) continue;
      
      // Get profile info for this user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherId)
        .single();
        
      if (profileError) {
        console.error("Error getting profile:", profileError);
        continue; // Skip this conversation if we can't get the profile
      }
      
      // Get the most recent message in this conversation
      const { data: lastMessages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (msgError || !lastMessages || lastMessages.length === 0) {
        console.error("Error getting last message:", msgError);
        continue;
      }
      
      const lastMessage = lastMessages[0];
      
      // Get count of unread messages from this user
      const { count, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', otherId)
        .eq('receiver_id', userId)
        .eq('is_read', false);
        
      if (countError) {
        console.error("Error counting unread messages:", countError);
        continue;
      }
      
      // Add to our conversations map
      conversations.set(otherId, {
        id: otherId,
        name: profile?.full_name || 'Unknown User',
        image: profile?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'U')}&background=random`,
        lastMessage: lastMessage.content,
        lastMessageTime: lastMessage.created_at,
        unreadCount: count || 0,
        isOnline: false // We don't have real-time online status for now
      });
    }
    
    return Array.from(conversations.values());
  } catch (error: any) {
    console.error("Error getting conversations:", error);
    toast({
      title: "Error retrieving conversations",
      description: error.message || "Failed to load your conversations. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
};

export const markAsRead = async (messageId: string) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .select();
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error("Error marking message as read:", error);
    throw error;
  }
};

export const getUnreadCount = async (userId: string) => {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);
    
    if (error) throw error;
    return { unreadCount: count || 0 };
  } catch (error: any) {
    console.error("Error getting unread count:", error);
    return { unreadCount: 0 };
  }
};
