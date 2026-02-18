import { Outlet } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";

export default function MainLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">
        Sidebar
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex justify-between items-center p-4 border-b">
          <span>{user?.name}</span>
          <button
            onClick={logout}
            className="bg-black text-white px-3 py-1 rounded"
          >
            Logout
          </button>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
