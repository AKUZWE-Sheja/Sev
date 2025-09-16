import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig , AxiosResponse } from 'axios';

// Define shared types based on Prisma schema and backend responses
interface User {
  id: number;
  fname: string;
  lname: string;
  email: string;
  role: 'DONOR' | 'ACCEPTOR' | 'ADMIN';
  isVerified: boolean;
  address: string;
  createdAt: Date;
  location?: { longitude: number; latitude: number } | null;
}

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface FormData {
  fname: string;
  lname: string;
  email: string;
  password: string;
  address: string;
  role: 'DONOR' | 'ACCEPTOR';
  document?: File;
}

interface UpdateUserData {
  fname?: string;
  lname?: string;
  email?: string;
  address?: string;
}

interface UpdateLocationData {
  longitude: number;
  latitude: number;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface VerifyOtpData {
  userId: number;
  otpCode: string;
}

interface ResendOtpData {
  email: string;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  listingId?: number;
  requestId?: number;
  createdAt: string;
  sender: { id: number; fname: string; lname: string; email: string };
  receiver: { id: number; fname: string; lname: string; email: string };
}

interface SendMessageData {
  receiverId: number;
  content: string;
  listingId?: number;
  requestId?: number;
}

interface Listing {
  id: number;
  userId: number;
  title: string;
  description?: string;
  category: 'CLOTHING' | 'ELECTRONICS' | 'FOOD' | 'FURNITURE' | 'BOOKS' | 'HOUSEHOLD' | 'SPECIAL_REQUEST';
  status: 'ACTIVE' | 'CLAIMED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  location?: { longitude: number; latitude: number } | null;
}

interface CreateListingData {
  title: string;
  description?: string;
  category: 'CLOTHING' | 'ELECTRONICS' | 'FOOD' | 'FURNITURE' | 'BOOKS' | 'HOUSEHOLD' | 'SPECIAL_REQUEST';
}

interface UpdateListingData {
  title?: string;
  description?: string;
  category?: 'CLOTHING' | 'ELECTRONICS' | 'FOOD' | 'FURNITURE' | 'BOOKS' | 'HOUSEHOLD' | 'SPECIAL_REQUEST';
  status?: 'ACTIVE' | 'CLAIMED' | 'COMPLETED';
}

interface Request {
  id: number;
  userId: number;
  title: string;
  description?: string;
  category: 'CLOTHING' | 'ELECTRONICS' | 'FOOD' | 'FURNITURE' | 'BOOKS' | 'HOUSEHOLD' | 'SPECIAL_REQUEST';
  quantity?: number;
  status: 'OPEN' | 'FULFILLED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  location?: { longitude: number; latitude: number } | null;
}

interface CreateRequestData {
  title: string;
  description?: string;
  category: 'CLOTHING' | 'ELECTRONICS' | 'FOOD' | 'FURNITURE' | 'BOOKS' | 'HOUSEHOLD' | 'SPECIAL_REQUEST';
  quantity?: number;
}

interface UpdateRequestData {
  title?: string;
  description?: string;
  category?: 'CLOTHING' | 'ELECTRONICS' | 'FOOD' | 'FURNITURE' | 'BOOKS' | 'HOUSEHOLD' | 'SPECIAL_REQUEST';
  quantity?: number;
  status?: 'OPEN' | 'FULFILLED' | 'CLOSED';
}

interface Log {
  id: number;
  userId?: number;
  action: string;
  createdAt: string;
}

interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface GetUsersResponse {
  data: User[];
  meta: PaginationMeta;
}

export interface GetMessagesParams {
  listingId?: number;
  requestId?: number;
  page?: number;
  limit?: number;
}

interface GetMessagesResponse {
  data: Message[];
  meta: PaginationMeta;
}

export interface GetListingsParams {
  userId?: number;
  page?: number;
  limit?: number;
  category?: string;
}

interface GetListingsResponse {
  data: Listing[];
  meta: PaginationMeta;
}

export interface GetRequestsParams {
  userId?: number;
  page?: number;
  limit?: number;
  category?: string;
}

interface GetRequestsResponse {
  data: Request[];
  meta: PaginationMeta;
}

export interface GetLogsParams {
  page?: number;
  limit?: number;
}

interface GetLogsResponse {
  data: Log[];
  meta: PaginationMeta;
}

// Manually define a type that mimics AxiosInstance to resolve the import error
type CustomAxiosInstance = {
  create: typeof axios.create;
  interceptors: typeof axios.interceptors;
  get: typeof axios.get;
  post: typeof axios.post;
  put: typeof axios.put;
  delete: typeof axios.delete;
};

const API_URL = 'http://localhost:5000/api';

const api: CustomAxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");

    if (token) {
      // headers is guaranteed to exist in InternalAxiosRequestConfig
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    console.log(`Response error from ${error.config?.url}:`, {
      status: error.response?.status,
      data: error.response?.data,
    });
    if (error.response?.status === 401) {
      console.log('401 detected, clearing localStorage and redirecting to /login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = async ({ email, password }: LoginData): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', { email, password });
  const { token, user } = response.data;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  return response.data;
};

export const register = async (data: FormData): Promise<{ message: string; userId: number }> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const verifyOtp = async ({ userId, otpCode }: VerifyOtpData): Promise<{ message: string }> => {
  const response = await api.post('/auth/verify-otp', { userId, otpCode });
  const { token, user } = response.data;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  return response.data;
};

export const resendOtp = async ({ email }: ResendOtpData): Promise<{ message: string; userId: number }> => {
  const response = await api.post('/auth/resend-otp', { email });
  return response.data;
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// User endpoints
export const getUser = async (): Promise<User> => {
  const response = await api.get<User>(`/users/me`);
  return response.data;
};

export const getUsers = async (params: GetUsersParams = {}): Promise<GetUsersResponse> => {
  const response = await api.get<GetUsersResponse>('/users', { params });
  return { data: response.data.data, meta: response.data.meta };
};

export const updateUser = async (data: UpdateUserData): Promise<User> => {
  const response = await api.put<User>('/users/me', data);
  localStorage.setItem('user', JSON.stringify(response.data));
  return response.data;
};

export const updateUserLocation = async ({ longitude, latitude }: UpdateLocationData): Promise<{ message: string }> => {
  const response = await api.put('/users/me/location', { longitude, latitude });
  return response.data;
};

export const changePassword = async ({ currentPassword, newPassword }: ChangePasswordData): Promise<{ message: string; userId: number }> => {
  const response = await api.post('/users/me/change-password', { currentPassword, newPassword });
  return response.data;
};

export const deleteUser = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

// Listing endpoints
export const createListing = async (data: CreateListingData): Promise<Listing> => {
  const response = await api.post<Listing>('/listings', data);
  return response.data;
};

export const getListings = async (params: GetListingsParams = {}): Promise<GetListingsResponse> => {
  const response = await api.get<GetListingsResponse>('/listings', { params });
  return { data: response.data.data, meta: response.data.meta };
};

export const getListingById = async (id: number): Promise<Listing> => {
  const response = await api.get<Listing>(`/listings/${id}`);
  return response.data;
};

export const updateListing = async (id: number, data: UpdateListingData): Promise<Listing> => {
  const response = await api.put<Listing>(`/listings/${id}`, data);
  return response.data;
};

export const deleteListing = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete(`/listings/${id}`);
  return response.data;
};

// Request endpoints
export const createRequest = async (data: CreateRequestData): Promise<Request> => {
  const response = await api.post<Request>('/requests', data);
  return response.data;
};

export const getRequests = async (params: GetRequestsParams = {}): Promise<GetRequestsResponse> => {
  const response = await api.get<GetRequestsResponse>('/requests', { params });
  return { data: response.data.data, meta: response.data.meta };
};

export const getRequestById = async (id: number): Promise<Request> => {
  const response = await api.get<Request>(`/requests/${id}`);
  return response.data;
};

export const updateRequest = async (id: number, data: UpdateRequestData): Promise<Request> => {
  const response = await api.put<Request>(`/requests/${id}`, data);
  return response.data;
};

export const deleteRequest = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete(`/requests/${id}`);
  return response.data;
};

// Message endpoints
export const sendMessage = async (data: SendMessageData): Promise<Message> => {
  const response = await api.post<Message>('/messages', data);
  return response.data;
};

export const getMessages = async (params: GetMessagesParams = {}): Promise<GetMessagesResponse> => {
  const response = await api.get<GetMessagesResponse>('/messages', { params });
  return { data: response.data.data, meta: response.data.meta };
};

// Log endpoints
export const getLogs = async (params: GetLogsParams = {}): Promise<GetLogsResponse> => {
  const response = await api.get<GetLogsResponse>('/logs', { params });
  return { data: response.data.data, meta: response.data.meta };
};
