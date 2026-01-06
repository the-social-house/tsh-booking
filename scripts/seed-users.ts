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
  } catch (error) {
    console.error("❌ Failed to apply RLS policies:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

async function getRoleId(roleName: string) {
  const { data: role, error: roleError } = await supabaseAdmin
    .from("roles")
    .select("role_id")
    .eq("role_name", roleName)
    .single();

  if (roleError || !role) {
    console.error(`  ❌ Failed to find role '${roleName}':`, roleError);
    return null;
  }

  return role.role_id;
}

async function getSubscriptionId(subscriptionName: string) {
  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .select("subscription_id")
    .eq("subscription_name", subscriptionName)
    .single();

  if (subscriptionError || !subscription) {
    console.error(
      `  ❌ Failed to find subscription '${subscriptionName}':`,
      subscriptionError
    );
    return null;
  }

  return subscription.subscription_id;
}

async function createAuthUser(email: string, password: string) {
  const createUserResult = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  const authData = createUserResult.data;
  const authError = createUserResult.error;

  if (authError) {
    console.error("  ❌ Auth API call failed:");
    console.error(`     Status: ${authError.status}`);
    console.error(`     Code: ${authError.code || "undefined"}`);
    console.error(`     Message: ${authError.message || "No message"}`);
    console.error("     Full error:", JSON.stringify(authError, null, 2));
    return null;
  }

  if (!authData?.user) {
    console.error("  ❌ Auth user creation returned no data and no error");
    return null;
  }

  return authData.user;
}

async function checkPublicUserExists(email: string) {
  const { data: existingPublicUser, error: checkError } = await supabaseAdmin
    .from("users")
    .select("user_id")
    .eq("user_email", email)
    .maybeSingle();

  if (checkError && checkError.code !== "PGRST116") {
    console.error("  ⚠️  Error checking for existing user:", checkError);
  }

  return !!existingPublicUser;
}

async function createPublicUser(params: {
  userId: string;
  email: string;
  companyName: string;
  roleId: string;
  subscriptionId: string;
}) {
  const { error: userError } = await supabaseAdmin.from("users").insert({
    user_id: params.userId,
    user_email: params.email,
    user_company_name: params.companyName,
    user_role_id: params.roleId,
    user_subscription_id: params.subscriptionId,
    user_current_monthly_bookings: 0,
    user_status: "active",
  });

  if (userError) {
    console.error(`  ❌ Failed to create public user '${params.email}':`);
    console.error("     Error:", userError);
    console.error("     Full error:", JSON.stringify(userError, null, 2));
    return false;
  }

  return true;
}

async function seedUsers() {
  for (const user of users) {
    const roleId = await getRoleId(user.roleName);
    if (!roleId) {
      continue;
    }

    const subscriptionId = await getSubscriptionId(user.subscriptionName);
    if (!subscriptionId) {
      continue;
    }

    const authUser = await createAuthUser(user.email, user.password);
    if (!authUser) {
      continue;
    }

    const publicUserExists = await checkPublicUserExists(user.email);
    if (publicUserExists) {
      continue;
    }

    const success = await createPublicUser({
      userId: authUser.id,
      email: user.email,
      companyName: user.companyName,
      roleId,
      subscriptionId,
    });

    if (!success) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    }
  }
}

async function main() {
  await applyRLSPolicies();
  await seedUsers();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
