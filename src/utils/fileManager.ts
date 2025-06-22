// src/utils/fileManager.ts
// --- CORRECTED IMPORT ---
// We import from the new, correct package name.
import { pick, types } from "@react-native-documents/picker";
import RNFS from "react-native-fs";
import FileViewer from "react-native-file-viewer";
import { Alert } from "react-native";
import { LogEntry } from "../types";

type LogFunction = (message: string, color?: LogEntry["color"]) => void;

export const readBatchFile = async (
  log: LogFunction,
): Promise<string[] | null> => {
  try {
    // --- CORRECTED USAGE ---
    // We call `pick()` directly, as per the migration guide.
    const result = await pick({
      type: [types.plainText],
    });

    // The result is an array, we take the first element.
    const pickedFile = result[0];
    log(`Reading batch file: ${pickedFile.name}`);
    const content = await RNFS.readFile(pickedFile.uri, "utf8");
    return content.split(/\r?\n/).filter((line) => line.trim() !== "");
  } catch (err: any) {
    // The new library might not have a specific error code,
    // so we check the message for user cancellation.
    if (err && err.message && err.message.includes("User canceled")) {
      log("Batch file selection cancelled.", "orange");
    } else {
      log(`Error reading batch file: ${err.message}`, "red");
    }
    return null;
  }
};

export const openFile = (path: string | null, log: LogFunction) => {
  if (!path) {
    Alert.alert("Error", "No file path available to open.");
    return;
  }
  FileViewer.open(path)
    .then(() => {
      log(`Opening ${path}...`, "blue");
    })
    .catch((error) => {
      log(`Error opening file: ${error.message}`, "red");
      Alert.alert("Error", "Could not find an app to open this file.");
    });
};
