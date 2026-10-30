import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { Resend } from "resend";
import { sql } from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET!,

  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    max: 5,
  }),

  advanced: {
    database: {
      generateId: "uuid", // IDs must be UUIDs to match our profiles/businesses schema
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: `${process.env.NEXT_PUBLIC_APP_NAME ?? "VANTAGE"} <noreply@vantage.shop>`,
        to: user.email,
        subject: "Reset your password",
        html: `
          <p>Hi there,</p>
          <p>Click the link below to reset your password. The link expires in 1 hour.</p>
          <p><a href="${url}" style="background:#F2542D;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Reset password</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // Auto-create a profile row after every new user (replaces the Supabase trigger)
  databaseHooks: {
    user: {
      create: {
        after: async (user: any) => {
          try {
            await sql(
              `INSERT INTO profiles (id, email, full_name)
               VALUES ($1, $2, $3)
               ON CONFLICT (id) DO NOTHING`,
              [user.id, user.email, user.name ?? "Business Owner"]
            );
          } catch {
            // Non-fatal — onboarding upserts the profile as fallback
          }
        },
      },
    },
  },

  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
});

export type Session = typeof auth.$Infer.Session;
