// src/screens/SingleDownloadTab.tsx
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, TextInput } from "react-native-paper";

interface Props {
  onDownload: (url: string) => void;
  isProcessing: boolean;
}

const SingleDownloadTab = ({ onDownload, isProcessing }: Props) => {
  const [url, setUrl] = useState("");
  const hasValue = url.trim().length > 0;

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        style={styles.input}
        label="Imgur URL or ID"
        placeholder="imgur.com/example or example.jpg"
        value={url}
        onChangeText={setUrl}
        editable={!isProcessing}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Button
        mode="contained"
        onPress={() => onDownload(url)}
        disabled={isProcessing || !hasValue}
        loading={isProcessing}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Download from Archive
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  input: {
    backgroundColor: "#161A1D",
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

export default SingleDownloadTab;
