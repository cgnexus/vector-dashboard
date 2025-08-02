"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { signInSchema, type SignInFormData } from "./signin.schema";

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SignInFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<{
    email?: string | string[];
    password?: string | string[];
    general?: string;
  }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Validate individual field using Zod
  const validateField = (field: keyof SignInFormData) => {
    const fieldSchema = signInSchema.shape[field];
    const result = fieldSchema.safeParse(formData[field]);
    
    setErrors(prev => {
      const newErrors = { ...prev };
      
      if (!result.success) {
        newErrors[field] = result.error.issues.map(issue => issue.message);
      } else {
        delete newErrors[field];
      }
      
      return newErrors;
    });
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const result = signInSchema.safeParse(formData);
    
    if (!result.success) {
      const formattedErrors = result.error.flatten();
      setErrors({
        email: formattedErrors.fieldErrors.email,
        password: formattedErrors.fieldErrors.password,
      });
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === "checkbox" ? checked : value 
    }));
    // Clear general error when user starts typing
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form using Zod
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Parse and transform data with Zod before sending
      const validatedData = signInSchema.parse(formData);
      
      const { data, error } = await authClient.signIn.email(
        {
          email: validatedData.email,
          password: validatedData.password,
          callbackURL: "/dashboard",
          rememberMe: validatedData.rememberMe,
        },
        {
          onSuccess: () => {
            // Redirect to dashboard
            router.push("/dashboard");
          },
          onError: (ctx) => {
            // Map Better Auth errors to user-friendly messages
            const errorMessage = mapAuthError(ctx.error.message);
            setErrors({ general: errorMessage });
          },
        }
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.flatten();
        setErrors({
          email: formattedErrors.fieldErrors.email,
          password: formattedErrors.fieldErrors.password,
        });
      } else {
        setErrors({ general: "An unexpected error occurred. Please try again." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Map Better Auth errors to user-friendly messages
  const mapAuthError = (error: string): string => {
    switch (error) {
      case 'Invalid credentials':
        return 'Email or password is incorrect. Please try again.';
      case 'User not found':
        return 'No account found with this email address.';
      case 'Too many attempts':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'Sign in failed. Please try again.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-3xl animate-pulse-subtle" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20" />

      <Card className="w-full max-w-md glass-enhanced border-primary/20 relative z-10">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gradient animate-slideInUp">
              Welcome Back
            </h1>
            <p className="text-muted-foreground animate-slideInUp delay-100">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div className="space-y-2 animate-slideInUp delay-200">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => {
                    setFocusedField(null);
                    validateField("email");
                  }}
                  autoComplete="email"
                  autoFocus
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={cn(
                    "glass-enhanced transition-all duration-300",
                    focusedField === "email" && "ring-2 ring-primary neon-glow",
                    errors.email && "border-red-500"
                  )}
                  disabled={isLoading}
                />
                <div
                  className={cn(
                    "absolute inset-0 rounded-md pointer-events-none transition-opacity duration-300",
                    focusedField === "email" ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    background: "radial-gradient(circle at center, rgba(0, 255, 255, 0.1), transparent 70%)",
                  }}
                />
              </div>
              {errors.email && (
                <div id="email-error" className="space-y-1" role="alert">
                  {Array.isArray(errors.email) ? (
                    errors.email.map((error, index) => (
                      <p key={index} className="text-sm text-amber-500 animate-shake">
                        {error}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-amber-500 animate-shake">
                      {errors.email}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2 animate-slideInUp delay-300">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => {
                    setFocusedField(null);
                    validateField("password");
                  }}
                  autoComplete="current-password"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={cn(
                    "glass-enhanced transition-all duration-300 pr-10",
                    focusedField === "password" && "ring-2 ring-primary neon-glow",
                    errors.password && "border-red-500"
                  )}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
                <div
                  className={cn(
                    "absolute inset-0 rounded-md pointer-events-none transition-opacity duration-300",
                    focusedField === "password" ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    background: "radial-gradient(circle at center, rgba(0, 255, 255, 0.1), transparent 70%)",
                  }}
                />
              </div>
              {errors.password && (
                <div id="password-error" className="space-y-1" role="alert">
                  {Array.isArray(errors.password) ? (
                    errors.password.map((error, index) => (
                      <p key={index} className="text-sm text-amber-500 animate-shake">
                        {error}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-amber-500 animate-shake">
                      {errors.password}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Remember Me checkbox */}
            <div className="flex items-center space-x-2 animate-slideInUp delay-400">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                disabled={isLoading}
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Keep me signed in for 30 days
              </label>
            </div>

            {/* General error */}
            {errors.general && (
              <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 animate-shake" role="alert">
                <div className="flex items-center gap-2">
                  <span className="text-amber-500">⚠️</span>
                  <p className="text-sm text-amber-500">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading || Object.keys(errors).length > 0}
              className={cn(
                "w-full animate-slideInUp delay-500",
                "bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-medium",
                "border border-cyan-500 hover:border-cyan-400",
                "shadow-lg hover:shadow-cyan-500/20 hover:shadow-xl",
                "transition-all duration-200 transform-gpu",
                "focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:ring-offset-2 focus:ring-offset-slate-900",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-600",
                isLoading && "opacity-70 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="holo-spinner w-4 h-4" />
                  <span>Signing you in...</span>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <span className="text-lg">→</span>
                </span>
              )}
            </Button>

            {/* Forgot password link */}
            <div className="text-center animate-slideInUp delay-600">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
              >
                Forgot your password?
              </Link>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-4 animate-slideInUp delay-700">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
              >
                Sign up
              </Link>
            </p>
            
            <p className="text-xs text-muted-foreground/70">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-muted-foreground">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-muted-foreground">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}