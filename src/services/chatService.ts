import { apiRequest } from "./apiClient";

// ASSUMPTION: mirrors backend ChatThread/ChatMessage entities.
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
  // Admin view — every thread across every member.
  getAllThreads(): Promise<ChatThread[]> {
    return apiRequest<ChatThread[]>("/api/chat/threads");
  },

  // Member view — just their own thread(s).
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