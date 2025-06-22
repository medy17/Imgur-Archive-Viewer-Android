// src/screens/BatchDownloadTab.tsx
import React from "react";
import { View, Button, StyleSheet, Text } from "react-native";

interface Props {
  onDownload: () => void;
  isProcessing: boolean;
}

const BatchDownloadTab = ({ onDownload, isProcessing }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select a .txt file with URLs (one per line)</Text>
      <Button
        title="Select File & Start Batch"
        onPress={onDownload}
        disabled={isProcessing}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  label: { textAlign: "center", marginBottom: 20, fontSize: 16 },
});
export default BatchDownloadTab;