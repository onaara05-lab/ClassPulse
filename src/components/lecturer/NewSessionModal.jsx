import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

export default function NewSessionModal({ isOpen, onClose, onSubmit, courses = [] }) {
  const [formData, setFormData] = useState({
    courseId: '',
    sessionType: 'Lecture',
    durationMinutes: '15',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-[480px] overflow-hidden rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            New Attendance Session
          </h2>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Open a time-limited session for students to mark attendance.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Course
            </label>
            <div className="relative">
              <select
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                required
                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
              >
                <option value="" disabled>
                  Select course...
                </option>
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="csc301">CSC 301 - Data Structures</option>
                    <option value="csc401">CSC 401 - Software Engineering</option>
                    <option value="csc501">CSC 501 - Machine Learning</option>
                  </>
                )}
              </select>
              <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Session Type
            </label>
            <div className="relative">
              <select
                name="sessionType"
                value={formData.sessionType}
                onChange={handleChange}
                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
              >
                <option value="Lecture">Lecture</option>
                <option value="Practical / Lab">Practical / Lab</option>
                <option value="Tutorial">Tutorial</option>
              </select>
              <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Mark-in Window (Minutes) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Mark-in Window (minutes)
            </label>
            <div className="relative">
              <select
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleChange}
                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
              >
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
              <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-3 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-sm transition-colors text-center"
            >
              Open Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
