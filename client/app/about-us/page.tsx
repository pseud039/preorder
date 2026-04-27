import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Mail, Phone, Sparkles, UtensilsCrossed } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Predine",
};

const principles = [
  {
    title: "Order ahead, arrive ready",
    description:
      "Place your order before you step out and walk in to a meal that's already waiting. No queues, no guessing, no wasted time.",
  },
  {
    title: "Built for your everyday",
    description:
      "Whether it's a quick lunch between meetings or dinner on the way home, Predine fits into your day without adding friction.",
  },
  {
    title: "Help that actually helps",
    description:
      "If something goes wrong, we make it easy to reach someone who can fix it — no bots, no runaround.",
  },
];

export default function AboutUsPage() {
  return (
    <main className="max-w-md mx-auto min-h-screen relative overflow-hidden font-[inter] px-6 pb-28 pt-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/50 rounded-full blur-3xl opacity-30 -mr-32 -mt-32 pointer-events-none" />
      <div className="absolute top-40 left-0 w-64 h-64 bg-primary/30 rounded-full blur-3xl opacity-30 -ml-32 pointer-events-none" />

      <div className="relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to home
        </Link>

        {/* Hero */}
        <section className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary shadow-sm mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            About Predine
          </span>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-3">
            Skip the wait.
            <br />
            Pre-order your meal.
          </h1>
          <p className="text-sm text-gray-500 leading-6">
            Predine lets you browse the menu and place your order before you arrive. Your food is
            ready the moment you walk in — so you spend less time waiting and more time eating.
          </p>
        </section>

        {/* Two-col feature cards */}
        <section className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white rounded-3xl shadow-sm p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-primary">
              <UtensilsCrossed className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 mb-1.5">Made for real hunger</h2>
            <p className="text-xs text-gray-500 leading-5">
              Lunch sorted between meetings. Dinner handled on the way home. Predine works around
              your schedule.
            </p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-primary">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 mb-1.5">Simple, friendly support</h2>
            <p className="text-xs text-gray-500 leading-5">
              When something needs attention, we want the fix to be fast and the experience to feel
              human.
            </p>
          </div>
        </section>

        {/* Principles */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What we care about</h2>
          <div className="space-y-3">
            {principles.map((item) => (
              <article key={item.title} className="bg-white rounded-3xl shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-6">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Contact card */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Get in touch</h2>
          <div className="bg-white rounded-3xl shadow-sm p-5 space-y-3">
            <Link
              href="mailto:uktalvats4@gmail.com"
              className="flex items-center gap-3 rounded-2xl bg-orange-50 p-4 transition-colors hover:bg-orange-100"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Email
                </p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">uktalvats4@gmail.com</p>
              </div>
            </Link>
            <Link
              href="tel:+918791462054"
              className="flex items-center gap-3 rounded-2xl bg-orange-50 p-4 transition-colors hover:bg-orange-100"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                <Phone className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Phone
                </p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">+91 87914 62054</p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
