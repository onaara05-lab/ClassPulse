import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const attendanceTrendData = [
  { week: "Week 1", attendance: 78 },
  { week: "Week 2", attendance: 84 },
  { week: "Week 3", attendance: 81 },
  { week: "Week 4", attendance: 89 },
  { week: "Week 5", attendance: 87 },
  { week: "Week 6", attendance: 93 },
];

const courseAttendanceData = [
  { course: "CSC 301", attendance: 92 },
  { course: "CSC 305", attendance: 85 },
  { course: "CSC 307", attendance: 78 },
  { course: "CSC 309", attendance: 88 },
  { course: "CSC 311", attendance: 72 },
];

function AttendanceCharts() {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* Attendance Overview Chart */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary">
            Attendance Overview
          </h3>

          <p className="mt-1 text-sm text-text-secondary">
            Average attendance performance over time.
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceTrendData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="week"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />

              <Tooltip
                formatter={(value) => [`${value}%`, "Attendance"]}
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="attendance"
                name="Attendance Rate"
                stroke="#045389"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Course Attendance Comparison Chart */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary">
            Course Attendance Comparison
          </h3>

          <p className="mt-1 text-sm text-text-secondary">
            Attendance rate across your courses.
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={courseAttendanceData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="course"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />

              <Tooltip
                formatter={(value) => [`${value}%`, "Attendance"]}
              />

              <Legend />

              <Bar
                dataKey="attendance"
                name="Attendance Rate"
                fill="#38BDF8"
                radius={[6, 6, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

export default AttendanceCharts;