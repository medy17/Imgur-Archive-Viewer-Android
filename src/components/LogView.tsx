import React, { useRef } from "react";
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Button, Text } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { LogEntry } from "../types";

const LogView = ({
  logs,
  onClear,
  style,
}: {
  logs: LogEntry[];
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleIcon}>
            <MaterialCommunityIcons
              name="text-box-search-outline"
              size={20}
              color="#9DBEFF"
            />
          </View>
          <View style={styles.titleText}>
            <Text variant="titleMedium">Logs</Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              {logs.length === 0
                ? "No events captured yet."
                : `${logs.length} event${logs.length === 1 ? "" : "s"} recorded`}
            </Text>
          </View>
        </View>
        {onClear ? (
          <Button
            mode="text"
            onPress={onClear}
            compact
            disabled={logs.length === 0}
            textColor="#C1C7CE"
          >
            Clear
          </Button>
        ) : null}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Download events, retry attempts, and archive responses will stream here while the app works.
            </Text>
          </View>
        ) : (
          logs.map((log, index) => (
            <View key={log.id} style={styles.logRow}>
              <Text variant="labelSmall" style={styles.logIndex}>
                {String(index + 1).padStart(2, "0")}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.logLine, { color: log.color }]}
              >
                {log.message}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  titleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1B2024",
  },
  titleText: {
    flex: 1,
    gap: 2,
  },
  subtitle: {
    color: "#C1C7CE",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
    gap: 10,
  },
  emptyState: {
    flex: 1,
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#C1C7CE",
    lineHeight: 21,
    maxWidth: 320,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#1B2024",
  },
  logIndex: {
    width: 24,
    color: "#8D959C",
    textAlign: "right",
    paddingTop: 1,
  },
  logLine: {
    flex: 1,
    lineHeight: 19,
  },
});

export default LogView;
