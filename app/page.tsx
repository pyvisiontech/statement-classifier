'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import {
  UserPlus,
  UserCheck,
  FileUp,
  Timer,
  BarChart3
} from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      
      {/* Hero Section */}
      <div className="w-full max-w-4xl space-y-8 rounded-xl bg-white p-8 shadow-lg text-center">
        <h1 className="text-4xl font-bold text-slate-900 leading-tight">
          Welcome to Statement Classifier
        </h1>
        <p className="mt-3 text-slate-600 text-lg">
          Manage all your clients’ financial portfolios in one place with professional precision.
        </p>

        {/* Animation */}
        <div className="flex justify-center mt-6">
          <DotLottieReact
            src="https://lottie.host/e1014e8c-91b1-4b6d-a004-5f225aa6f412/DzZNhyAX8k.lottie"
            loop
            autoplay
            style={{ width: 400, height: 400 }}
          />
        </div>

        <div className="mt-8 space-y-4">
          <Button asChild className="w-full">
            <Link href="/signup">Create Account</Link>
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-slate-500">
                Already have an account?
              </span>
            </div>
          </div>

          <Button variant="outline" asChild className="w-full">
            <Link href="/signin">Sign In</Link>
          </Button>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="mt-16 max-w-5xl w-full text-center space-y-10">
        <h2 className="text-3xl font-bold text-slate-900">How It Works</h2>
        <p className="text-slate-600 text-lg">
          Speed up finalization, taxation, and audit processes with AI-powered insights.
        </p>

        {/* Responsive Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="space-y-3 p-5 rounded-xl bg-white shadow-md hover:shadow-xl transition">
            <UserCheck className="mx-auto h-10 w-10 text-indigo-600" />
            <h3 className="font-semibold text-slate-800">Login</h3>
            <p className="text-sm text-slate-600">Sign in securely to your dashboard</p>
          </div>

          <div className="space-y-3 p-5 rounded-xl bg-white shadow-md hover:shadow-xl transition">
            <UserPlus className="mx-auto h-10 w-10 text-indigo-600" />
            <h3 className="font-semibold text-slate-800">Add a Client</h3>
            <p className="text-sm text-slate-600">Store each client’s data separately</p>
          </div>

          <div className="space-y-3 p-5 rounded-xl bg-white shadow-md hover:shadow-xl transition">
            <FileUp className="mx-auto h-10 w-10 text-indigo-600" />
            <h3 className="font-semibold text-slate-800">Upload Statement</h3>
            <p className="text-sm text-slate-600">Upload PDF, CSV, or Excel files</p>
          </div>

          <div className="space-y-3 p-5 rounded-xl bg-white shadow-md hover:shadow-xl transition">
            <Timer className="mx-auto h-10 w-10 text-indigo-600" />
            <h3 className="font-semibold text-slate-800">AI Processing</h3>
            <p className="text-sm text-slate-600">AI categorises transactions in 10–15 mins</p>
          </div>

          <div className="space-y-3 p-5 rounded-xl bg-white shadow-md hover:shadow-xl transition">
            <BarChart3 className="mx-auto h-10 w-10 text-indigo-600" />
            <h3 className="font-semibold text-slate-800">Smart Insights</h3>
            <p className="text-sm text-slate-600">View analytics & export reports</p>
          </div>
        </div>

        <p className="text-slate-700 font-semibold text-sm">
          Login → Add Client → Upload → AI → Insights Ready 🚀
        </p>
      </section>
    </main>
  );
}
