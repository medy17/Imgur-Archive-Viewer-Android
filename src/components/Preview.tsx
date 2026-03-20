// src/components/Preview.tsx
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Surface, Text } from "react-native-paper";

const Preview = ({ filePath }: { filePath: string | null }) => {
  const isImage = filePath && /\.(jpg|jpeg|png|gif)$/i.test(filePath);

  return (
    <Surface style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Preview
      </Text>
      <View style={styles.content}>
        {isImage ? (
          <Image
            source={{ uri: `file://${filePath}` }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <Text variant="bodyMedium" style={styles.placeholder}>
            {filePath
              ? "Preview is unavailable for this file type."
              : "Your latest download preview will appear here."}
          </Text>
        )}
      </View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "#1B2024",
  },
  image: { width: "100%", height: "100%" },
  placeholder: {
    textAlign: "center",
    opacity: 0.7,
    maxWidth: 240,
    lineHeight: 20,
  },
});

export default Preview;
