import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { saveResume } from '../store/resumeSlice';
import { useToast } from './useToast';

export const useAutoSave = (resume, delay = 2000) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const timer = useRef(null);
  const lastPayload = useRef(null);
  // Tracks whether we've already surfaced an error for the current run of
  // failures, so a user who keeps typing during an outage sees one toast,
  // not one per debounce tick. Clears the moment a save succeeds again.
  const hasShownErrorRef = useRef(false);

  useEffect(() => {
    if (!resume?._id) return;

    const payload = JSON.stringify(resume);
    if (payload === lastPayload.current) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      lastPayload.current = payload;
      const result = await dispatch(
        saveResume({
          id: resume._id,
          payload: {
            title: resume.title,
            personal: resume.personal,
            summary: resume.summary,
            education: resume.education,
            experience: resume.experience,
            skills: resume.skills,
            projects: resume.projects,
            certifications: resume.certifications,
            sectionOrder: resume.sectionOrder,
            templateSlug: resume.templateSlug,
            theme: resume.theme,
          },
        })
      );

      if (saveResume.rejected.match(result)) {
        if (!hasShownErrorRef.current) {
          hasShownErrorRef.current = true;
          toast.error(result.payload || 'Failed to save changes — please check your connection.');
        }
      } else {
        hasShownErrorRef.current = false;
      }
    }, delay);

    return () => clearTimeout(timer.current);
  }, [resume, dispatch, delay, toast]);
};
