import {
  ContactsClient,
  type ContactRow,
} from "@/components/contacts/ContactsClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
    <div className="mx-auto max-w-3xl">
      <ContactsClient
        initialContacts={contacts}
        subscriptionActive={subscriptionActive}
        atContactLimit={atContactLimit}
      />
    </div>
  );
}
