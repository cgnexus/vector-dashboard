"use client";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function SignInPage() {
  const [isLaoding, setIsLoading] = useState(false);

  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    authClient.signUp.email(
      {
        email, // user email address
        password, // user password -> min 8 characters by default
        name: "test", // user display name
        callbackURL: "/dashboard", // A URL to redirect to after the user verifies their email (optional)
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: () => {
          setIsLoading(false);
          //redirect to the dashboard or sign in page
        },
        onError: (ctx) => {
          setIsLoading(false);
          // display the error message
          alert(ctx.error.message);
        },
      }
    );
  };

  return (
    <div>
      <h1>Sign In</h1>
      <form onSubmit={handleSignIn}>
        <label>
          Email:
          <input type="email" name="email" required />
        </label>
        <label>
          Password:
          <input type="password" name="password" required />
        </label>
        <button type="submit">
          {" "}
          {isLaoding ? "Signing Up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
