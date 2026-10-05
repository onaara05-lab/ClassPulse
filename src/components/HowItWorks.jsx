function HowItWorks() {
  const steps = [
    {
      icon: "01",
      title: "Register and Enroll",
      description:
        "Students and lecturers create accounts with their institutional credentials and enroll in their respective courses.",
    },
    {
      icon: "02",
      title: "Open Attendance Session",
      description:
        "Lecturers start a time-limited attendance session at the beginning of each class using the dashboard.",
    },
    {
      icon: "03",
      title: "Mark Attendance",
      description:
        "Students mark their attendance within the session window directly from their student dashboard.",
    },
    {
      icon: "04",
      title: "Monitor & Act",
      description:
        "ClassPulse analyzes patterns in real time and surfaces at-risk students before they cross critical thresholds.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="bg-surface px-6 py-20"
    >
      <div className="mx-auto max-w-7xl">

        {/* Section Heading */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xl font-bold uppercase tracking-wider text-primary">
            How ClassPulse Works
          </p>

          <h2 className="text-3xl font-bold text-text-primary md:text-5xl">
            Simple attendance. Smarter monitoring.
          </h2>

          <p className="mt-4 leading-7 text-text-secondary">
            ClassPulse makes attendance management simple for lecturers
            while helping students stay aware of their academic progress.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-8 md:grid-cols-4">

          {steps.map((step) => (
            <div
              key={step.title}
              className="relative rounded-2xl border border-border bg-background p-8 text-center transition duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lg"
            >
              {/* Icon */}
              <div className="mx-auto mb-6 flex items-center justify-center rounded-full text-5xl text-gray-200 font-extrabold">
                {step.icon}
              </div>

              {/* Title */}
              <h3 className="mb-3 text-xl font-semibold text-text-primary">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-sm leading-6 text-text-secondary">
                {step.description}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}

export default HowItWorks;