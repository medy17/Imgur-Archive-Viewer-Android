// src/api/imgur.ts
import RNFS from "react-native-fs";
import { DownloadResult } from "../types";

// --- CONSTANTS FOR ROBUSTNESS ---
const REQUEST_TIMEOUT = 20000; // 15 seconds, as you suggested
const RETRY_COUNT = 2; // Try a total of 3 times (1 initial + 2 retries)
const RETRY_COOLDOWN = 5000; // 3 seconds between retries

// Search orders
const EXTENSIONS = [".jpg", ".png", ".gif", ".gifv", ".mp4", ".webm", ".mpeg"];
const PRIORITY_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".gif",
  ".png",
  ".jpg",
  ".mpeg",
  ".gifv",
];

const MIME_TYPE_MAP: { [key: string]: string } = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/mpeg": ".mpeg",
};

// --- HELPER FUNCTIONS ---

// A simple promise-based sleep function for our cooldowns
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A wrapper around fetch that adds a timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout = REQUEST_TIMEOUT,
): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
  });

  clearTimeout(id);
  return response;
};

export const extractImgurId = (input: string): string | null => {
  // ... (this function remains unchanged)
  const trimmedInput = input.trim();
  const directIdMatch = trimmedInput.match(/^([a-zA-Z0-9]{5,7})/);
  if (directIdMatch) {
    if (!trimmedInput.includes("imgur.com") && !trimmedInput.includes("imgur.io")) {
      return directIdMatch[1];
    }
  }
  const urlMatch = trimmedInput.match(
    /(?:i\.)?imgur\.(?:com|io)\/(?:a\/|gallery\/|t\/[^/]+\/)?([a-zA-Z0-9]{5,7})/,
  );
  return urlMatch ? urlMatch[1] : null;
};

/**
 * --- UPDATED AND ROBUST ---
 * Finds an archived URL on the Wayback Machine with retries and cooldowns.
 */
const findArchivedUrl = async (
  imgurId: string,
  extensions: string[],
  log: (message: string, color?: any) => void,
  abortSignal: AbortSignal,
): Promise<{ archiveUrl: string; fallbackExt: string } | null> => {
  const baseUrl = "https://web.archive.org/cdx/search/cdx";
  for (const ext of extensions) {
    if (abortSignal.aborted) throw new Error("Operation cancelled.");

    const queryUrl = `https://i.imgur.com/${imgurId}${ext}`;
    const params = new URLSearchParams({ url: queryUrl, output: "json" });
    log(`Checking for ${ext}...`);

    for (let attempt = 0; attempt <= RETRY_COUNT; attempt++) {
      try {
        const response = await fetchWithTimeout(
          `${baseUrl}?${params.toString()}`,
          { signal: abortSignal },
        );

        // If we get a temporary server error, wait and retry
        if (response.status === 503 || response.status === 504) {
          throw new Error(`Server error: ${response.status}`);
        }
        if (!response.ok) {
          // For other errors (like 404), don't retry, just fail for this extension
          log(`Failed for ${ext}: Status ${response.status}`, "orange");
          break; // Exit the retry loop and move to the next extension
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 1) {
          const timestamp = data[1][1];
          const originalUrl = data[1][2];
          const archiveUrl = `https://web.archive.org/web/${timestamp}if_/${originalUrl}`;
          log(`Found archived version with ${ext}`, "green");
          return { archiveUrl, fallbackExt: ext };
        }
        // If we get here, it means a 200 OK but no data, so break and try next ext
        break;
      } catch (error: any) {
        if (error.name === "AbortError" || abortSignal.aborted) {
          throw new Error("Operation cancelled.");
        }

        // If this was the last attempt, give up
        if (attempt === RETRY_COUNT) {
          log(`Failed for ${ext} after ${RETRY_COUNT + 1} attempts: ${error.message}`, "red");
        } else {
          // Otherwise, log, wait, and retry
          log(`Error for ${ext}: ${error.message}. Retrying in ${RETRY_COOLDOWN / 1000}s...`, "orange");
          await sleep(RETRY_COOLDOWN);
        }
      }
    }
  }
  return null;
};

/**
 * Downloads a file from a URL to the device's Downloads directory.
 * This function remains largely the same, as the robustness is in findArchivedUrl.
 */
export const downloadFromArchive = async (
  // ... (this function's signature and logic remain the same)
  imgurId: string,
  useBestQuality: boolean,
  log: (message: string, color?: any) => void,
  abortSignal: AbortSignal,
): Promise<DownloadResult> => {
  // ... (no changes needed inside this function)
  const extensionsToTry = useBestQuality ? PRIORITY_EXTENSIONS : EXTENSIONS;
  log(
    `Using ${useBestQuality ? "Best Quality" : "Quick Scan"} mode.`,
    "purple",
  );

  try {
    const findResult = await findArchivedUrl(
      imgurId,
      extensionsToTry,
      log,
      abortSignal,
    );
    if (!findResult) {
      return { success: false, error: "No archived versions found." };
    }

    const { archiveUrl, fallbackExt } = findResult;
    const downloadDir = RNFS.DownloadDirectoryPath;
    const tempPath = `${downloadDir}/${imgurId}-${Date.now()}.tmp`;
    let finalExt = fallbackExt;

    const download = RNFS.downloadFile({
      fromUrl: archiveUrl,
      toFile: tempPath,
      background: true,
      begin: (res) => {
        const contentType = res.headers["Content-Type"]?.split(";")[0];
        const mappedExt = contentType ? MIME_TYPE_MAP[contentType] : null;
        if (mappedExt) {
          log(`Server suggests file type is '${mappedExt}'.`, "blue");
          finalExt = mappedExt;
        }
      },
    });

    const downloadResult = await download.promise;

    if (downloadResult.statusCode !== 200) {
      throw new Error(`Download failed. Status: ${downloadResult.statusCode}`);
    }

    let counter = 1;
    let outputPath = `${downloadDir}/${imgurId}${finalExt}`;
    while (await RNFS.exists(outputPath)) {
      counter++;
      outputPath = `${downloadDir}/${imgurId}_${counter}${finalExt}`;
    }

    await RNFS.moveFile(tempPath, outputPath);

    log(`Success! Saved to: ${outputPath}`, "green");
    return { success: true, path: outputPath };
  } catch (error: any) {
    if (abortSignal.aborted) {
      return { success: false, error: "Download cancelled by user." };
    }
    log(`Error for ID ${imgurId}: ${error.message}`, "red");
    return { success: false, error: error.message };
  }
};
