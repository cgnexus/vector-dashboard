import { db } from "@/db"; // your drizzle instance
import { account, session, user, verification } from "@/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      account,
      session,
      verification,
    }, // or "mysql", "sqlite"
  }),
  emailAndPassword: {
    enabled: true,
  },
});
