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
import { LogEntry, DownloadResult } from "./types";
import SingleDownloadTab from "./screens/SingleDownloadTab";
import BatchDownloadTab from "./screens/BatchDownloadTab";
import LogView from "./components/LogView";
import Preview from "./components/Preview";
import { openFile, readBatchFile } from "./utils/fileManager";

const Tab = createMaterialTopTabNavigator();

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

  const handleDownload = useCallback(
    async (imgurId: string): Promise<DownloadResult> => {
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
      return result;
    },
    [isBestQuality, addLog],
  );

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

  const startBatchDownload = async () => {
    resetState();
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
        await handleDownload(imgurId);
      }
      addLog("Batch process completed.", "green");
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
            value={isBestQuality}
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
            <View style={{ width: 40 }} /> // Placeholder for spacing
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

// ... Add Styles ...
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