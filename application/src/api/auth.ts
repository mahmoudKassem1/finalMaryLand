import apiClient from './client';

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  gender?: string;
  street?: string;
  aptNumber?: string;
  city?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AddressPayload {
  street: string;
  city?: string;
  aptNumber?: string;
  phone?: string;
  isDefault?: boolean;
}

export interface AuthResponse {
  token: string;
  user?: any;
}

export const authApi = {
  startSignup: async (data: SignupPayload & { phoneConfirmed: boolean }): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/signup', data);
    return res.data;
  },
  verifySignup: async (email: string, otp: string): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/signup/verify', { email, otp });
    return res.data;
  },

  // POST /auth/login
  login: async (credentials: LoginPayload): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },

  // POST /auth/forget-password
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/forget-password', { email });
    return res.data;
  },

  // PUT /auth/reset-password/:resettoken
  resetPassword: async (resetToken: string, password: string): Promise<{ message: string }> => {
    const res = await apiClient.put(`/auth/reset-password/${resetToken}`, { password });
    return res.data;
  },

  // GET /users/profile
  getProfile: async () => {
    const res = await apiClient.get('/users/profile');
    return res.data;
  },

  // PUT /users/profile
  updateProfile: async (data: Partial<SignupPayload> & { oldPassword?: string }) => {
    const res = await apiClient.put('/users/profile', data);
    return res.data;
  },

  // POST /users/address
  addAddress: async (address: AddressPayload) => {
    const res = await apiClient.post('/users/address', address);
    return res.data;
  },

  // PUT /users/address/:id
  updateAddress: async (id: string, address: Partial<AddressPayload>) => {
    const res = await apiClient.put(`/users/address/${id}`, address);
    return res.data;
  },

  // DELETE /users/address/:id
  deleteAddress: async (id: string) => {
    const res = await apiClient.delete(`/users/address/${id}`);
    return res.data;
  },
};

export default authApi;
