import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Register from "./pages/Register";
import LecturerRegister from "./pages/LecturerRegister";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import LecturerCourses from "./pages/LecturerCourses";
import LecturerStudents from "./pages/LecturerStudents";
import LecturerSchedule from "./pages/LecturerSchedule";
import LecturerSessions from "./pages/LecturerSessions";
import LecturerMonitoring from "./pages/LecturerMonitoring";
import LecturerRiskMonitor from "./pages/LecturerRiskMonitor";
import LecturerReports from "./pages/LecturerReports";
import LecturerProfile from "./pages/LecturerProfile";
import StudentCourses from "./pages/StudentCourses";
import StudentAttendance from "./pages/StudentAttendance";
import StudentSchedule from "./pages/StudentSchedule";
import StudentWarnings from "./pages/StudentWarnings";
import StudentProfile from "./pages/StudentProfile";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/LecturerRegister" element={<LecturerRegister />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
        <Route path="/lecturer/courses" element={<LecturerCourses />} />
        <Route path="/lecturer/students" element={<LecturerStudents />} />
        <Route path="/lecturer/schedule" element={<LecturerSchedule />} />
        <Route path="/lecturer/sessions" element={<LecturerSessions />} />
        <Route path="/lecturer/monitoring" element={<LecturerMonitoring />} />
        <Route path="/lecturer/risk-monitor" element={<LecturerRiskMonitor />} />
        <Route path="/lecturer/reports" element={<LecturerReports />} />
        <Route path="/lecturer/profile" element={<LecturerProfile />} />
        <Route path="/student/courses" element={<StudentCourses />} />
        <Route path="/student/attendance" element={<StudentAttendance />} />
        <Route path="/student/schedule" element={<StudentSchedule />} />
        <Route path="/student/warnings" element={<StudentWarnings />} />
        <Route path="/student/profile" element={<StudentProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
