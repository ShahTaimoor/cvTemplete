import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { resumeAPI } from '../services/api';

export const fetchResumes = createAsyncThunk('resume/list', async () => {
  const { data } = await resumeAPI.list();
  return data;
});

export const fetchResume = createAsyncThunk('resume/get', async (id) => {
  const { data } = await resumeAPI.get(id);
  return data;
});

export const saveResume = createAsyncThunk(
  'resume/save',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await resumeAPI.update(id, payload);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to save changes — please check your connection.'
      );
    }
  }
);

const resumeSlice = createSlice({
  name: 'resume',
  initialState: {
    list: [],
    current: null,
    saving: false,
    lastSaved: null,
    error: null,
  },
  reducers: {
    setCurrentResume: (state, action) => {
      state.current = action.payload;
    },
    updateCurrentField: (state, action) => {
      if (!state.current) return;
      const { path, value } = action.payload;
      if (path.includes('.')) {
        const [root, ...rest] = path.split('.');
        let obj = state.current[root];
        for (let i = 0; i < rest.length - 1; i++) obj = obj[rest[i]];
        obj[rest[rest.length - 1]] = value;
      } else {
        state.current[path] = value;
      }
    },
    setSectionOrder: (state, action) => {
      if (state.current) state.current.sectionOrder = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResumes.fulfilled, (s, a) => { s.list = a.payload; })
      .addCase(fetchResume.fulfilled, (s, a) => { s.current = a.payload; })
      .addCase(saveResume.pending, (s) => { s.saving = true; s.error = null; })
      .addCase(saveResume.fulfilled, (s, a) => {
        s.saving = false;
        s.current = a.payload;
        s.lastSaved = new Date().toISOString();
        s.error = null;
      })
      .addCase(saveResume.rejected, (s, a) => {
        s.saving = false;
        s.error = a.payload;
      });
  },
});

export const { setCurrentResume, updateCurrentField, setSectionOrder } = resumeSlice.actions;
export default resumeSlice.reducer;
