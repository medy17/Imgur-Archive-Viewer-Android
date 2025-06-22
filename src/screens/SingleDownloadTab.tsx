// src/screens/SingleDownloadTab.tsx
import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet } from "react-native";

interface Props {
  onDownload: (url: string) => void;
  isProcessing: boolean;
}

const SingleDownloadTab = ({ onDownload, isProcessing }: Props) => {
  const [url, setUrl] = useState("");
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter Imgur ID or URL e.g example.jpg or imgur.io/example.jpg"
        value={url}
        onChangeText={setUrl}
        editable={!isProcessing}
      />
      <Button
        title="Download"
        onPress={() => onDownload(url)}
        disabled={isProcessing}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
});
export default SingleDownloadTab;