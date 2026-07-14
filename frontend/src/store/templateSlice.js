import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { templateAPI } from '../services/api';
import { mergeTemplatesWithCatalog } from '../utils/mergeTemplates.js';

export const fetchTemplates = createAsyncThunk('templates/list', async (_, { getState }) => {
  const { data } = await templateAPI.list();
  const plan = getState().auth?.user?.subscription?.plan || 'free';
  return mergeTemplatesWithCatalog(data, plan);
});

const templateSlice = createSlice({
  name: 'templates',
  initialState: { items: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTemplates.pending, (s) => { s.loading = true; })
      .addCase(fetchTemplates.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
      });
  },
});

export default templateSlice.reducer;
