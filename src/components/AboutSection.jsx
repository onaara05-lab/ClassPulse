function AboutSection() {
  return (
    <section
      id="about"
      className="bg-surface px-6 py-20"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">

        {/* Left - About Content */}
        <div className="max-w-xl">

          <p className="mb-3 text-xl font-bold uppercase tracking-wider text-primary">
            About ClassPulse
          </p>

          <h2 className="text-3xl font-extrabold leading-tight text-text-primary md:text-4xl">
            Making attendance more meaningful.
          </h2>

          <p className="mt-5 leading-7 text-text-secondary">
            ClassPulse is a web-based attendance and early-warning
            monitoring system designed to make classroom attendance
            easier to manage and more useful for both students and
            lecturers.
          </p>

          <p className="mt-4 leading-7 text-text-secondary">
            Instead of simply recording who was present or absent,
            ClassPulse helps lecturers understand attendance patterns
            and identify students who may need attention early.
          </p>

          {/* Key Points */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">

            <div className="rounded-xl border border-border bg-background p-4">
              <h3 className="font-semibold text-text-primary">
                For Students
              </h3>

              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Keep track of attendance, view attendance history,
                and stay aware of your attendance status.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <h3 className="font-semibold text-text-primary">
                For Lecturers
              </h3>

              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Manage attendance, monitor class trends, and identify
                students who may be at risk.
              </p>
            </div>

          </div>

        </div>

        {/* Right - Visual */}
        <div className="rounded-3xl bg-background p-8">

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-3xl text-primary">
                ✓
              </div>

              <div>
                <p className="text-lg text-text-secondary">
                  ClassPulse
                </p>

                <h3 className="text-2xl font-bold text-text-primary">
                  Smarter Class Monitoring
                </h3>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-4">

              <div className="rounded-xl bg-background p-4">
                <p className="text-2xl font-bold text-primary">
                  95%
                </p>

                <p className="mt-1 text-sm text-text-secondary">
                  Attendance
                </p>
              </div>

              <div className="rounded-xl bg-background p-4">
                <p className="text-2xl font-bold text-success">
                  170
                </p>

                <p className="mt-1 text-sm text-text-secondary">
                  Students Present
                </p>
              </div>

              <div className="rounded-xl bg-background p-4">
                <p className="text-2xl font-bold text-warning">
                  3
                </p>

                <p className="mt-1 text-sm text-text-secondary">
                  Students At Risk
                </p>
              </div>

              <div className="rounded-xl bg-background p-4">
                <p className="text-2xl font-bold text-accent">
                  12
                </p>

                <p className="mt-1 text-sm text-text-secondary">
                  Classes Tracked
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

export default AboutSection;