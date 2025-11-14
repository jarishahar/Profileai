"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "lib/utils";
import { ChevronRight, Settings } from "lucide-react";
import { UserProfileDropdown } from "./user-profile-dropdown";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

interface HeaderProps {
  className?: string;
}

interface Breadcrumb {
  name: string;
  href: string;
  isLast: boolean;
}

export function Header({ className }: HeaderProps) {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = (): Breadcrumb[] => {
    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs: Breadcrumb[] = [];

    // Add Admin Dashboard link if user is in an admin route or project route
    const isAdminRoute = pathname.startsWith("/admin");
    const isProjectRoute = pathname.match(/^\/[a-f0-9-]+\//);
    
    if (isAdminRoute || isProjectRoute) {
      breadcrumbs.push({
        name: "Admin Dashboard",
        href: "/admin/projects",
        isLast: false,
      });
    }

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];

      // Skip UUID-like project IDs (paths that look like UUIDs) in display
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          path,
        );
      if (isUUID) {
        continue;
      }

      // Build the full href including all previous segments (including UUIDs)
      const href = `/${paths.slice(0, i + 1).join("/")}`;

      // Capitalize and format the path name
      const name = path
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      breadcrumbs.push({
        name,
        href,
        isLast: i === paths.length - 1,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Get the main section icon/name
  const getSectionIcon = () => {
    if (pathname.includes("/functions")) return "⚡";
    if (pathname.includes("/knowledges")) return ""; //use brain emoji
    if (pathname.includes("/settings")) return <Settings size={12} />;
    return "";
  };

  return (
    <header className={cn("border-b bg-background", className)}>
      <div className="flex items-center justify-between px-6 py-3 mb-1">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbs.length > 0 ? (
            <>
              <span className="text-lg">{getSectionIcon()}</span>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
                  )}
                  {crumb.isLast ? (
                    <span className="font-medium text-foreground">
                      {crumb.name}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </div>
              ))}
            </>
          ) : (
            <span className="font-medium text-foreground">Dashboard</span>
          )}
        </nav>

        {/* User Profile Dropdown */}
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
}
