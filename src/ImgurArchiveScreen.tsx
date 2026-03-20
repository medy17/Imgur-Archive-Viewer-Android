// src/ImgurArchiveScreen.tsx
import React, { useState, useCallback, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Alert,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Button,
  BottomNavigation,
  Switch,
  Text,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { downloadFromArchive, extractImgurId } from "./api/imgur";
import { LogEntry, QueueItem } from "./types";
import SingleDownloadTab from "./screens/SingleDownloadTab";
import BatchDownloadTab from "./screens/BatchDownloadTab";
import GalleryTab from "./screens/GalleryTab";
import LogView from "./components/LogView";
import Preview from "./components/Preview";
import QueueView from "./components/QueueView";
import { readBatchFile, openFile } from "./utils/fileManager";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const flatShadow = {
  elevation: 0,
  shadowColor: "transparent",
  shadowOpacity: 0,
  shadowRadius: 0,
  shadowOffset: { width: 0, height: 0 },
} as const;
const routes = [
  { key: "single", title: "Single", focusedIcon: "link-variant" },
  { key: "batch", title: "Batch", focusedIcon: "format-list-bulleted" },
  { key: "gallery", title: "Gallery", focusedIcon: "image-multiple-outline" },
] as const;

const ImgurArchiveScreen = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWideLayout = width >= 900;
  const [tabIndex, setTabIndex] = useState(0);
  const [isBestQuality, setIsBestQuality] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastDownloadPath, setLastDownloadPath] = useState<string | null>(null);
  const logCounter = useRef(0);
  const queueCounter = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const activeRoute = routes[tabIndex] ?? routes[0];

  const addLog = useCallback(
    (
      message: string,
      color: LogEntry["color"] = "#F1F0F3",
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
    setQueueItems([]);
    setIsProcessing(true);
    setLastDownloadPath(null);
    abortController.current = new AbortController();
  };

  const addQueueItem = useCallback((imgurId: string) => {
    const id = `${imgurId}-${queueCounter.current++}`;
    setQueueItems((prevItems) => [
      ...prevItems,
      {
        id,
        imgurId,
        label: imgurId,
        progress: null,
        state: "searching",
      },
    ]);
    return id;
  }, []);

  const updateQueueItem = useCallback(
    (id: string, patch: Partial<QueueItem>) => {
      setQueueItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      );
    },
    [],
  );

  const handleDownload = useCallback(
    async (imgurId: string, queueId: string): Promise<boolean> => {
      addLog(`Processing ID: ${imgurId}`, "blue");
      const result = await downloadFromArchive(
        imgurId,
        isBestQuality,
        addLog,
        abortController.current!.signal,
        (progress) => {
          updateQueueItem(queueId, {
            progress,
            state: progress === null ? "searching" : "downloading",
          });
        },
      );

      if (result.success && result.path) {
        setLastDownloadPath(result.path);
        updateQueueItem(queueId, {
          progress: 1,
          path: result.path,
          state: "completed",
        });
      } else if (result.error) {
        updateQueueItem(queueId, {
          error: result.error,
          state: result.error.includes("cancelled") ? "cancelled" : "failed",
        });
        addLog(`Failed for ID ${imgurId}: ${result.error}`, "red");
      }
      return result.success;
    },
    [isBestQuality, addLog, updateQueueItem],
  );

  const runRetryProcess = async (idsToRetry: string[]) => {
    addLog(`--- Retrying ${idsToRetry.length} failed downloads... ---`, "purple");
    for (let i = 0; i < idsToRetry.length; i++) {
      if (abortController.current?.signal.aborted) {
        addLog("Retry process cancelled.", "orange");
        break;
      }
      const id = idsToRetry[i];
      const queueId = addQueueItem(id);
      await handleDownload(id, queueId);

      if (i < idsToRetry.length - 1) {
        await sleep(500);
      }
    }
    addLog("--- Retry process finished. ---", "purple");
  };

  const askToRetryFailedIds = (failedIds: string[]) =>
    new Promise<boolean>((resolve) => {
      Alert.alert(
        "Retry Failed Downloads?",
        `${failedIds.length} download(s) failed. This can happen due to temporary network or server issues. Would you like to try them again?`,
        [
          {
            text: "No, Thanks",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: "Retry",
            onPress: () => resolve(true),
          },
        ],
      );
    });

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
    const queueId = addQueueItem(imgurId);
    await handleDownload(imgurId, queueId);
    setIsProcessing(false);
  };

  const startBatchDownload = async () => {
    resetState();
    const localFailedIds: string[] = [];

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

        const queueId = addQueueItem(imgurId);
        const success = await handleDownload(imgurId, queueId);
        if (!success) {
          localFailedIds.push(imgurId);
        }

        if (i < urls.length - 1) {
          await sleep(500);
        }
      }
      addLog("Initial batch process completed.", "green");

      if (localFailedIds.length > 0 && !abortController.current?.signal.aborted) {
        const shouldRetry = await askToRetryFailedIds(localFailedIds);
        if (shouldRetry) {
          await runRetryProcess(localFailedIds);
        } else {
          addLog("Skipping retry for failed downloads.", "orange");
        }
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

  const renderModeContent = () => {
    if (activeRoute.key === "single") {
      return (
        <SingleDownloadTab
          onDownload={startSingleDownload}
          isProcessing={isProcessing}
        />
      );
    }

    return activeRoute.key === "batch" ? (
      <BatchDownloadTab
        onDownload={startBatchDownload}
        isProcessing={isProcessing}
      />
    ) : (
      <GalleryTab
        active={activeRoute.key === "gallery"}
        refreshKey={lastDownloadPath}
        onOpenFile={(path) => openFile(path, addLog)}
      />
    );
  };

  return (
    <View style={styles.screen}>
      {activeRoute.key === "gallery" ? (
        <View
          style={[
            styles.galleryContainer,
            { paddingBottom: 16 + insets.bottom },
          ]}
        >
          {renderModeContent()}
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: 28 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.topSection, isWideLayout && styles.topSectionWide]}>
            <View style={styles.modeColumn}>{renderModeContent()}</View>

            <View style={styles.controlsPanel}>
              <View style={styles.preferenceRow}>
                <Text variant="titleMedium">Best Quality</Text>
                <Switch
                  value={isBestQuality}
                  onValueChange={setIsBestQuality}
                  disabled={isProcessing}
                />
              </View>
              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  onPress={() => openFile(lastDownloadPath, addLog)}
                  disabled={!lastDownloadPath || isProcessing}
                  style={styles.primaryButton}
                  contentStyle={styles.actionButtonContent}
                >
                  Open Latest File
                </Button>
                <Button
                  mode="outlined"
                  onPress={cancelProcess}
                  disabled={!isProcessing}
                  style={styles.secondaryButton}
                  contentStyle={styles.actionButtonContent}
                >
                  Cancel Run
                </Button>
              </View>
              <QueueView items={queueItems} />
            </View>
          </View>

          <View style={[styles.outputSection, isWideLayout && styles.outputSectionWide]}>
            <LogView logs={logs} />
            <Preview filePath={lastDownloadPath} />
          </View>
        </ScrollView>
      )}

      <BottomNavigation.Bar
        navigationState={{ index: tabIndex, routes: [...routes] }}
        onTabPress={({ route }) => {
          setTabIndex(routes.findIndex((item) => item.key === route.key));
        }}
        style={styles.bottomBar}
        safeAreaInsets={{ bottom: insets.bottom }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 28,
  },
  galleryContainer: {
    flex: 1,
    padding: 16,
  },
  topSection: {
    gap: 16,
  },
  topSectionWide: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  modeColumn: {
    flex: 1.4,
  },
  controlsPanel: {
    flex: 0.9,
    gap: 16,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionButtons: {
    gap: 12,
  },
  actionButtonContent: {
    paddingVertical: 8,
  },
  primaryButton: {
    borderRadius: 18,
    ...flatShadow,
  },
  secondaryButton: {
    borderRadius: 18,
    ...flatShadow,
  },
  outputSection: {
    gap: 16,
  },
  outputSectionWide: {
    flexDirection: "row",
  },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2A3137",
    backgroundColor: "#161A1D",
    ...flatShadow,
  },
});

export default ImgurArchiveScreen;
