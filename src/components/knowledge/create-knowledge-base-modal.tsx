"use client";

import { useRef, useState } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// NEW: import uploadLinks
import { uploadDocuments, uploadLinks } from "@/app/api/knowledge/upload";

const ALLOWED_EXTS = ["docx"];
const ACCEPT_ATTR = ".docx";

function isAllowedFile(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return ALLOWED_EXTS.includes(ext);
}

export function BuildProfileModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    chunkingConfig: { minSize: number; maxSize: number; overlap: number };
  }) => Promise<{ id: string }>;
}) {
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  /* ------------------------------------------
     FILE HANDLING
  ------------------------------------------ */
  const addFiles = (files: File[]) => {
    const allowed = files.filter(isAllowedFile);
    const rejected = files.length - allowed.length;

    if (rejected > 0) toast.warning(`${rejected} file(s) skipped (.docx only)`);

    if (allowed.length) {
      setSelectedFiles((prev) => [...prev, ...allowed]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  /* ------------------------------------------
     SUBMIT HANDLER  (UPDATED)
  ------------------------------------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // if (!linkedin.trim() && !github.trim()) {
    //   toast.error("Please provide at least one profile URL.");
    //   return;
    // }

    setIsSubmitting(true);

    try {
      /* 1️⃣ CREATE KNOWLEDGE BASE */
      const name = `Profile - ${Date.now()}`;
      const description = `LinkedIn: ${linkedin || "N/A"}\nGitHub: ${
        github || "N/A"
      }`;

      const chunkingConfig = {
        minSize: 100,
        maxSize: 1024,
        overlap: 200,
      };

      const { id: profileId } = await onSubmit({
        name,
        description,
        chunkingConfig,
      });

      /* 2️⃣ UPLOAD RESUME DOCX (if any) */
      if (selectedFiles.length) {
        const formData = new FormData();
        selectedFiles.forEach((file, i) => formData.append(`file-${i}`, file));

        const uploadRes = await uploadDocuments(profileId, formData);

        if (!uploadRes?.success)
          throw new Error(uploadRes?.error || "Document upload failed");

        toast.success(`${selectedFiles.length} resume file(s) uploaded.`);
      }

      /* 3️⃣ UPLOAD LINKEDIN + GITHUB LINKS (NEW) */
      const linksToUpload = [linkedin, github].filter((u) => u.trim() !== "");

      if (linksToUpload.length) {
        const linkRes = await uploadLinks(profileId, linksToUpload);

        if (!linkRes?.success)
          throw new Error(linkRes?.error || "Profile link extraction failed");

        toast.success(`Processed ${linksToUpload.length} profile link(s).`);
      }

      /* RESET */
      setLinkedin("");
      setGithub("");
      setSelectedFiles([]);

      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ------------------------------------------
     UI
  ------------------------------------------ */
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-background rounded-lg w-full max-w-lg shadow-xl animate-in fade-in-50">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Build Your Profile</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground">
            Provide your profile links & resume. We will auto-generate an
            AI-powered profile.
          </p>

          {/* LinkedIn */}
          <div className="space-y-2">
            <Label>LinkedIn Profile URL</Label>
            <Input
              placeholder="https://linkedin.com/in/..."
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
            />
          </div>

          {/* GitHub */}
          <div className="space-y-2">
            <Label>GitHub Profile URL</Label>
            <Input
              placeholder="https://github.com/..."
              value={github}
              onChange={(e) => setGithub(e.target.value)}
            />
          </div>

          {/* DOCX Upload */}
          <div className="space-y-4">
            <Label>Upload Resume (DOCX)</Label>

            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-accent"
                  : "border-muted-foreground"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-2">
                Drop .docx file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Only .docx supported
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT_ATTR}
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  Selected Files ({selectedFiles.length})
                </h4>

                <div className="max-h-40 overflow-y-auto space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-primary text-xl">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-primary text-white hover:bg-primary/80"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Generate Profile"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
