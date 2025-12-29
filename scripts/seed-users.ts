import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";
import { supabaseAdmin } from "@/lib/supabase-admin";

const users = [
  {
    email: "admin@test.com",
    password: "password",
    companyName: "Admin Company",
    roleName: "admin",
    subscriptionName: "Enterprise",
  },
  {
    email: "user@test.com",
    password: "password",
    companyName: "User Company",
    roleName: "user",
    subscriptionName: "Basic",
  },
  {
    email: "premium@test.com",
    password: "password",
    companyName: "Premium Company",
    roleName: "user",
    subscriptionName: "Premium",
  },
  {
    email: "enterprise@test.com",
    password: "password",
    companyName: "Enterprise Company",
    roleName: "user",
    subscriptionName: "Enterprise",
  },
];

async function applyRLSPolicies() {
  console.log("🔒 Applying RLS policies...\n");

  const rlsPath = resolve(process.cwd(), "supabase", "rls_policies.sql");
  const rlsSQL = readFileSync(rlsPath, "utf-8");

  // Connect to local Postgres database
  const sql = postgres(
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    {
      max: 1,
    }
  );

  try {
    // Execute the SQL file
    await sql.unsafe(rlsSQL);
    console.log("✅ RLS policies applied successfully!\n");
  } catch (error) {
    console.error("❌ Failed to apply RLS policies:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

async function seedUsers() {
  console.log("🌱 Seeding users...\n");

  for (const user of users) {
    // 1. Fetch role ID by name
    const { data: role, error: roleError } = await supabaseAdmin
      .from("roles")
      .select("role_id")
      .eq("role_name", user.roleName)
      .single();

    if (roleError || !role) {
      console.error(`❌ Failed to find role '${user.roleName}':`, roleError);
      continue;
    }

    // 2. Fetch subscription ID by name
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .select("subscription_id")
      .eq("subscription_name", user.subscriptionName)
      .single();

    if (subscriptionError || !subscription) {
      console.error(
        `❌ Failed to find subscription '${user.subscriptionName}':`,
        subscriptionError
      );
      continue;
    }

    // 3. Create user in auth.users via Admin API
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      console.error(
        `❌ Failed to create auth user '${user.email}':`,
        authError
      );
      continue;
    }

    // 4. Create corresponding entry in public.users
    const { error: userError } = await supabaseAdmin.from("users").insert({
      user_id: authData.user.id,
      user_email: user.email,
      user_company_name: user.companyName,
      user_role_id: role.role_id,
      user_subscription_id: subscription.subscription_id,
      user_current_monthly_bookings: 0,
    });

    if (userError) {
      console.error(
        `❌ Failed to create public user '${user.email}':`,
        userError
      );
      // Rollback: delete auth user if public.users insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      continue;
    }

    console.log(
      `✅ Created user: ${user.email} (${user.roleName}, ${user.subscriptionName})`
    );
  }

  console.log("\n🌱 User seeding complete!");
}

async function main() {
  await applyRLSPolicies();
  await seedUsers();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
