// import { Link } from "react-router-dom";
// import logo from "../assets/classpulse-logo.png";

// function StudentDashboard() {
//   return (
//     <div className="min-h-screen bg-background font-inter">
//       {/* Sidebar */}
//       <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-border bg-surface lg:block">
//         {/* Logo */}
//         <div className="flex h-18 items-center border-b border-border px-6">
//           <Link to="/">
//             <img
//               src={logo}
//               alt="ClassPulse"
//               className="h-20 w-auto object-contain"
//             />
//           </Link>
//         </div>

//         {/* Navigation */}
//         <nav className="px-4 py-6">
//           <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
//             Main Menu
//           </p>

//           <div className="space-y-1">
//             <Link
//               to="/student-dashboard"
//               className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-lg font-semibold text-primary"
//             >
//               <span>▣</span>
//               Dashboard
//             </Link>

//             <a
//               href="#courses"
//               className="flex items-center gap-3 rounded-lg px-4 py-3 text-lg font-medium text-text-secondary transition hover:bg-background hover:text-primary"
//             >
//               <span>▤</span>
//               My Courses
//             </a>

//             <a
//               href="#attendance"
//               className="flex items-center gap-3 rounded-lg px-4 py-3 text-lg font-medium text-text-secondary transition hover:bg-background hover:text-primary"
//             >
//               <span>✓</span>
//               Attendance
//             </a>

//             <a
//               href="#schedule"
//               className="flex items-center gap-3 rounded-lg px-4 py-3 text-lg font-medium text-text-secondary transition hover:bg-background hover:text-primary"
//             >
//               <span>◷</span>
//               Class Schedule
//             </a>

//             <a
//               href="#warnings"
//               className="flex items-center gap-3 rounded-lg px-4 py-3 text-lg font-medium text-text-secondary transition hover:bg-background hover:text-primary"
//             >
//               <span>⚠</span>
//               Warnings
//             </a>
//           </div>

//           <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
//             Account
//           </p>

//           <div className="space-y-1">
//             <a
//               href="#profile"
//               className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-text-secondary transition hover:bg-background hover:text-primary"
//             >
//               <span>●</span>
//               Profile
//             </a>

//             <Link
//               to="/login"
//               className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-text-secondary transition hover:bg-background hover:text-danger"
//             >
//               <span>↪</span>
//               Logout
//             </Link>
//           </div>
//         </nav>
//       </aside>

//       {/* Main Content */}
//       <main className="lg:ml-64">
//         {/* Top Bar */}
//         <header className="flex h-20 items-center justify-between border-b border-border bg-surface px-6 lg:px-8">
//           <div>
//             <h1 className="text-xl font-bold text-text-primary">
//               Student Dashboard
//             </h1>

//             <p className="text-sm text-text-secondary">
//               Track your attendance and stay on top of your classes.
//             </p>
//           </div>

//           {/* Profile */}
//           <div className="flex items-center gap-3">
//             <div className="hidden text-right sm:block">
//               <p className="text-sm font-semibold text-text-primary">
//                 John Doe
//               </p>

//               <p className="text-xs text-text-secondary">Student</p>
//             </div>

//             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-semibold text-primary">
//               JD
//             </div>
//           </div>
//         </header>

//         {/* Dashboard Content */}
//         <div className="p-6 lg:p-8">
//           {/* Welcome */}
//           <section className="mb-8">
//             <h2 className="text-2xl font-bold text-text-primary">
//               Welcome back, John 👋
//             </h2>

//             <p className="mt-1 text-sm text-text-secondary">
//               Here's an overview of your academic attendance.
//             </p>
//           </section>

//           {/* Statistics */}
//           <section
//             id="attendance"
//             className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
//           >
//             {/* Attendance */}
//             <div className="rounded-2xl border border-border bg-surface p-6">
//               <div className="mb-4 flex items-center justify-between">
//                 <p className="text-sm font-medium text-text-secondary">
//                   Overall Attendance
//                 </p>

//                 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary">
//                   %
//                 </div>
//               </div>

//               <h3 className="text-3xl font-bold text-text-primary">82%</h3>

//               <p className="mt-2 text-xs text-success">
//                 Above warning threshold
//               </p>
//             </div>

//             {/* Attended */}
//             <div className="rounded-2xl border border-border bg-surface p-6">
//               <div className="mb-4 flex items-center justify-between">
//                 <p className="text-sm font-medium text-text-secondary">
//                   Classes Attended
//                 </p>

//                 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-success">
//                   ✓
//                 </div>
//               </div>

//               <h3 className="text-3xl font-bold text-text-primary">41</h3>

//               <p className="mt-2 text-xs text-text-secondary">
//                 Out of 50 classes
//               </p>
//             </div>

//             {/* Missed */}
//             <div className="rounded-2xl border border-border bg-surface p-6">
//               <div className="mb-4 flex items-center justify-between">
//                 <p className="text-sm font-medium text-text-secondary">
//                   Classes Missed
//                 </p>

//                 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-danger">
//                   ×
//                 </div>
//               </div>

//               <h3 className="text-3xl font-bold text-text-primary">9</h3>

//               <p className="mt-2 text-xs text-text-secondary">
//                 Attendance needs attention
//               </p>
//             </div>

//             {/* Courses */}
//             <div
//               id="courses"
//               className="rounded-2xl border border-border bg-surface p-6"
//             >
//               <div className="mb-4 flex items-center justify-between">
//                 <p className="text-sm font-medium text-text-secondary">
//                   Enrolled Courses
//                 </p>

//                 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-accent">
//                   #
//                 </div>
//               </div>

//               <h3 className="text-3xl font-bold text-text-primary">6</h3>

//               <p className="mt-2 text-xs text-text-secondary">Active courses</p>
//             </div>
//           </section>

//           {/* Main Grid */}
//           <div className="mt-8 grid gap-6 xl:grid-cols-3">
//             {/* Today's Classes */}
//             <section
//               id="schedule"
//               className="xl:col-span-2 rounded-2xl border border-border bg-surface"
//             >
//               <div className="flex items-center justify-between border-b border-border px-6 py-5">
//                 <div>
//                   <h2 className="font-semibold text-text-primary">
//                     Today's Classes
//                   </h2>

//                   <p className="mt-1 text-xs text-text-secondary">
//                     Your scheduled classes for today.
//                   </p>
//                 </div>

//                 <a
//                   href="#schedule"
//                   className="text-sm font-semibold text-primary hover:text-primary-dark"
//                 >
//                   View Schedule
//                 </a>
//               </div>

//               <div className="divide-y divide-border">
//                 {/* Class 1 */}
//                 <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
//                   <div>
//                     <h3 className="font-semibold text-text-primary">CSC 301</h3>

//                     <p className="mt-1 text-sm text-text-secondary">
//                       Software Engineering
//                     </p>

//                     <p className="mt-2 text-xs text-text-secondary">
//                       9:00 AM – 11:00 AM • Room LT 1
//                     </p>
//                   </div>

//                   <button className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark">
//                     Mark Attendance
//                   </button>
//                 </div>

//                 {/* Class 2 */}
//                 <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
//                   <div>
//                     <h3 className="font-semibold text-text-primary">CSC 305</h3>

//                     <p className="mt-1 text-sm text-text-secondary">
//                       Database Management
//                     </p>

//                     <p className="mt-2 text-xs text-text-secondary">
//                       1:00 PM – 3:00 PM • Room LT 2
//                     </p>
//                   </div>

//                   <span className="rounded-full bg-slate-100 px-4 py-2 text-center text-xs font-semibold text-text-secondary">
//                     Upcoming
//                   </span>
//                 </div>
//               </div>
//             </section>

//             {/* Early Warning */}
//             <section
//               id="warnings"
//               className="rounded-2xl border border-border bg-surface"
//             >
//               <div className="border-b border-border px-6 py-5">
//                 <h2 className="font-semibold text-text-primary">
//                   Attendance Status
//                 </h2>

//                 <p className="mt-1 text-xs text-text-secondary">
//                   Your current attendance performance.
//                 </p>
//               </div>

//               <div className="p-6">
//                 <div className="mb-6 flex items-center gap-4">
//                   <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-success">
//                     ✓
//                   </div>

//                   <div>
//                     <h3 className="font-semibold text-success">
//                       Good Standing
//                     </h3>

//                     <p className="text-xs text-text-secondary">
//                       Your attendance is currently healthy.
//                     </p>
//                   </div>
//                 </div>

//                 {/* Progress */}
//                 <div>
//                   <div className="mb-2 flex justify-between text-xs">
//                     <span className="text-text-secondary">Attendance</span>

//                     <span className="font-semibold text-text-primary">82%</span>
//                   </div>

//                   <div className="h-2 overflow-hidden rounded-full bg-slate-100">
//                     <div
//                       className="h-full rounded-full bg-success"
//                       style={{ width: "82%" }}
//                     ></div>
//                   </div>
//                 </div>

//                 <div className="mt-6 rounded-lg bg-background p-4">
//                   <p className="text-xs leading-5 text-text-secondary">
//                     Keep attending your scheduled classes to maintain your
//                     attendance above the required threshold.
//                   </p>
//                 </div>
//               </div>
//             </section>
//           </div>

//           {/* Recent Attendance */}
//           <section className="mt-8 rounded-2xl border border-border bg-surface">
//             <div className="border-b border-border px-6 py-5">
//               <h2 className="font-semibold text-text-primary">
//                 Recent Attendance
//               </h2>

//               <p className="mt-1 text-xs text-text-secondary">
//                 Your latest attendance records.
//               </p>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="w-full min-w-[600px]">
//                 <thead>
//                   <tr className="border-b border-border text-left">
//                     <th className="px-6 py-4 text-xs font-semibold text-text-secondary">
//                       Course
//                     </th>

//                     <th className="px-6 py-4 text-xs font-semibold text-text-secondary">
//                       Date
//                     </th>

//                     <th className="px-6 py-4 text-xs font-semibold text-text-secondary">
//                       Time
//                     </th>

//                     <th className="px-6 py-4 text-xs font-semibold text-text-secondary">
//                       Status
//                     </th>
//                   </tr>
//                 </thead>

//                 <tbody className="divide-y divide-border">
//                   <tr>
//                     <td className="px-6 py-4 text-sm font-medium text-text-primary">
//                       CSC 301
//                     </td>

//                     <td className="px-6 py-4 text-sm text-text-secondary">
//                       Sep 15, 2026
//                     </td>

//                     <td className="px-6 py-4 text-sm text-text-secondary">
//                       9:00 AM
//                     </td>

//                     <td className="px-6 py-4">
//                       <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-success">
//                         Present
//                       </span>
//                     </td>
//                   </tr>

//                   <tr>
//                     <td className="px-6 py-4 text-sm font-medium text-text-primary">
//                       CSC 305
//                     </td>

//                     <td className="px-6 py-4 text-sm text-text-secondary">
//                       Sep 14, 2026
//                     </td>

//                     <td className="px-6 py-4 text-sm text-text-secondary">
//                       1:00 PM
//                     </td>

//                     <td className="px-6 py-4">
//                       <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-danger">
//                         Absent
//                       </span>
//                     </td>
//                   </tr>

//                   <tr>
//                     <td className="px-6 py-4 text-sm font-medium text-text-primary">
//                       CSC 303
//                     </td>

//                     <td className="px-6 py-4 text-sm text-text-secondary">
//                       Sep 13, 2026
//                     </td>

//                     <td className="px-6 py-4 text-sm text-text-secondary">
//                       10:00 AM
//                     </td>

//                     <td className="px-6 py-4">
//                       <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-success">
//                         Present
//                       </span>
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </section>
//         </div>
//       </main>
//     </div>
//   );
// }

// export default StudentDashboard;
