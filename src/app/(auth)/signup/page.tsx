"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { getPasswordStrength } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { signUpSchema, type SignUpFormData } from "./signup.schema";

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SignUpFormData>({
    name: "",
    email: "",
    password: "",
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "",
    color: "",
  });
  const [errors, setErrors] = useState<{
    name?: string | string[];
    email?: string | string[];
    password?: string | string[];
    general?: string;
  }>({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Update password strength when password changes
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(getPasswordStrength(formData.password));
    }
  }, [formData.password]);

  // Validate individual field using Zod
  const validateField = (field: keyof SignUpFormData) => {
    const fieldSchema = signUpSchema.shape[field];
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
    const result = signUpSchema.safeParse(formData);
    
    if (!result.success) {
      const formattedErrors = result.error.flatten();
      const newErrors = {
        name: formattedErrors.fieldErrors.name,
        email: formattedErrors.fieldErrors.email,
        password: formattedErrors.fieldErrors.password,
      };
      setErrors(newErrors);
      
      // Show error summary if multiple fields have errors
      const errorCount = Object.values(newErrors).filter(error => error && error.length > 0).length;
      setShowErrorSummary(errorCount > 1);
      
      return false;
    }
    
    setErrors({});
    setShowErrorSummary(false);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      const validatedData = signUpSchema.parse(formData);
      
      await authClient.signUp.email(
        {
          email: validatedData.email,
          password: validatedData.password,
          name: validatedData.name,
          callbackURL: "/dashboard",
        },
        {
          onSuccess: () => {
            // Redirect to dashboard
            router.push("/dashboard");
          },
          onError: (ctx) => {
            setErrors({ general: ctx.error.message || "Failed to create account" });
          },
        }
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.flatten();
        setErrors({
          name: formattedErrors.fieldErrors.name,
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
              Join Nexus
            </h1>
            <p className="text-muted-foreground animate-slideInUp delay-100">
              Start monitoring your APIs with AI-powered insights
            </p>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-4 mb-6 animate-slideInUp delay-200">
            <Badge variant="secondary" className="text-xs">
              🚀 1,000+ APIs monitored
            </Badge>
            <Badge variant="secondary" className="text-xs">
              ⚡ 99.9% uptime
            </Badge>
          </div>

          {/* Error Summary */}
          {showErrorSummary && (
            <div className="p-4 mb-6 rounded-lg bg-amber-500/10 border border-amber-500/20 animate-slideInUp" role="alert">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 text-amber-400 mt-0.5" aria-hidden="true">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-sm font-medium text-amber-300 mb-2">
                    Please fix the following errors:
                  </h3>
                  <ul className="text-sm text-amber-200 space-y-1">
                    {errors.name && <li>• Please check your name format</li>}
                    {errors.email && <li>• Please check your email address</li>}
                    {errors.password && <li>• Please check your password requirements</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field */}
            <div className="space-y-2 animate-slideInUp delay-300">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              {errors.name && (
                <div className="space-y-1" role="alert">
                  {Array.isArray(errors.name) ? (
                    errors.name.map((error, index) => (
                      <p key={index} className="text-sm text-amber-400 flex items-center gap-2">
                        <span className="text-amber-500" aria-hidden="true">⚠</span>
                        {error}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-amber-400 flex items-center gap-2">
                      <span className="text-amber-500" aria-hidden="true">⚠</span>
                      {errors.name}
                    </p>
                  )}
                </div>
              )}
              <div className="relative">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => {
                    setFocusedField(null);
                    validateField("name");
                  }}
                  className={cn(
                    "glass-enhanced transition-all duration-300",
                    "focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400",
                    focusedField === "name" && "ring-2 ring-cyan-400/60 border-cyan-400 shadow-lg shadow-cyan-400/10",
                    errors.name && "border-amber-400 ring-1 ring-amber-400/50"
                  )}
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  disabled={isLoading}
                />
                <div
                  className={cn(
                    "absolute inset-0 rounded-md pointer-events-none transition-opacity duration-300",
                    focusedField === "name" ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    background: "radial-gradient(circle at center, rgba(34, 211, 238, 0.05), transparent 70%)",
                  }}
                />
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-2 animate-slideInUp delay-400">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              {errors.email && (
                <div className="space-y-1" role="alert">
                  {Array.isArray(errors.email) ? (
                    errors.email.map((error, index) => (
                      <p key={index} className="text-sm text-amber-400 flex items-center gap-2">
                        <span className="text-amber-500" aria-hidden="true">⚠</span>
                        {error}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-amber-400 flex items-center gap-2">
                      <span className="text-amber-500" aria-hidden="true">⚠</span>
                      {errors.email}
                    </p>
                  )}
                </div>
              )}
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
                  className={cn(
                    "glass-enhanced transition-all duration-300",
                    "focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400",
                    focusedField === "email" && "ring-2 ring-cyan-400/60 border-cyan-400 shadow-lg shadow-cyan-400/10",
                    errors.email && "border-amber-400 ring-1 ring-amber-400/50"
                  )}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  disabled={isLoading}
                />
                <div
                  className={cn(
                    "absolute inset-0 rounded-md pointer-events-none transition-opacity duration-300",
                    focusedField === "email" ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    background: "radial-gradient(circle at center, rgba(34, 211, 238, 0.05), transparent 70%)",
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2 animate-slideInUp delay-500">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              {errors.password && (
                <div className="space-y-1" role="alert">
                  {Array.isArray(errors.password) ? (
                    errors.password.map((error, index) => (
                      <p key={index} className="text-sm text-amber-400 flex items-center gap-2">
                        <span className="text-amber-500" aria-hidden="true">⚠</span>
                        {error}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-amber-400 flex items-center gap-2">
                      <span className="text-amber-500" aria-hidden="true">⚠</span>
                      {errors.password}
                    </p>
                  )}
                </div>
              )}
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
                  className={cn(
                    "glass-enhanced transition-all duration-300 pr-10",
                    "focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400",
                    focusedField === "password" && "ring-2 ring-cyan-400/60 border-cyan-400 shadow-lg shadow-cyan-400/10",
                    errors.password && "border-amber-400 ring-1 ring-amber-400/50"
                  )}
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : 'password-strength'}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/60 rounded"
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
                    background: "radial-gradient(circle at center, rgba(34, 211, 238, 0.05), transparent 70%)",
                  }}
                />
              </div>
              
              {/* Password strength indicator */}
              {formData.password && (
                <div className="space-y-2" id="password-strength" aria-live="polite">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Password strength:</span>
                    <span className={cn("font-medium", passwordStrength.color)}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex gap-1" role="progressbar" aria-valuenow={passwordStrength.score} aria-valuemax={5} aria-label="Password strength">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all duration-300",
                          i < passwordStrength.score
                            ? passwordStrength.color.replace("text-", "bg-")
                            : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* General error */}
            {errors.general && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 animate-shake" role="alert">
                <div className="flex items-center gap-2">
                  <span className="text-red-400" aria-hidden="true">❌</span>
                  <p className="text-sm text-red-400">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading || Object.keys(errors).length > 0}
              className={cn(
                "w-full animate-slideInUp delay-100",
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
                  <span>Creating your account...</span>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account
                  <span className="text-lg">→</span>
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-4 animate-slideInUp delay-700">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
            
            <p className="text-xs text-muted-foreground/70">
              By creating an account, you agree to our{" "}
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
