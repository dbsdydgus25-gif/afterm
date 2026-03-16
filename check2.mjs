import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// .env.local parsing
const envContent = readFileSync(".env.local", "utf-8");
const env = {};
envContent.split("\n").forEach(line => {
    const match = line.match(/^([^=]+)=(.*)/);
    if (match) {
        env[match[1]] = match[2];
    }
});

const serviceSupabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    console.log("Fetching api key...");
    const apiKey = "afterm-1c16137f4716277b0d89a3f5cdab70ca";
    const { data: profile } = await serviceSupabase.from("profiles").select("*").eq("api_key", apiKey).single();
    console.log("Profile:", profile);
    if (profile) {
        const { data: authUser } = await serviceSupabase.auth.admin.getUserById(profile.id);
        console.log("Auth User meta:", authUser.user?.user_metadata);
        console.log("Auth User email/phone:", authUser.user?.email, authUser.user?.phone);
        
        let resolvedName = profile.full_name || "";
        console.log("resolvedName 1:", resolvedName);
        if (!resolvedName) {
             resolvedName = authUser?.user?.user_metadata?.full_name || authUser?.user?.user_metadata?.name || "";
        }
        console.log("resolvedName final:", resolvedName);
    }
}
main();
