
import Link from "next/link";
import { Home, Search, Heart, User, PlusSquare, LogOut } from "lucide-react";

export default function SpaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-white text-stone-900 font-sans">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-stone-100 p-6 bg-white z-50">
                <Link href="/space" className="text-2xl font-bold tracking-tighter mb-10 px-2">
                    AFTERM
                </Link>

                <nav className="flex-1 space-y-2">
                    <NavItem href="/space" icon={<Home size={24} />} label="홈" />
                    <NavItem href="/space/search" icon={<Search size={24} />} label="검색" />
                    <NavItem href="/space/activity" icon={<Heart size={24} />} label="활동" />
                    <NavItem href="/space/create" icon={<PlusSquare size={24} />} label="만들기" />
                    <NavItem href="/space/profile" icon={<User size={24} />} label="프로필" />
                </nav>

                <div className="mt-auto pt-6 border-t border-stone-50">
                    <button className="flex items-center gap-4 px-4 py-3 text-stone-500 hover:bg-stone-50 w-full rounded-xl transition-colors">
                        <LogOut size={20} />
                        <span className="font-medium text-base">로그아웃</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-2xl mx-auto md:px-0 pb-20 md:pb-0">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-white border-t border-stone-100 flex justify-around items-center px-2 z-50 safe-area-bottom">
                <MobileNavItem href="/space" icon={<Home size={24} />} />
                <MobileNavItem href="/space/search" icon={<Search size={24} />} />
                <MobileNavItem href="/space/create" icon={<PlusSquare size={24} />} />
                <MobileNavItem href="/space/activity" icon={<Heart size={24} />} />
                <MobileNavItem href="/space/profile" icon={<User size={24} />} />
            </nav>
        </div>
    );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-4 px-4 py-3 text-stone-600 hover:bg-stone-50 hover:text-stone-900 rounded-xl transition-all"
        >
            {icon}
            <span className="font-medium text-lg">{label}</span>
        </Link>
    );
}

function MobileNavItem({ href, icon }: { href: string; icon: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="p-3 text-stone-500 hover:text-stone-900 active:scale-95 transition-transform"
        >
            {icon}
        </Link>
    );
}
