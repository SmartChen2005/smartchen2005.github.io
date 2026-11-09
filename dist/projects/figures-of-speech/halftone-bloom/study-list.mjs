export const studyIds = ['exposure', 'lunar', 'botanical', 'shoal', 'tide'];
export const loadStudy = id => {
  if (!studyIds.includes(id)) return Promise.reject(new Error('Unknown halftone study'));
  return import(`./sources/${id}.mjs`);
};
