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