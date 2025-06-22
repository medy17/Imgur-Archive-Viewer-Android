// src/components/LogView.tsx
import React, { useRef } from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { LogEntry } from "../types";

const LogView = ({ logs }: { logs: LogEntry[] }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log</Text>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {logs.map((log) => (
          <Text key={log.id} style={{ color: log.color }}>
            {log.message}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, borderRightWidth: 1, borderColor: "#ccc" },
  title: { fontWeight: "bold", marginBottom: 5 },
  scroll: { flex: 1 },
});
export default LogView;