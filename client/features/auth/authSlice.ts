import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/lib/api-client';

interface User {
  id:        string;
  firstName: string;
  lastName:  string;
  email:     string;
  role:      string;
}

interface AuthState {
  user:            User | null;
  isAuthenticated: boolean;
  loading:         boolean;
  error:           string | null;
}

const initialState: AuthState = {
  user:            null,
  isAuthenticated: false,
  loading:         false,
  error:           null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/auth/login', credentials);
      if (typeof window !== 'undefined')
        localStorage.setItem('accessToken', data.data.accessToken);
      return data.data.user as User;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    userData: { firstName: string; lastName: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await apiClient.post('/auth/register', userData);
      if (typeof window !== 'undefined')
        localStorage.setItem('accessToken', data.data.accessToken);
      return data.data.user as User;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Registration failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get('/auth/me');
      return data.data as User;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    if (typeof window !== 'undefined') localStorage.removeItem('accessToken');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(login.fulfilled, (s, a) => { s.loading = false; s.isAuthenticated = true;  s.user = a.payload; s.error = null; })
      .addCase(login.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })

      .addCase(register.pending,   (s) => { s.loading = true;  s.error = null; })
      .addCase(register.fulfilled, (s, a) => { s.loading = false; s.isAuthenticated = true;  s.user = a.payload; s.error = null; })
      .addCase(register.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })

      .addCase(fetchCurrentUser.fulfilled, (s, a) => { s.isAuthenticated = true;  s.user = a.payload; })
      .addCase(fetchCurrentUser.rejected,  (s)    => { s.isAuthenticated = false; s.user = null; })

      .addCase(logout.fulfilled, (s) => { s.user = null; s.isAuthenticated = false; s.error = null; });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
