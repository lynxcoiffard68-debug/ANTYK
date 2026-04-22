import { Outlet, NavLink, Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, Users, FileWarning, Shield, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", label: "Tableau de bord", icon: BarChart3, end: true },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { to: "/admin/contenus", label: "Contenus", icon: FileWarning },
  { to: "/admin/conflits", label: "Conflits", icon: Shield },
];

const AdminLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading } = useAdmin();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/suggestions" replace />;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold font-serif text-foreground">Admin ANTYK</h2>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-border">
          <NavLink
            to="/suggestions"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à l'app
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
