/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useSession, useSupabase } from '@/contexts/SupabaseContext';
import { validateEmail } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

const UserAuthData = z
  .object({
    email: z
      .string()
      .min(1, { message: 'Please enter a valid email' })
      .refine((e) => validateEmail(e)),
    password: z
      .string()
      .min(6, { message: 'Password is too short' })
      .max(100, { message: 'Password is too long' }),
  })
  .required();

type AuthData = z.infer<typeof UserAuthData>;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const session = useSession();
  const supabase = useSupabase();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // ✅ Safe inside Suspense
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get('redirectedFrom');
  const redirectTo = (redirectedFrom as string) || '/';

  const form = useForm<AuthData>({
    resolver: zodResolver(UserAuthData),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  async function onSubmit(values: AuthData) {
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        setError(error.message);
        return;
      }
      setMessage("You're in! Redirecting…");
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (session?.user) router.push(redirectTo);
  }, [session, redirectTo, router]);

  return (
    <div className="min-h-screen w-full grid place-items-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in with your email and password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            {message ? (
              <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="pl-9 pr-9"
                            {...field}
                          />
                          <button
                            type="button"
                            aria-label={
                              showPassword ? 'Hide password' : 'Show password'
                            }
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 opacity-70" />
                            ) : (
                              <Eye className="h-4 w-4 opacity-70" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-500">
          By continuing, you agree to our Terms and acknowledge our Privacy
          Policy.
        </p>
      </motion.div>
    </div>
  );
}
