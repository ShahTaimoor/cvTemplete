import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import resumeReducer from './resumeSlice';
import templateReducer from './templateSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    resume: resumeReducer,
    templates: templateReducer,
  },
});
