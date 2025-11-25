import { Outlet } from "react-router";
import { Sidebar } from "../components/Sidebar";

export function Root() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
