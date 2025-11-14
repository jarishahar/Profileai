
import KnowledgeBase from "@/app/knowledge/page";


export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="flex flex-col flex-1">
        <main className="flex-1 overflow-auto p-0 pt-2 lg:pt-0">
          <KnowledgeBase />
        </main>
      </div>
    </div>
  );
}
