import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase/types/database";

const supabaseUrl = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!(supabaseUrl && publishableKey)) {
  throw new Error(
    "Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_PUBLISHABLE_DEFAULT_KEY"
  );
}

export const supabase = createClient<Database>(supabaseUrl, publishableKey);
