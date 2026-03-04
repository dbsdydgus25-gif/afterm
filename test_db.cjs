const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking DB...");
    const { data: profiles, error } = await supabase.from('profiles').select('id, full_name, phone, api_key');
    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    // Using phone from screenshot or name
    const matched = profiles.filter(p =>
        (p.phone && p.phone.includes('6381')) ||
        (p.full_name && p.full_name.includes('윤용현')) ||
        (p.api_key && p.api_key.includes('710b5f76'))
    );
    console.log("Profiles matching criteria:", JSON.stringify(matched, null, 2));

    if (matched.length > 0) {
        for (const p of matched) {
            console.log("Checking auth metadata for ID:", p.id);
            const { data: user, error: authErr } = await supabase.auth.admin.getUserById(p.id);
            if (authErr) {
                console.error("Auth Error:", authErr);
            } else {
                console.log("Auth user metadata:", JSON.stringify(user?.user?.user_metadata, null, 2));
            }

            // Checking guardians table for this user
            const { data: g } = await supabase.from('guardians').select('*').eq('user_id', p.id);
            console.log("Guardians for user:", JSON.stringify(g, null, 2));
        }
    } else {
        console.log("NO MATCHING PROFILES FOUND IN DB FOR YUN YONG HYUN OR THAT API KEY.");
    }
}
check();
