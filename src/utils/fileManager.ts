// src/utils/fileManager.ts
import FilePicker, { types } from "react-native-file-picker"; // <-- Use the new library
import RNFS from "react-native-fs";
import FileViewer from "react-native-file-viewer";
import { Alert } from "react-native";
import { LogEntry } from "../types";

type LogFunction = (message: string, color?: LogEntry["color"]) => void;

export const readBatchFile = async (
  log: LogFunction,
): Promise<string[] | null> => {
  try {
    const res = await FilePicker.pick({
      type: [types.plainText], // Use the types from the new library
    });

    const pickedFile = res[0]; // The result is an array
    log(`Reading batch file: ${pickedFile.name}`);
    const content = await RNFS.readFile(pickedFile.uri, "utf8");
    return content.split(/\r?\n/).filter((line) => line.trim() !== "");
  } catch (err: any) {
    // Check for user cancellation error
    if (err.code === "DOCUMENT_PICKER_CANCELED") {
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