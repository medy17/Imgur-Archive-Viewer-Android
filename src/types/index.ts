// src/types/index.ts
export interface LogEntry {
  id: number;
  message: string;
  color: "green" | "red" | "orange" | "blue" | "purple" | "black";
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
  type: "image" | "video" | "file";
  modifiedAt: number;
}
