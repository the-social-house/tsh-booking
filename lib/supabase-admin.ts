import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase/types/database";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!(supabaseUrl && serviceRoleKey)) {
  throw new Error(
    "Missing Supabase admin environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
}

// Admin client with service role key - bypasses RLS
// ⚠️ NEVER expose this to the client - only use in server actions
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
