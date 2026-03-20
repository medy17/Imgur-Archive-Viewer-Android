// src/types/index.ts
export interface LogEntry {
  id: number;
  message: string;
  color: string;
}

export interface DownloadResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface QueueItem {
  id: string;
  imgurId: string;
  label: string;
  progress: number | null;
  state: "searching" | "downloading" | "completed" | "failed" | "cancelled";
  path?: string;
  error?: string;
}

export interface GalleryItem {
  path: string;
  name: string;
  type: "image" | "gif" | "video" | "file";
  modifiedAt: number;
}
