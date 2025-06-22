// src/api/imgur.ts
import RNFS from "react-native-fs";
import { DownloadResult } from "../types";

// Search orders from your Python script
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

/**
 * Extracts the Imgur ID from a URL or a direct ID string.
 * --- NEW AND IMPROVED LOGIC ---
 */
export const extractImgurId = (input: string): string | null => {
  const trimmedInput = input.trim();

  // 1. Check if the input is just the ID (e.g., "EAU0pfU" or "EAU0pfU.jpg")
  // This regex looks for a 5-7 character alphanumeric string, optionally followed by a dot and extension.
  const directIdMatch = trimmedInput.match(/^([a-zA-Z0-9]{5,7})/);
  if (directIdMatch) {
    // If the input is ONLY the ID (or ID.ext), we can be confident.
    // This checks if the input contains "imgur.com" to avoid misinterpreting full URLs.
    if (!trimmedInput.includes("imgur.com") && !trimmedInput.includes("imgur.io")) {
      return directIdMatch[1]; // Return the first group, which is just the ID
    }
  }

  // 2. If it's not a direct ID, try to parse it as a full URL (the old logic)
  const urlMatch = trimmedInput.match(
    /(?:i\.)?imgur\.(?:com|io)\/(?:a\/|gallery\/|t\/[^/]+\/)?([a-zA-Z0-9]{5,7})/,
  );
  if (urlMatch) {
    return urlMatch[1];
  }

  // 3. If neither pattern matches, return null
  return null;
};


/**
 * Finds an archived URL on the Wayback Machine.
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

    try {
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        signal: abortSignal,
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();

      if (Array.isArray(data) && data.length > 1) {
        const timestamp = data[1][1];
        const originalUrl = data[1][2];
        const archiveUrl = `https://web.archive.org/web/${timestamp}if_/${originalUrl}`;
        log(`Found archived version with ${ext}`, "green");
        return { archiveUrl, fallbackExt: ext };
      }
    } catch (error: any) {
      if (error.name === "AbortError") throw error;
      log(`Network error for ${ext}: ${error.message}`, "orange");
    }
  }
  return null;
};

/**
 * Downloads a file from a URL to the device's Downloads directory.
 */
export const downloadFromArchive = async (
  imgurId: string,
  useBestQuality: boolean,
  log: (message: string, color?: any) => void,
  abortSignal: AbortSignal,
): Promise<DownloadResult> => {
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
    // 1. Download to a temporary file first
    const tempPath = `${downloadDir}/${imgurId}-${Date.now()}.tmp`;
    let finalExt = fallbackExt; // Start with the fallback

    const download = RNFS.downloadFile({
      fromUrl: archiveUrl,
      toFile: tempPath,
      background: true,
      begin: (res) => {
        // 2. In the callback, determine the REAL extension from server headers
        const contentType = res.headers["Content-Type"]?.split(";")[0];
        const mappedExt = contentType ? MIME_TYPE_MAP[contentType] : null;
        if (mappedExt) {
          log(`Server suggests file type is '${mappedExt}'.`, "blue");
          finalExt = mappedExt; // Overwrite the fallback with the real extension
        }
      },
    });

    const downloadResult = await download.promise;

    if (downloadResult.statusCode !== 200) {
      throw new Error(`Download failed. Status: ${downloadResult.statusCode}`);
    }

    // 3. Now that download is complete, determine the final correct path
    let counter = 1;
    let outputPath = `${downloadDir}/${imgurId}${finalExt}`;
    while (await RNFS.exists(outputPath)) {
      counter++;
      outputPath = `${downloadDir}/${imgurId}_${counter}${finalExt}`;
    }

    // 4. Move the temporary file to its final, correctly named destination
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