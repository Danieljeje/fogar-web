import { apiRequest } from "./apiClient";

export interface User {
  id: number;
  firebaseUid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  createdAt?: string;
}
export interface InviteMemberPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  role?: string;
}

export interface RegisterUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  role?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  role?: string;
}

export interface MemberCountResponse {
  totalMembers: number;
}

export const userService = {
  
  register(payload: RegisterUserPayload): Promise<User> {
    return apiRequest<User>("/api/users/register", {
      method: "POST",
      body: payload,
    });
  },

inviteMember(payload: InviteMemberPayload): Promise<User> {
  return apiRequest<User>("/api/users/invite", {
    method: "POST",
    body: payload,
  });
},


  getCurrentUser(): Promise<User> {
    return apiRequest<User>("/api/users/me");
  },

  
  getAllUsers(): Promise<User[]> {
    return apiRequest<User[]>("/api/users");
  },

  
  getUserById(id: number): Promise<User> {
    return apiRequest<User>(`/api/users/${id}`);
  },

  
  updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
    return apiRequest<User>(`/api/users/${id}`, {
      method: "PUT",
      body: payload,
    });
  },

 
  deleteUser(id: number): Promise<void> {
    return apiRequest<void>(`/api/users/${id}`, {
      method: "DELETE",
    });
  },


  countMembers(): Promise<MemberCountResponse> {
    return apiRequest<MemberCountResponse>("/api/users/count");
  },

  
  getDepartments(): Promise<string[]> {
    return apiRequest<string[]>("/api/users/departments");
  },
};



export const fetchMembers = async () => {
  const members = await userService.getAllUsers();

  return {
    content: members,
    totalElements: members.length,
    totalPages: 1,
  };
};

export const fetchDepartments = () => {
  return userService.getDepartments();
};

export const updateMember = (
  id: number,
  payload: UpdateUserPayload
) => {
  return userService.updateUser(id, payload);
};

export const deleteMember = (id: number) => {
  return userService.deleteUser(id);
};