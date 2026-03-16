import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const { data: profile } = await serviceSupabase.from("profiles").select("*").limit(5);
    console.log("Profiles:");
    for (const p of profile || []) {
        console.log({ id: p.id, full_name: p.full_name, phone: p.phone, api_key: p.api_key });
        const { data: authUser } = await serviceSupabase.auth.admin.getUserById(p.id);
        console.log("Auth User meta:", authUser.user?.user_metadata);
    }
}
main();
