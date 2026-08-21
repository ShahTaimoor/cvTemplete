import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../services/api';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.login(credentials);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.register(payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.me();
    return data;
  } catch {
    return rejectWithValue('Session expired');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await authAPI.logout();
  } catch {
    // Clear local state regardless — a failed logout request shouldn't
    // leave the user stuck looking "logged in" on this device.
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    // The auth cookie is httpOnly — this client can never read it directly,
    // so "logged in" is determined entirely by whether /me succeeds.
    // authChecked tracks whether that initial app-boot check has settled
    // (success or failure), so routes can wait for a real answer instead
    // of treating "haven't checked yet" as "logged out".
    authChecked: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload;
        s.authChecked = true;
      })
      .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(registerUser.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(registerUser.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload;
        s.authChecked = true;
      })
      .addCase(registerUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload; s.authChecked = true; })
      .addCase(fetchMe.rejected, (s) => { s.user = null; s.authChecked = true; })
      .addCase(logoutUser.fulfilled, (s) => { s.user = null; })
      .addCase(logoutUser.rejected, (s) => { s.user = null; });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
