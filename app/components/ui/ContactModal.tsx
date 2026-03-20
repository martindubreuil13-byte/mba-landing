"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { GlassCard } from "@/app/components/ui/GlassCard";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg">
        <GlassCard className="glass-strong p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Get in Touch</h3>
            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition-colors hover:text-white"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-white/78">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white placeholder-white/38 focus:border-cyan-300/60 focus:outline-none focus:ring-1 focus:ring-cyan-300/60"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/78">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white placeholder-white/38 focus:border-cyan-300/60 focus:outline-none focus:ring-1 focus:ring-cyan-300/60"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="company" className="mb-2 block text-sm font-medium text-white/78">
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white placeholder-white/38 focus:border-cyan-300/60 focus:outline-none focus:ring-1 focus:ring-cyan-300/60"
                placeholder="Your company"
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium text-white/78">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-white placeholder-white/38 focus:border-cyan-300/60 focus:outline-none focus:ring-1 focus:ring-cyan-300/60 resize-none"
                placeholder="Tell us about your project..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="primary" size="md" className="flex-1">
                Send Message
              </Button>
              <Button type="button" variant="secondary" size="md" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
