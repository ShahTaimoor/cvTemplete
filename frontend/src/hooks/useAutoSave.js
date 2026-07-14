import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { saveResume } from '../store/resumeSlice';

export const useAutoSave = (resume, delay = 2000) => {
  const dispatch = useDispatch();
  const timer = useRef(null);
  const lastPayload = useRef(null);

  useEffect(() => {
    if (!resume?._id) return;

    const payload = JSON.stringify(resume);
    if (payload === lastPayload.current) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      lastPayload.current = payload;
      dispatch(
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
    }, delay);

    return () => clearTimeout(timer.current);
  }, [resume, dispatch, delay]);
};
