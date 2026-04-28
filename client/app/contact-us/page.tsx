// "use client";

import { Metadata } from "next";
import Link from "next/link";
// import { useState } from "react";
import {
  ChevronLeft,
  Clock3,
  // Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  // Send,
  User,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Predine for support, partnerships, or feedback — reliable help, prompt responses.",
  openGraph: {
    title: "Contact Us",
    description:
      "Get in touch with Predine for support, partnerships, or feedback — reliable help, prompt responses.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://predine.in"}/contact-us`,
  },
};

const contactItems = [
  {
    icon: User,
    label: "Owner",
    value: "Utkal Vats",
  },
  {
    icon: Mail,
    label: "Email",
    value: "utkalvats4@gmail.com",
    href: "mailto:utkalvats4@gmail.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+91 87914 62054",
    href: "tel:+918791462054",
  },
  {
    icon: MapPin,
    label: "Office",
    value: "Ghaziabad, Uttar Pradesh, India",
    href: "https://maps.google.com/?q=Ghaziabad,+Uttar+Pradesh,+India",
  },
  {
    icon: Clock3,
    label: "Support hours",
    value: "Mon – Sat, 9:00 AM – 7:00 PM",
  },
];

export default function ContactUsPage() {
  // const [form, setForm] = useState({ name: "", email: "", message: "" });
  // const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  //   setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  // };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setStatus("sending");
  //   try {
  //     await new Promise((r) => setTimeout(r, 1200));
  //     setStatus("sent");
  //     setForm({ name: "", email: "", message: "" });
  //   } catch {
  //     setStatus("error");
  //   }
  // };

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
            <MessageSquare className="h-3.5 w-3.5" />
            Contact Us
          </span>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-3">
            We'd love to
            <br />
            hear from you.
          </h1>
          <p className="text-sm text-gray-500 leading-6">
            Have a question, a suggestion, or something that didn't go right?
            Drop us a message and we'll get back to you as soon as we can.
          </p>
        </section>

        {/* Contact details */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Reach us directly
          </h2>
          <div className="space-y-3">
            {contactItems.map((item) => {
              const Icon = item.icon;
              const inner = (
                <div className="flex items-center gap-3 bg-white rounded-3xl shadow-sm p-4 transition-colors hover:bg-orange-50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {item.value}
                    </p>
                  </div>
                </div>
              );

              return item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {inner}
                </Link>
              ) : (
                <div key={item.label}>{inner}</div>
              );
            })}
          </div>
        </section>

        {/* Contact form */}
        {/* <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Send a message</h2>
          <div className="bg-white rounded-3xl shadow-sm p-5">
            {status === "sent" ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-primary">
                  <Send className="h-6 w-6" />
                </div>
                <p className="text-base font-bold text-gray-900">Message sent!</p>
                <p className="text-sm text-gray-500 leading-6">
                  Thanks for reaching out. We'll get back to you within one business day.
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-2 text-sm font-medium text-primary"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="w-full rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Message
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="What's on your mind?"
                    className="w-full rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary focus:bg-white transition-colors resize-none"
                  />
                </div>

                {status === "error" && (
                  <p className="text-xs text-red-500">
                    Something went wrong. Please try again or email us directly.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-70"
                >
                  {status === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </section> */}
      </div>
    </main>
  );
}
