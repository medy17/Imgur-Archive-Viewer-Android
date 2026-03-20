// src/components/LogView.tsx
import React, { useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Surface, Text } from "react-native-paper";
import { LogEntry } from "../types";

const LogView = ({ logs }: { logs: LogEntry[] }) => {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <Surface style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Activity
      </Text>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Download events and archive responses will stream here.
            </Text>
          </View>
        ) : (
          logs.map((log) => (
            <Text key={log.id} variant="bodySmall" style={[styles.logLine, { color: log.color }]}>
              {log.message}
            </Text>
          ))
        )}
      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 28,
    padding: 18,
    minHeight: 240,
    backgroundColor: "#161A1D",
    elevation: 0,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  title: {
    marginBottom: 12,
  },
  scroll: { flex: 1 },
  emptyState: {
    flex: 1,
    justifyContent: "center",
  },
  emptyText: {
    opacity: 0.7,
    lineHeight: 20,
  },
  logLine: {
    marginBottom: 8,
    lineHeight: 18,
  },
});

export default LogView;
