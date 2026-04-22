import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;

  const service = createServiceClient();
  const { data: invitation } = await service
    .from("invitations")
    .select("id, business_id, email, role, expires_at, accepted_at, businesses(name, slug)")
    .eq("token", token)
    .single();

  if (!invitation) {
    return <ErrorPage message="This invitation link is invalid or has already been used." />;
  }

  if (invitation.accepted_at) {
    return <ErrorPage message="This invitation has already been accepted." />;
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return <ErrorPage message="This invitation has expired. Please ask to be re-invited." />;
  }

  const business = (invitation.businesses as unknown) as { name: string; slug: string } | null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  async function acceptInvitation() {
    "use server";
    const supa = await createClient();
    const { data: { user: u } } = await supa.auth.getUser();
    if (!u) redirect(`/login?next=/invite/${token}`);

    const svc = createServiceClient();

    // Check if already a member
    const { data: existing } = await svc
      .from("business_members")
      .select("id")
      .eq("business_id", invitation!.business_id)
      .eq("user_id", u.id)
      .single();

    if (!existing) {
      await svc.from("business_members").insert({
        business_id: invitation!.business_id,
        user_id: u.id,
        role: invitation!.role,
        is_active: true,
        invited_by: null,
      });
    }

    await svc
      .from("invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("token", token);

    redirect(`/${business?.slug ?? ""}/dashboard`);
  }

  const roleLabel = invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-8">
        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-6">
          <span className="text-white font-extrabold text-xl">V</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">You're invited!</h1>
        <p className="text-slate-500 mb-6">
          <span className="font-semibold text-slate-800">{business?.name}</span> has invited you to join their team as a{" "}
          <span className="text-green-600 font-semibold">{roleLabel}</span>.
        </p>

        {user ? (
          user.email === invitation.email ? (
            <form action={acceptInvitation}>
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition text-sm shadow-sm shadow-green-200"
              >
                Accept &amp; Join {business?.name}
              </button>
            </form>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
              This invitation was sent to <strong>{invitation.email}</strong> but you are logged in as <strong>{user.email}</strong>. Please log in with the correct account.
            </div>
          )
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Please log in or create an account to accept this invitation.</p>
            <Link
              href={`/login?next=/invite/${token}`}
              className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              Log In to Accept
            </Link>
            <Link
              href={`/register?next=/invite/${token}`}
              className="block w-full text-center border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition text-sm"
            >
              Create Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-8 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-xl">!</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Invalid Invitation</h1>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <Link href="/login" className="text-green-600 text-sm font-medium hover:underline">
          Go to Login →
        </Link>
      </div>
    </div>
  );
}
