export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "seller";
  createdAt?: string;
  updatedAt?: string;
}
