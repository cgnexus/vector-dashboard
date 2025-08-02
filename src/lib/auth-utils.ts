/**
 * Password strength checker utility
 * Returns a score, label, and color based on password complexity
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  
  // Check password length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Check for character types
  if (/[A-Z]/.test(password)) score++; // Has uppercase
  if (/[0-9]/.test(password)) score++; // Has numbers
  if (/[^A-Za-z0-9]/.test(password)) score++; // Has special characters

  // Return strength assessment
  if (score <= 2) return { score, label: "Weak", color: "text-red-500" };
  if (score <= 3) return { score, label: "Fair", color: "text-yellow-500" };
  if (score <= 4) return { score, label: "Good", color: "text-green-500" };
  return { score, label: "Strong", color: "text-cyan-500" };
}