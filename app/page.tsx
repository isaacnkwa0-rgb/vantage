import { redirect } from "next/navigation";

// Middleware handles all redirects; this is a safety fallback
export default function HomePage() {
  redirect("/login");
}
