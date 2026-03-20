import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ProgressBar, Surface, Text } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { QueueItem } from "../types";

const stateMeta: Record<
  QueueItem["state"],
  { label: string; color: string; icon: string; hint: string }
> = {
  searching: {
    label: "Searching",
    color: "#9DBEFF",
    icon: "database-search-outline",
    hint: "Looking up the archive entry.",
  },
  downloading: {
    label: "Downloading",
    color: "#F2C14E",
    icon: "progress-download",
    hint: "Saving the file to local storage.",
  },
  completed: {
    label: "Completed",
    color: "#7FD1A2",
    icon: "check-circle-outline",
    hint: "Saved and ready to open.",
  },
  failed: {
    label: "Failed",
    color: "#FF8A80",
    icon: "alert-circle-outline",
    hint: "The archive request did not complete.",
  },
  cancelled: {
    label: "Cancelled",
    color: "#8D959C",
    icon: "close-circle-outline",
    hint: "Stopped before completion.",
  },
};

const flatShadow = {
  elevation: 0,
  shadowColor: "transparent",
  shadowOpacity: 0,
  shadowRadius: 0,
  shadowOffset: { width: 0, height: 0 },
} as const;

const getItemDetail = (item: QueueItem) => {
  if (item.state === "failed" && item.error) {
    return item.error;
  }

  if (item.state === "completed" && item.path) {
    return item.path;
  }

  if (item.state === "downloading" && typeof item.progress === "number") {
    return `${Math.round(item.progress * 100)}% transferred`;
  }

  return stateMeta[item.state].hint;
};

const QueueView = ({
  items,
  isProcessing,
}: {
  items: QueueItem[];
  isProcessing: boolean;
}) => {
  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleIcon}>
            <MaterialCommunityIcons
              name={isProcessing ? "progress-clock" : "playlist-check"}
              size={20}
              color="#9DBEFF"
            />
          </View>
          <Text variant="titleMedium">Processing Queue</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Search, download, and completion states will appear here as each item moves through the queue.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {items.map((item) => {
            const meta = stateMeta[item.state];
            const progress =
              item.state === "searching" || item.progress === null ? 0 : item.progress;

            return (
              <View key={item.id} style={styles.item}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleRow}>
                    <MaterialCommunityIcons
                      name={meta.icon}
                      size={18}
                      color={meta.color}
                    />
                    <Text variant="labelLarge" style={styles.label} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>
                  <Text
                    variant="labelSmall"
                    style={[styles.stateText, { color: meta.color }]}
                  >
                    {meta.label}
                  </Text>
                </View>

                <Text
                  variant="bodySmall"
                  style={[
                    styles.detail,
                    item.state === "failed" && styles.detailError,
                  ]}
                  numberOfLines={2}
                >
                  {getItemDetail(item)}
                </Text>

                <View style={styles.progressRow}>
                  <ProgressBar
                    progress={progress}
                    indeterminate={item.state === "searching" || item.progress === null}
                    style={styles.progress}
                    color={meta.color}
                  />
                  <Text variant="labelSmall" style={styles.progressLabel}>
                    {item.state === "searching" || item.progress === null
                      ? "..."
                      : `${Math.round(progress * 100)}%`}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 220,
    borderRadius: 28,
    padding: 18,
    backgroundColor: "#161A1D",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2A3137",
    ...flatShadow,
  },
  header: {
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1B2024",
  },
  emptyState: {
    minHeight: 104,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#C1C7CE",
    lineHeight: 20,
  },
  scroll: {
    flexGrow: 0,
    maxHeight: 332,
  },
  content: {
    gap: 12,
    paddingBottom: 4,
  },
  item: {
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#1B2024",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  itemTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    flex: 1,
  },
  stateText: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detail: {
    color: "#C1C7CE",
    lineHeight: 18,
  },
  detailError: {
    color: "#FFB4AB",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progress: {
    flex: 1,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#111315",
  },
  progressLabel: {
    minWidth: 34,
    textAlign: "right",
    color: "#C1C7CE",
  },
});

export default QueueView;
