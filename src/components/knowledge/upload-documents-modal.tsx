"use client";

import { useState, useRef } from "react";
import {
  X,
  Upload,
  Settings2,
  Link as LinkIcon,
  Check,
  Loader2,
  Info,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UploadMode = "documents" | "links";

interface ChunkingConfig {
  minSize: number;
  maxSize: number;
  overlap: number;
}

interface UploadDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
  /** Optional: enable link uploads */
  onUploadLinks?: (urls: string[]) => Promise<void>;
  defaultChunkingConfig?: ChunkingConfig;
}

function isProbablyValidUrl(url: string) {
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Best-effort reachability (opaque from CORS is treated as ok). */
async function checkUrlReachable(url: string, timeoutMs = 5000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal,
    });
    clearTimeout(t);
    return res.ok || res.type === "opaque";
  } catch {
    clearTimeout(t);
    return false;
  }
}

export function UploadDocumentsModal({
  isOpen,
  onClose,
  onUpload,
  onUploadLinks,
  defaultChunkingConfig,
}: UploadDocumentsModalProps) {
  const [uploadMode, setUploadMode] = useState<UploadMode>("documents");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Links
  const [linkInput, setLinkInput] = useState("");
  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);
  const [linkChecking, setLinkChecking] = useState(false);

  // Chunking
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [chunkingConfig, setChunkingConfig] = useState<ChunkingConfig>(
    defaultChunkingConfig || { minSize: 100, maxSize: 1024, overlap: 200 },
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Files
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files]);
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
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Links
  const handleAddLink = async () => {
    const url = linkInput.trim();
    if (!url) return;
    if (!isProbablyValidUrl(url)) {
      alert("Enter a valid URL (http/https).");
      return;
    }
    if (selectedLinks.includes(url)) {
      alert("This link is already added.");
      return;
    }
    setLinkChecking(true);
    try {
      const ok = await checkUrlReachable(url);
      setSelectedLinks((prev) => [...prev, url]); // add regardless; CORS can be opaque
      setLinkInput("");
      if (!ok) {
        // optional toast/warn
      }
    } finally {
      setLinkChecking(false);
    }
  };
  const removeLink = (index: number) =>
    setSelectedLinks((prev) => prev.filter((_, i) => i !== index));

  const canSubmitFiles = selectedFiles.length > 0;
  const canSubmitLinks = !!onUploadLinks && selectedLinks.length > 0;
  const canSubmit = canSubmitFiles || canSubmitLinks;

  const handleUpload = async () => {
    if (!canSubmit) return;
    setIsUploading(true);
    try {
      if (canSubmitFiles) await onUpload(selectedFiles);
      if (canSubmitLinks && onUploadLinks) await onUploadLinks(selectedLinks);

      // reset
      setSelectedFiles([]);
      setSelectedLinks([]);
      setLinkInput("");
      setUploadMode("documents");
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Upload documents or add links to be processed and added to the
            knowledge base
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* ALWAYS-SHOWN toggle */}
          <div className="space-y-2">
            <Label>Source Type</Label>
            <div className="grid grid-cols-2 w-full  rounded-md border overflow-hidden">
              <Button
                type="button"
                variant={uploadMode === "documents" ? "default" : "ghost"}
                className={`rounded-none ${
                  uploadMode === "documents" ? "" : "bg-transparent"
                }`}
                onClick={() => setUploadMode("documents")}
                disabled={isUploading}
              >
                <FileText className="mr-2 h-4 w-4" />
                Documents
              </Button>
              <Button
                type="button"
                variant={uploadMode === "links" ? "default" : "ghost"}
                className={`rounded-none ${
                  uploadMode === "links" ? "" : "bg-transparent"
                }`}
                onClick={() => setUploadMode("links")}
                disabled={
                  isUploading /* allow switching even if onUploadLinks missing? yes */
                }
                title={
                  onUploadLinks
                    ? ""
                    : "Provide onUploadLinks prop to enable link uploads"
                }
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Link
              </Button>
            </div>
            {!onUploadLinks && uploadMode === "links" && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5" />
                <span>
                  Link uploads are disabled. Pass an <code>onUploadLinks</code>{" "}
                  callback to enable.
                </span>
              </div>
            )}
          </div>

          {/* Documents mode */}
          {uploadMode === "documents" && (
            <>
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
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
                  Drop files here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, MD, PPT, PPTX,
                  HTML, JSON, YAML, YML (max 100MB each)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.md,.ppt,.pptx,.html,.json,.yaml,.yml"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">
                    Selected Files ({selectedFiles.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-md"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-red-500">📄</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Links mode */}
          {uploadMode === "links" && (
            <div className="space-y-4">
              <Label>Add Links</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/page-or-document"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  disabled={isUploading || linkChecking || !onUploadLinks}
                />
                <Button
                  type="button"
                  onClick={handleAddLink}
                  disabled={
                    isUploading ||
                    linkChecking ||
                    !linkInput.trim() ||
                    !onUploadLinks
                  }
                  className="whitespace-nowrap"
                >
                  {linkChecking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Test & Add
                    </>
                  )}
                </Button>
              </div>

              {selectedLinks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">
                    Selected Links ({selectedLinks.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedLinks.map((url, index) => (
                      <div
                        key={url}
                        className="flex items-center justify-between p-3 bg-muted rounded-md overflow-hidden"
                      >
                        <div className="flex items-center gap-3 w-0 flex-1 min-w-0">
                          <span className="text-blue-500 shrink-0">🔗</span>
                          <p
                            className="text-sm font-medium truncate max-w-full"
                            title={url}
                          >
                            {url}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLink(index)}
                          disabled={isUploading}
                          className="shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chunking */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Chunking Configuration
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? "Hide" : "Show"} Details
              </Button>
            </div>

            {showAdvanced ? (
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <Label htmlFor="maxSize" className="text-xs">
                    Max Chunk Size
                  </Label>
                  <Input
                    id="maxSize"
                    type="number"
                    value={chunkingConfig.maxSize}
                    onChange={(e) =>
                      setChunkingConfig((p) => ({
                        ...p,
                        maxSize: Number(e.target.value),
                      }))
                    }
                    className="mt-1 h-8 text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Characters
                  </p>
                </div>
                <div>
                  <Label htmlFor="minSize" className="text-xs">
                    Min Chunk Size
                  </Label>
                  <Input
                    id="minSize"
                    type="number"
                    value={chunkingConfig.minSize}
                    onChange={(e) =>
                      setChunkingConfig((p) => ({
                        ...p,
                        minSize: Number(e.target.value),
                      }))
                    }
                    className="mt-1 h-8 text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Characters
                  </p>
                </div>
                <div>
                  <Label htmlFor="overlap" className="text-xs">
                    Overlap
                  </Label>
                  <Input
                    id="overlap"
                    type="number"
                    value={chunkingConfig.overlap}
                    onChange={(e) =>
                      setChunkingConfig((p) => ({
                        ...p,
                        overlap: Number(e.target.value),
                      }))
                    }
                    className="mt-1 h-8 text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Characters
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Max: {chunkingConfig.maxSize} chars • Min:{" "}
                {chunkingConfig.minSize} chars • Overlap:{" "}
                {chunkingConfig.overlap} chars
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!canSubmit || isUploading}>
            {isUploading
              ? "Uploading..."
              : `Upload${
                  selectedFiles.length + selectedLinks.length > 0
                    ? ` (${selectedFiles.length} file${
                        selectedFiles.length === 1 ? "" : "s"
                      }${
                        selectedLinks.length
                          ? `, ${selectedLinks.length} link${
                              selectedLinks.length === 1 ? "" : "s"
                            }`
                          : ""
                      })`
                    : ""
                }`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
