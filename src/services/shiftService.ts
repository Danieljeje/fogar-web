import { apiRequest } from "./apiClient";

export interface Shift {
  id: number;
  member: {
    id: number;
    firstName: string;
    lastName: string;
  };
  serviceType: string;
  serviceDate: string; 
  serviceTime: string;
  department: string;
  role: string;
  venue?: string;
  coordinator?: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
}

export type CreateShiftPayload = {
  memberId: number;
  serviceType: string;
  serviceDate: string; 
  serviceTime: string;
  department: string;
  role: string;
  venue?: string;
  coordinator?: string;
};

export const shiftService = {
  create(payload: CreateShiftPayload): Promise<Shift> {
    return apiRequest<Shift>("/api/shifts", {
      method: "POST",
      body: {
        ...payload,
        memberId: String(payload.memberId),
      },
    });
  },

  getAll(): Promise<Shift[]> {
    return apiRequest<Shift[]>("/api/shifts");
  },

  getMine(): Promise<Shift[]> {
    return apiRequest<Shift[]>("/api/shifts/mine");
  },

  respond(id: number, status: "ACCEPTED" | "DECLINED"): Promise<Shift> {
    return apiRequest<Shift>(`/api/shifts/${id}/respond`, {
      method: "PUT",
      body: { status },
    });
  },

  delete(id: number): Promise<void> {
    return apiRequest<void>(`/api/shifts/${id}`, { method: "DELETE" });
  },
};