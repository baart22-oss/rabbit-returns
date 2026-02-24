import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const adminEmail = "dnele.vanwyk@gmail.com";
  const adminPassword = "letsgetdrunk30DAYS";

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === adminEmail);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    // Update password
    await supabase.auth.admin.updateUserById(userId, { password: adminPassword });
  } else {
    // Create user
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: "Admin" },
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    userId = data.user.id;
  }

  // Ensure profile exists with referral code
  const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", userId).maybeSingle();
  if (!profile) {
    // Generate referral code
    const { data: code } = await supabase.rpc("generate_referral_code");
    await supabase.from("profiles").insert({ user_id: userId, full_name: "Admin", referral_code: code });
  }

  // Ensure admin role
  const { data: existingRole } = await supabase.from("user_roles").select("id").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!existingRole) {
    await supabase.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
  }

  return new Response(JSON.stringify({ success: true, userId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
