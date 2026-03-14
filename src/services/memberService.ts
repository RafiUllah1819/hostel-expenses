import { supabase } from "@/lib/supabase";
import { TABLES } from "@/lib/constants";
import type { Member, NewMemberInput } from "@/types";

// ---------------------------------------------------------------------------
// Fetch all members, oldest first
// ---------------------------------------------------------------------------
export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from(TABLES.MEMBERS)
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Insert a new member
// ---------------------------------------------------------------------------
export async function addMember(input: NewMemberInput): Promise<Member> {
  const { data, error } = await supabase
    .from(TABLES.MEMBERS)
    .insert({
      name:     input.name.trim(),
      nickname: input.nickname?.trim() || null,
      email:    input.email?.trim()    || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!data)  throw new Error("Insert succeeded but returned no data.");
  return data;
}

// ---------------------------------------------------------------------------
// Delete a member by id
//
// Supabase surfaces a PostgreSQL foreign-key violation as error code "23503".
// We catch that and re-throw a human-readable message so the UI can show it
// directly instead of a raw DB error.
// ---------------------------------------------------------------------------
export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.MEMBERS)
    .delete()
    .eq("id", id);

  if (!error) return;

  if (error.code === "23503") {
    throw new Error(
      "This member cannot be deleted because they are linked to one or more expenses. " +
        "Remove those expenses first."
    );
  }

  throw new Error(error.message);
}
