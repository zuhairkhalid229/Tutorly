
import api from './api';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  subject?: string;
  bio?: string;
}

export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data;
  
  // Store token in localStorage
  localStorage.setItem('token', token);
  
  return { token, user };
};

export const register = async (data: RegisterData, role: 'student' | 'tutor') => {
  const response = await api.post('/auth/register', { ...data, role });
  const { token, user } = response.data;
  
  // Store token in localStorage
  localStorage.setItem('token', token);
  
  return { token, user };
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return null;
  }
  
  // For a real application, we'd decode the token or make an API call
  // to verify the token and get the current user data
  
  // For now, we'll just return the token presence
  return { token };
};
