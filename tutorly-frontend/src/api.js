import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3306/api',
});

// Add a request interceptor to include the token for every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const registerUser = (userData) => API.post('/auth/register', userData);
export const loginUser = (userData) => API.post('/auth/login', userData);
export const fetchUserDetails = () => API.get('/users/me');
