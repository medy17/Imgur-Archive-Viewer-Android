// src/components/Preview.tsx
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

const Preview = ({ filePath }: { filePath: string | null }) => {
  const isImage = filePath && /\.(jpg|jpeg|png|gif)$/i.test(filePath);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preview</Text>
      <View style={styles.content}>
        {isImage ? (
          <Image
            source={{ uri: `file://${filePath}` }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.placeholder}>
            {filePath ? "Preview not available" : "Preview Area"}
          </Text>
        )}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  title: { fontWeight: "bold", marginBottom: 5 },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width: "100%", height: "100%" },
  placeholder: { color: "#888" },
});
export default Preview;