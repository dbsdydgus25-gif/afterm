
import { AppSidebar } from "@/components/space/AppSidebar";
// Wait, I should not use sidebar here if I am using layout.
// Actually feed should also be under /space/feed to inherit the layout? 
// The user linked to /feed in the code. I should probably move it to /space/feed.
// But first, let's just make /feed redirect or be a simple page.

// Better Plan: Move the concept of 'Feed' into /space/feed so it shares the layout.
// And update the link in `space/page.tsx`.

import { redirect } from "next/navigation";

export default function FeedPage() {
    redirect("/space/activity"); // Redirect to activity or just space for now
}
