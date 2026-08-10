const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseKey || supabaseKey === "your-service-role-key") {
    console.log("No valid service role key. User must create bucket manually.");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.storage.createBucket("avatars", {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024, // 2MB
  });

  if (error) {
    console.error("Error creating bucket:", error.message);
  } else {
    console.log("Bucket created:", data);
  }
}

main();
