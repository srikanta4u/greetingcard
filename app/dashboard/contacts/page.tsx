import {
  ContactsClient,
  type ContactRow,
} from "@/components/contacts/ContactsClient";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "../logout-button";

const FREE_LIMIT = 3;

export default async function DashboardContactsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard/contacts");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("subscription_active")
    .eq("id", user.id)
    .maybeSingle();

  const subscriptionActive = Boolean(profile?.subscription_active);

  const { data: rows, error } = await supabase
    .from("contacts")
    .select(
      `
      id,
      name,
      relationship,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      created_at,
      contact_events (
        id,
        event_type,
        event_date,
        recurs_annually
      )
    `,
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[dashboard/contacts] fetch", error);
  }

  const contacts = (rows ?? []) as ContactRow[];
  const count = contacts.length;
  const atContactLimit = !subscriptionActive && count >= FREE_LIMIT;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
            >
              ← Dashboard
            </Link>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Contacts
            </span>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <ContactsClient
          initialContacts={contacts}
          subscriptionActive={subscriptionActive}
          atContactLimit={atContactLimit}
        />
      </main>
    </div>
  );
}
