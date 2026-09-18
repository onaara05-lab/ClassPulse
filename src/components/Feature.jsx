function Feature({ icon, title, description }) {
  return (
    <div className="group rounded-2xl border border-border bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lg">
      
      {/* Icon */}
      <div className="mb-5 flex h-13 w-13  items-center justify-center border-4 rounded-2xl text-[27px] bg-blue-600 text-4xl text-white">
        {icon}
      </div>

      {/* Title */}
      <h3 className="mb-3 text-xl font-semibold text-text-primary">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm leading-6 text-text-secondary">
        {description}
      </p>

    </div>
  );
}

export default Feature;