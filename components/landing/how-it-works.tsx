const steps = [
  {
    step: "01",
    title: "Create your account",
    description:
      "Sign up in under a minute. No credit card, no complicated setup.",
  },
  {
    step: "02",
    title: "Set your availability",
    description:
      "Define your services, working hours, and buffer times. Chasum adapts to your workflow.",
  },
  {
    step: "03",
    title: "Share your link",
    description:
      "Send your personalized booking page to clients. They pick a time, you get notified.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y border-border bg-muted/30 px-6 py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Up and running in minutes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three simple steps to transform how you manage appointments.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((item, index) => (
            <div key={item.step} className="relative text-center md:text-left">
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-8 hidden h-px w-full bg-border md:block" />
              )}
              <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card text-xl font-semibold text-primary shadow-sm md:mx-0">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
