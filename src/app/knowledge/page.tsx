"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useParams } from "next/navigation";
import { BuildProfileModal } from "@/components/knowledge/create-knowledge-base-modal";
import { createKnowledgeBase } from "@/app/api/knowledge/actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { verifyProfilePassword } from "@/app/api/profile/actions";
import { ChatInterface } from "@/components/knowledge/chat-interface";
import { Settings, Plus, ArrowUpRight } from "lucide-react";

type CreateKBSubmitArgs = {
  name: string;
  description: string;
  chunkingConfig: { minSize: number; maxSize: number; overlap: number };
};

export default function KnowledgesPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  // store the created KB
  const [createdKBId, setCreatedKBId] = useState<string | null>(null);
  const [createdKBName, setCreatedKBName] = useState<string | null>(null);

  // Create KB directly
  const handleCreateKnowledgeBaseSubmit = async ({
    name,
    description,
    chunkingConfig,
  }: CreateKBSubmitArgs): Promise<{ id: string }> => {
    const kb = await createKnowledgeBase({
      name,
      description,
      chunkingConfig,
    });

    toast.success("Profile created successfully");

    setIsCreateModalOpen(false);

    setCreatedKBId(kb.id);
    setCreatedKBName(kb.name);

    return { id: kb.id };
  };

  // Build Profile Click
  const handleProtectedCreateClick = () => {
    if (!isPasswordVerified) {
      setIsPasswordDialogOpen(true);
      return;
    }
    setIsCreateModalOpen(true);
  };

  // Password Submit Handler
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setIsVerifyingPassword(true);
      const ok = await verifyProfilePassword(passwordInput);

      if (!ok) {
        toast.error("Incorrect password");
        return;
      }

      setIsPasswordVerified(true);
      setIsPasswordDialogOpen(false);
      setPasswordInput("");
      setIsCreateModalOpen(true);
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const hasProfile = Boolean(createdKBId && createdKBName);

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-gray-200 bg-white/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white">
            <Settings className="h-5 w-5" />
          </div>
          <span className="text-base md:text-lg font-semibold text-slate-900">
            ProfileAI
          </span>
        </div>

        <Button variant="outline" onClick={handleProtectedCreateClick}>
          Build Your Profile
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {!hasProfile ? (
          // Empty state (matches screenshot)
          <section className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
            <div className="text-center max-w-xl">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
                Create a digital version of you?
              </h1>
              <p className="mt-3 text-sm md:text-base text-slate-500">
                Start building with a single prompt. No coding needed.
              </p>
            </div>

            <button
              type="button"
              onClick={handleProtectedCreateClick}
              className="mt-10 w-full max-w-3xl rounded-2xl border border-gray-200 bg-white/70 px-6 py-4 shadow-sm transition hover:bg-white hover:border-gray-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="text-sm md:text-[15px] leading-none">
                    Please set up your profile first.
                  </span>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-200 text-gray-600">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          </section>
        ) : (
          // Chat once profile is created
          <section className="flex-1 px-4 pb-6 pt-4">
            <div className="mx-auto h-full max-w-5xl">
              <ChatInterface
                knowledgeBaseId={createdKBId!}
                knowledgeBaseName={createdKBName!}
                projectId={projectId}
              />
            </div>
          </section>
        )}
      </main>

      {/* Create KB Modal */}
      <BuildProfileModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateKnowledgeBaseSubmit}
      />

      {/* Password Dialog */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={(open) => {
          setIsPasswordDialogOpen(open);
          if (!open) setPasswordInput("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter profile password</DialogTitle>
            <DialogDescription>
              This password is required to build your profile.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
            />

            <DialogFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordDialogOpen(false)}
                disabled={isVerifyingPassword}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isVerifyingPassword || !passwordInput}
              >
                {isVerifyingPassword ? "Verifying..." : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
