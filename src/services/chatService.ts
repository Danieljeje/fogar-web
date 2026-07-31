import { apiRequest } from "./apiClient";


export interface ChatThread {
  id: number;
  member: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  prayerRequest?: {
    id: number;
    title: string;
  };
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
  };
  content: string;
  sentAt: string;
}

export const chatService = {

  getAllThreads(): Promise<ChatThread[]> {
    return apiRequest<ChatThread[]>("/api/chat/threads");
  },

 
  getMyThreads(): Promise<ChatThread[]> {
    return apiRequest<ChatThread[]>("/api/chat/threads/mine");
  },

  getMessages(threadId: number): Promise<ChatMessage[]> {
    return apiRequest<ChatMessage[]>(`/api/chat/threads/${threadId}/messages`);
  },

  sendMessage(threadId: number, content: string): Promise<ChatMessage> {
    return apiRequest<ChatMessage>(`/api/chat/threads/${threadId}/messages`, {
      method: "POST",
      body: { content },
    });
  },
};