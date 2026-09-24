import { supabase } from '../supabaseClient';

export const enrollInCourse = async (enrollmentCode) => {
  const { data, error } = await supabase.rpc('enroll_student_in_course', {
    p_enrollment_code: enrollmentCode,
  });

  if (error) {
    console.error('RPC Error:', error.message);
    return { success: false, message: error.message };
  }

  return data; 
};