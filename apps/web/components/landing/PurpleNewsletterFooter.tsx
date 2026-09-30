'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import React, { useState } from 'react';

export function PurpleNewsletterFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <footer className="w-full bg-[#FAF9FF] pt-12 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Purple Gradient Box matching Image 2 */}
        <div className="rounded-[40px] bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 p-8 sm:p-12 lg:p-14 text-white shadow-2xl shadow-purple-900/20 relative overflow-hidden">
          {/* Subtle ambient lighting */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Row: Brand & Links */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-10 border-b border-white/15">
            <Link href="/home" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white text-purple-700 flex items-center justify-center font-bold text-base shadow-sm">
                S
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">
                SAAR
              </span>
            </Link>

            <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-xs font-semibold text-purple-100">
              <a href="#home" className="hover:text-white transition-colors">Home</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#about" className="hover:text-white transition-colors">About Us</a>
              <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>

          {/* Middle Row: Newsletter Form matching Image 2 */}
          <div className="py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                Stay Updated <br />
                with Our Newsletter
              </h3>
              <p className="text-xs sm:text-sm text-purple-200/90 font-normal leading-relaxed max-w-sm">
                Subscribe to our newsletter for the latest cognitive science research and mindful habit design strategies.
              </p>
            </div>

            <div className="lg:col-span-6 flex flex-col sm:items-end">
              {subscribed ? (
                <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
                  ✓ Thank you! You&rsquo;re subscribed to SAAR reflections.
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="w-full max-w-md flex items-center bg-white rounded-full p-1.5 shadow-lg shadow-purple-950/20"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 bg-transparent focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white transition-all shadow-sm"
                  >
                    Sign up
                  </button>
                </form>
              )}
              <div className="text-[10px] text-purple-200/70 mt-2 sm:text-right pr-2">
                By signing up, you agree to our Terms and Privacy Policy. No spam, ever.
              </div>
            </div>
          </div>

          {/* Bottom Row: Copyright matching Image 2 */}
          <div className="pt-8 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between text-[11px] text-purple-200/80 gap-4">
            <div>
              Copyright &copy; {new Date().getFullYear()} SAAR AI. All Rights Reserved.
            </div>
            <div className="flex items-center gap-1">
              <span>Crafted for Deliberate Humans</span>
              <Sparkles size={12} className="text-amber-300" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
