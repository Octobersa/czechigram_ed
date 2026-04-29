import { ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import { Toaster } from "react-hot-toast"
import {useBugStatus} from "@/app/context/BugStatusContext";
import {Bugs} from "@/app/lib/bugs";



const Layout = ({ children }: { children: ReactNode }) => {
  const { logout, isAdmin } = useAuth();
  const params = useParams(); 
  const student = params.student as string;
  const { getBugStatus: getContextBugStatus } = useBugStatus();
  const isMissingIconBugFixed = getContextBugStatus(Bugs.ICON_MISSING_IN_MAIN_MENU.id);
  const logoutText = isMissingIconBugFixed ? "↩️ Odhlásit se" : "Odhlásit se";

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-pink-600 to-pink-300 p-4 text-white">
        <div className="mb-4 flex justify-center">
        <Link href={`/${student}/dashboard`} data-test-id="nav-logo-dashboard"><Image src="/czechigram-logo.png" width={100} height={50} alt="Czechigram Logo" priority={true} /></Link>
        </div>
        <nav className="space-y-2">
          {isAdmin && (
              <Link href={`/${student}/admin`} className="block p-2 hover:bg-pink-700 rounded" data-test-id="nav-admin">
              🦸 Admin
              </Link>
          )}
          <Link href={`/${student}/dashboard`} className="block p-2 hover:bg-pink-700 rounded" data-test-id="nav-dashboard">🏠 Domů</Link>
          <Link href={`/${student}/search`} className="block p-2 hover:bg-pink-700 rounded" data-test-id="nav-search">🔍 Hledat</Link>
          <Link href={`/${student}/profile`} className="block p-2 hover:bg-pink-700 rounded" data-test-id="nav-profile">👤 Můj profil</Link>
          <Link href={`/${student}/login`} onClick={logout} className="block p-2 hover:bg-pink-700 rounded" data-test-id="nav-logout">{logoutText}</Link>
        </nav>
      </aside>
      
      {/* Content */}
      <main className="flex-1 p-4 bg-gray-100 overflow-auto">{children}</main>
      <Toaster />
    </div>
  );
};

export default Layout;
