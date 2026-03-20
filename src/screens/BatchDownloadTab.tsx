// src/screens/BatchDownloadTab.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";

interface Props {
  onDownload: () => void;
  isProcessing: boolean;
}

const BatchDownloadTab = ({ onDownload, isProcessing }: Props) => {
  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={onDownload}
        disabled={isProcessing}
        loading={isProcessing}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Select File and Start
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  button: {
    borderRadius: 18,
    elevation: 0,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
});

export default BatchDownloadTab;
