import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

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
    const userId = 'f13d7bfe-8d8f-4e11-906a-ff624c279bb3';
    
    const { data: spaces } = await serviceSupabase.from("spaces").select("*").eq("user_id", userId);
    console.log("Spaces:", spaces);
    
    const { data: guardians } = await serviceSupabase.from("guardians").select("*").eq("user_id", userId);
    console.log("Guardians:", guardians);
}
main();
