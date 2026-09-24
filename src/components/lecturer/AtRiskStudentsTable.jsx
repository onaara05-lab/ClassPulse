import { Link } from "react-router-dom";
import { AlertTriangle, Eye } from "lucide-react";

const atRiskStudents = [
  {
    id: 1,
    name: "Adebayo Daniel",
    matricNumber: "230404001",
    course: "CSC 301",
    attendance: 42,
    sessionsMissed: 7,
  },
  {
    id: 2,
    name: "Okafor Chiamaka",
    matricNumber: "230404014",
    course: "CSC 305",
    attendance: 48,
    sessionsMissed: 6,
  },
  {
    id: 3,
    name: "Ibrahim Yusuf",
    matricNumber: "230404027",
    course: "CSC 307",
    attendance: 51,
    sessionsMissed: 5,
  },
  {
    id: 4,
    name: "Adekunle Tobi",
    matricNumber: "230404033",
    course: "CSC 309",
    attendance: 56,
    sessionsMissed: 4,
  },
  {
    id: 5,
    name: "Eze Blessing",
    matricNumber: "230404041",
    course: "CSC 311",
    attendance: 59,
    sessionsMissed: 3,
  },
];

function AtRiskStudentsTable() {
  return (
    <section className="rounded-2xl border border-border bg-surface shadow-sm">
      {/* Table Header */}
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />

            <h3 className="text-lg font-semibold text-text-primary">
              Students At Risk
            </h3>
          </div>

          <p className="mt-1 text-sm text-text-secondary">
            Students with attendance below the required threshold.
          </p>
        </div>

        <Link
          to="/lecturer/students"
          className="text-sm font-semibold text-primary transition hover:underline"
        >
          View All Students
        </Link>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead className="bg-background">
            <tr>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Student
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Course
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Attendance
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Sessions Missed
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Status
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {atRiskStudents.map((student) => (
              <tr key={student.id} className="transition hover:bg-background">
                {/* Student Information */}
                <td className="px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {student.name}
                    </p>

                    <p className="mt-1 text-xs text-text-secondary">
                      {student.matricNumber}
                    </p>
                  </div>
                </td>

                {/* Course */}
                <td className="px-5 py-4 text-sm text-text-secondary">
                  {student.course}
                </td>

                {/* Attendance */}
                <td className="px-5 py-4">
                  <span className="text-sm font-semibold text-red-600">
                    {student.attendance}%
                  </span>
                </td>

                {/* Sessions Missed */}
                <td className="px-5 py-4 text-sm text-text-secondary">
                  {student.sessionsMissed}
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                    At Risk
                  </span>
                </td>

                {/* Action */}
                <td className="px-5 py-4">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:underline"
                  >
                    <Eye size={16} />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="border-t border-border px-5 py-4">
        <p className="text-xs text-text-secondary">
          Showing {atRiskStudents.length} students requiring attention.
        </p>
      </div>
    </section>
  );
}

export default AtRiskStudentsTable;
