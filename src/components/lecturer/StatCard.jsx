import {
  LuBookOpen,
  LuUsers,
  LuClipboardCheck,
  LuTriangleAlert,
} from "react-icons/lu";

function StatisticsCards({ stats = {}, loading = false, atRiskCount = 0 }) {
  // Fallback calculations / safe formatting
  const totalCourses = stats?.totalCourses ?? 0;
  const totalStudents = stats?.totalStudents ?? 0;
  const attendanceRate = stats?.overallAttendanceRate ?? 0;

  const cards = [
    {
      title: "Total Courses",
      value: loading ? "..." : totalCourses.toString(),
      description: "Courses assigned to you",
      icon: LuBookOpen,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Students",
      value: loading ? "..." : totalStudents.toString(),
      description: "Students across your courses",
      icon: LuUsers,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Attendance Rate",
      value: loading ? "..." : `${Math.min(100, Math.max(0, attendanceRate))}%`,
      description: "Average attendance rate",
      icon: LuClipboardCheck,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "At-Risk Students",
      value: loading ? "..." : atRiskCount.toString(),
      description: "Students below attendance threshold",
      icon: LuTriangleAlert,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((statistic) => {
        const Icon = statistic.icon;

        return (
          <div
            key={statistic.title}
            className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Card Information */}
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  {statistic.title}
                </p>

                <h2 className="mt-3 text-3xl font-bold text-text-primary">
                  {statistic.value}
                </h2>
              </div>

              {/* Card Icon */}
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${statistic.iconBg}`}
              >
                <Icon
                  size={24}
                  className={statistic.iconColor}
                  strokeWidth={1.8}
                />
              </div>
            </div>

            <p className="mt-4 text-xs text-text-secondary">
              {statistic.description}
            </p>
          </div>
        );
      })}
    </section>
  );
}

export default StatisticsCards;