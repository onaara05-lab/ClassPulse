function EarlyWarning() {
  return (
    <section id="earlywarning" className="bg-background px-6 py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">

        {/* Left - Attendance Preview */}
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Attendance Overview
              </p>

              <h3 className="mt-1 text-xl font-bold text-text-primary">
                CSC 301
              </h3>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
              200 Students
            </span>
          </div>

          {/* Attendance Percentage */}
          <div className="mb-6 rounded-2xl bg-background p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-text-secondary">
                Class Attendance
              </span>

              <span className="text-lg font-bold text-primary">
                70%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-border">
              <div className="h-full w-[70%] rounded-full bg-primary"></div>
            </div>
          </div>

          {/* Students At Risk */}
          <div className="rounded-2xl border border-border p-5">

            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-semibold text-text-primary">
                Students At Risk
              </h4>

              <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-danger">
                3 Students
              </span>
            </div>

            {/* Student 1 */}
            <div className="mb-3 flex items-center justify-between rounded-xl bg-background p-3">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  John Akinyemi
                </p>

                <p className="text-xs text-text-secondary">
                  Attendance: 48%
                </p>
              </div>

              <span className="text-xs font-semibold text-danger">
                At Risk
              </span>
            </div>

            {/* Student 2 */}
            <div className="mb-3 flex items-center justify-between rounded-xl bg-background p-3">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Ayo Solomon
                </p>

                <p className="text-xs text-text-secondary">
                  Attendance: 52%
                </p>
              </div>

              <span className="text-xs font-semibold text-danger">
                At Risk
              </span>
            </div>

            {/* Student 3 */}
            <div className="flex items-center justify-between rounded-xl bg-background p-3">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  David James
                </p>

                <p className="text-xs text-text-secondary">
                  Attendance: 55%
                </p>
              </div>

              <span className="text-xs font-semibold text-danger">
                At Risk
              </span>
            </div>

          </div>
        </div>

        {/* Right - Text */}
        <div className="max-w-xl">

          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            Early-Warning Monitoring
          </p>

          <h2 className="text-3xl font-bold leading-tight text-text-primary md:text-4xl">
            Identify attendance problems before they become serious.
          </h2>

          <p className="mt-5 leading-7 text-text-secondary">
            ClassPulse automatically monitors student attendance and
            highlights students who fall below the required attendance
            threshold.
          </p>

          {/* Benefits */}
          <div className="mt-7 space-y-4">

            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-primary">
                ✓
              </span>

              <div>
                <h4 className="font-semibold text-text-primary">
                  Automatic Detection
                </h4>

                <p className="mt-1 text-sm text-text-secondary">
                  Students below the required attendance level are
                  automatically identified.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-primary">
                ✓
              </span>

              <div>
                <h4 className="font-semibold text-text-primary">
                  Early Notifications
                </h4>

                <p className="mt-1 text-sm text-text-secondary">
                  Get timely warnings so attendance issues can be
                  addressed early.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-primary">
                ✓
              </span>

              <div>
                <h4 className="font-semibold text-text-primary">
                  Better Student Outcomes
                </h4>

                <p className="mt-1 text-sm text-text-secondary">
                  Help students stay aware of their attendance and
                  take action before they fall too far behind.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

export default EarlyWarning;