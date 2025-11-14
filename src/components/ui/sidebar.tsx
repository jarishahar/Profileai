"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { cn } from "lib/utils";
import { useState, useEffect, useRef } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  Menu,
  X,
  Settings as SettingsIcon,
  BookOpen,
  Edit,
  Cpu,
  Database,
  Lock,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getProjects,
  updateProject,
} from "@/app/api/project/actions";
import { EditProjectModal } from "@/components/project/edit-project-modal";
import { toast } from "sonner";

interface SidebarProps {
  className?: string;
}

const mainMenuItems = [
  {
    name: "Smart Agents",
    href: (projectId: string) => `/${projectId}/agents`,
    icon: Cpu,
  },
  { 
    name: "MCP Servers", 
    href: (projectId: string) => `/${projectId}/mcp-servers`,
    icon: Wrench
  },
  {
    name: "Data Sources",
    href: (projectId: string) => `/${projectId}/data-sources`,
    icon: Database,
  },
  {
    name: "Knowledges",
    href: (projectId: string) => `/${projectId}/knowledges`,
    icon: BookOpen,
  },
  {
    name: "Access Control",
    href: (projectId: string) => `/${projectId}/settings/rbac`,
    icon: Lock,
  },
  {
    name: "Settings",
    href: (projectId: string) => `/${projectId}/settings/providers`,
    icon: SettingsIcon,
  },
];

/* const bottomNavItems = [
  { icon: SettingsIcon, label: "Settings", isProjectDependent: true },
  { icon: HelpCircle, label: "Help", isProjectDependent: false },
  { icon: BookText, label: "Docs", isProjectDependent: false },
]; */

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const hasLoadedRef = useRef(false);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Load projects only once on mount - using ref to prevent re-renders
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadProjectsOnce();
    }
  }, []); // Empty dependency array - truly runs once

  const loadProjectsOnce = async () => {
    try {
      setIsLoadingProjects(true);
      const data = await getProjects();
      setProjects(data);

      // Only redirect if we're on a project page and no projectId is present
      if (!params?.projectId && data.length > 0) {
        const isOnProjectPage =
          pathname.startsWith("/") &&
          !pathname.startsWith("/help") &&
          !pathname.startsWith("/docs") &&
          !pathname.startsWith("/settings") &&
          !pathname.startsWith("/sign-");

        if (isOnProjectPage) {
          router.push(`/${data[0].id}/agents`);
        }
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleEditProject = async (data: {
    name: string;
    description?: string;
  }) => {
    try {
      if (!selectedProject) return;
      await updateProject(selectedProject.id, data);
      toast.success("Project updated successfully");
      await loadProjects();
      setIsEditModalOpen(false);
      setSelectedProject(null);
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
      throw error;
    }
  };

  const openEditModal = (project: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProject(project);
    setIsEditModalOpen(true);
    setIsProjectDropdownOpen(false);
  };

  // Get current project ID from URL params or default to first project
  const currentProjectId =
    (params?.projectId as string) || projects[0]?.id || "default-project";
  const currentProject =
    projects.find((p) => p.id === currentProjectId) || projects[0];

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-background shadow-md"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col bg-background border-r transition-all duration-300 ease-in-out",
          "fixed lg:static inset-y-0 left-0 z-40",
          isCollapsed ? "w-16" : "w-60",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className,
        )}
      >
        {/* Project Selector Header */}
        <div className="p-4 border-b">
          <div className="relative">
            {!isCollapsed && (
              <Button
                variant="ghost"
                className="w-full justify-between px-2 h-auto py-2 hover:bg-accent/50"
                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              >
                <span className="text-sm font-medium truncate">
                  {currentProject?.name || "Select Project"}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 ml-2 shrink-0 transition-transform",
                    isProjectDropdownOpen && "rotate-180",
                  )}
                />
              </Button>
            )}

            {/* Collapsed State - Show Icon Only */}
            {isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-9"
                onClick={() => setIsCollapsed(false)}
                title={currentProject?.name}
              >
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </Button>
            )}

            {/* Collapse/Expand Button - Desktop Only */}
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border bg-background shadow-sm z-10"
                onClick={() => setIsCollapsed(true)}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
            )}

            {/* Project Dropdown */}
            {isProjectDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="py-1">
                  {isLoadingProjects ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Loading projects...
                    </div>
                  ) : filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <div
                        key={project.id}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors group",
                          project.id === currentProjectId && "bg-accent",
                        )}
                      >
                        <Link
                          href={`/${project.id}/agents`}
                          onClick={() => {
                            setIsProjectDropdownOpen(false);
                            setIsMobileOpen(false);
                            setSearchQuery("");
                          }}
                          className={cn(
                            "flex-1 truncate",
                            project.id === currentProjectId && "font-medium",
                          )}
                        >
                          {project.name}
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={(e) => openEditModal(project, e)}
                          title="Edit project"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {searchQuery ? "No projects found" : "No projects yet"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {mainMenuItems.map((item) => {
              const itemHref = item.href(currentProjectId);
              const isActive =
                pathname === itemHref || pathname.startsWith(`${itemHref}/`);
              const Icon = item.icon;

              return (
                <li key={item.name}>
                  <Link
                    href={itemHref}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                      "hover:bg-accent/50",
                      isActive && "bg-accent text-accent-foreground",
                      isCollapsed && "justify-center",
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Navigation */}
        {/* <div className="border-t p-3">
          <div
            className={cn(
              "flex items-center",
              isCollapsed ? "flex-col gap-2" : "justify-around",
            )}
          >
            {bottomNavItems.map((item) => {
              let itemHref = "";

              if (item.label === "Settings") {
                itemHref = `/settings`;
              } else if (item.label === "Help") {
                itemHref = "/help";
              } else if (item.label === "Docs") {
                itemHref = "/docs";
              }

              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  title={item.label}
                  asChild
                >
                  <Link href={itemHref}>
                    <item.icon className="h-4 w-4" />
                  </Link>
                </Button>
              );
            })}
          </div>
        </div> */}
      </div>

      {/* Edit Project Modal */}
      {selectedProject && (
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProject(null);
          }}
          onSubmit={handleEditProject}
          project={selectedProject}
        />
      )}
    </>
  );
}
