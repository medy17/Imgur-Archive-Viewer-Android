// src/ImgurArchiveScreen.tsx
import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Button,
  Alert,
  ActivityIndicator,
} from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { downloadFromArchive, extractImgurId } from "./api/imgur";
import { LogEntry } from "./types";
import SingleDownloadTab from "./screens/SingleDownloadTab";
import BatchDownloadTab from "./screens/BatchDownloadTab";
import LogView from "./components/LogView";
import Preview from "./components/Preview";
import { readBatchFile, openFile } from "./utils/fileManager";

const Tab = createMaterialTopTabNavigator();

// Helper function for cooldowns
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ImgurArchiveScreen = () => {
  const [isBestQuality, setIsBestQuality] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastDownloadPath, setLastDownloadPath] = useState<string | null>(null);
  const logCounter = useRef(0);
  const abortController = useRef<AbortController | null>(null);

  const addLog = useCallback(
    (
      message: string,
      color: LogEntry["color"] = "black",
    ) => {
      setLogs((prevLogs) => [
        ...prevLogs,
        { id: logCounter.current++, message, color },
      ]);
    },
    [],
  );

  const resetState = () => {
    setLogs([]);
    setIsProcessing(true);
    setLastDownloadPath(null);
    abortController.current = new AbortController();
  };

  /**
   * --- MODIFIED ---
   * Now returns a boolean indicating success or failure.
   */
  const handleDownload = useCallback(
    async (imgurId: string): Promise<boolean> => {
      addLog(`Processing ID: ${imgurId}`, "blue");
      const result = await downloadFromArchive(
        imgurId,
        isBestQuality,
        addLog,
        abortController.current!.signal,
      );

      if (result.success && result.path) {
        setLastDownloadPath(result.path);
      } else if (result.error) {
        addLog(`Failed for ID ${imgurId}: ${result.error}`, "red");
      }
      return result.success;
    },
    [isBestQuality, addLog],
  );

  /**
   * --- NEW FUNCTION ---
   * Handles the logic for retrying a list of failed IDs.
   */
  const runRetryProcess = async (idsToRetry: string[]) => {
    addLog(`--- Retrying ${idsToRetry.length} failed downloads... ---`, "purple");
    for (let i = 0; i < idsToRetry.length; i++) {
      if (abortController.current?.signal.aborted) {
        addLog("Retry process cancelled.", "orange");
        break;
      }
      const id = idsToRetry[i];
      // We don't need to collect failures again, just attempt the download.
      await handleDownload(id);

      if (i < idsToRetry.length - 1) {
        await sleep(500); // Polite cooldown
      }
    }
    addLog("--- Retry process finished. ---", "purple");
  };

  const startSingleDownload = async (url: string) => {
    if (!url) {
      Alert.alert("Error", "Please enter an Imgur URL.");
      return;
    }
    resetState();
    const imgurId = extractImgurId(url);
    if (!imgurId) {
      addLog(`Could not extract a valid ID from: ${url}`, "red");
      setIsProcessing(false);
      return;
    }
    await handleDownload(imgurId);
    setIsProcessing(false);
  };

  /**
   * --- MODIFIED ---
   * Now collects failed IDs and prompts the user to retry.
   */
  const startBatchDownload = async () => {
    resetState();
    const localFailedIds: string[] = []; // Use a local array to track failures

    try {
      const urls = await readBatchFile(addLog);
      if (!urls) {
        setIsProcessing(false);
        return;
      }

      addLog(`Starting batch process for ${urls.length} URLs.`, "blue");
      for (let i = 0; i < urls.length; i++) {
        if (abortController.current?.signal.aborted) {
          addLog("Batch process cancelled.", "orange");
          break;
        }
        const url = urls[i];
        addLog(`--- Processing ${i + 1}/${urls.length}: ${url} ---`);
        const imgurId = extractImgurId(url);
        if (!imgurId) {
          addLog(`Skipping invalid URL: ${url}`, "orange");
          continue;
        }

        const success = await handleDownload(imgurId);
        if (!success) {
          localFailedIds.push(imgurId); // Add failed ID to our list
        }

        if (i < urls.length - 1) {
          await sleep(500);
        }
      }
      addLog("Initial batch process completed.", "green");

      // After the loop, check if there were any failures
      if (localFailedIds.length > 0 && !abortController.current?.signal.aborted) {
        Alert.alert(
          "Retry Failed Downloads?",
          `${localFailedIds.length} download(s) failed. This can happen due to temporary network or server issues. Would you like to try them again?`,
          [
            {
              text: "No, Thanks",
              style: "cancel",
              onPress: () => addLog("Skipping retry for failed downloads.", "orange"),
            },
            {
              text: "Retry",
              onPress: () => runRetryProcess(localFailedIds),
            },
          ],
        );
      }
    } catch (error: any) {
      addLog(`Batch process failed: ${error.message}`, "red");
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelProcess = () => {
    if (abortController.current) {
      addLog("Cancellation requested...", "orange");
      abortController.current.abort();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.configSection}>
        <Text style={styles.sectionTitle}>Configuration</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>
            Search for best quality (slower)
          </Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isBestQuality ? "#f5dd4b" : "#f4f3f4"}
            onValueChange={setIsBestQuality}
            disabled={isProcessing}
          />
        </View>
      </View>

      <Tab.Navigator>
        <Tab.Screen name="Single">
          {() => (
            <SingleDownloadTab
              onDownload={startSingleDownload}
              isProcessing={isProcessing}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Batch">
          {() => (
            <BatchDownloadTab
              onDownload={startBatchDownload}
              isProcessing={isProcessing}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>

      <View style={styles.outputSection}>
        <View style={styles.actionButtons}>
          <Button
            title="Open Last File"
            onPress={() => openFile(lastDownloadPath, addLog)}
            disabled={!lastDownloadPath || isProcessing}
          />
          {isProcessing ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Button
            title="Cancel"
            onPress={cancelProcess}
            disabled={!isProcessing}
            color="red"
          />
        </View>
        <View style={styles.panedWindow}>
          <LogView logs={logs} />
          <Preview filePath={lastDownloadPath} />
        </View>
      </View>
    </View>
  );
};

// ... Styles remain the same ...
const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  configSection: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: { fontSize: 14, flex: 1 },
  outputSection: { flex: 1, marginTop: 10 },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  panedWindow: {
    flex: 1,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
});

export default ImgurArchiveScreen;
