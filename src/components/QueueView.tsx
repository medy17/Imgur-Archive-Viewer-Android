import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ProgressBar, Text } from "react-native-paper";
import { QueueItem } from "../types";

const stateLabel: Record<QueueItem["state"], string> = {
  searching: "Searching",
  downloading: "Downloading",
  completed: "Done",
  failed: "Failed",
  cancelled: "Cancelled",
};

const stateColor: Record<QueueItem["state"], string> = {
  searching: "#B8C8FF",
  downloading: "#F4B8C8",
  completed: "#A8D5BA",
  failed: "#FFB4AB",
  cancelled: "#C1C7CE",
};

const QueueView = ({ items }: { items: QueueItem[] }) => {
  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Queue
      </Text>
      {items.length === 0 ? (
        <View style={styles.empty} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.row}>
                <Text variant="labelLarge" style={styles.label}>
                  {item.label}
                </Text>
                <Text
                  variant="labelMedium"
                  style={[styles.state, { color: stateColor[item.state] }]}
                >
                  {stateLabel[item.state]}
                </Text>
              </View>
              <ProgressBar
                progress={
                  item.state === "searching" || item.progress === null
                    ? 0
                    : item.progress
                }
                indeterminate={item.state === "searching" || item.progress === null}
                style={styles.progress}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 140,
  },
  title: {
    marginBottom: 10,
  },
  empty: {
    flex: 1,
    minHeight: 72,
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    gap: 12,
  },
  item: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    flex: 1,
  },
  state: {
    textTransform: "uppercase",
  },
  progress: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#111315",
  },
});

export default QueueView;
