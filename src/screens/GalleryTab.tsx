import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import RNFS from "react-native-fs";
import { ActivityIndicator, Text } from "react-native-paper";
import { GalleryItem } from "../types";
import { ensureAppMediaDir } from "../utils/fileManager";

const isImageFile = (name: string) => /\.(jpg|jpeg|png|gif)$/i.test(name);
const isVideoFile = (name: string) => /\.(mp4|webm|mpeg)$/i.test(name);

interface Props {
  active: boolean;
  refreshKey: string | null;
  onOpenFile: (path: string) => void;
}

const GalleryTab = ({ active, refreshKey, onOpenFile }: Props) => {
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const numColumns = width >= 1100 ? 4 : width >= 700 ? 3 : 2;
  const horizontalPadding = 16;
  const gap = 12;
  const itemWidth =
    (width - horizontalPadding * 2 - gap * (numColumns - 1)) / numColumns;

  useEffect(() => {
    if (!active) {
      return;
    }

    let cancelled = false;

    const loadGallery = async () => {
      setLoading(true);

      try {
        const mediaDir = await ensureAppMediaDir();
        const entries = await RNFS.readDir(mediaDir);
        const nextItems = entries
          .filter((entry) => entry.isFile())
          .map((entry) => ({
            path: entry.path,
            name: entry.name,
            type: isImageFile(entry.name)
              ? "image"
              : isVideoFile(entry.name)
                ? "video"
                : "file",
            modifiedAt: entry.mtime?.getTime?.() ?? 0,
          }))
          .sort((a, b) => b.modifiedAt - a.modifiedAt);

        if (!cancelled) {
          setItems(nextItems);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadGallery();

    return () => {
      cancelled = true;
    };
  }, [active, refreshKey]);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={items}
          key={numColumns}
          numColumns={numColumns}
          keyExtractor={(item) => item.path}
          columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.pressable, { width: itemWidth }]}
              onPress={() => onOpenFile(item.path)}
            >
              <View style={styles.card}>
                <View style={styles.thumb}>
                  {item.type === "image" ? (
                    <Image
                      source={{ uri: `file://${item.path}` }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text variant="labelLarge" style={styles.fileType}>
                      {item.type === "video" ? "VIDEO" : "FILE"}
                    </Text>
                  )}
                </View>
                <Text variant="bodyMedium" numberOfLines={2}>
                  {item.name}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No files yet.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingBottom: 16,
    gap: 12,
  },
  row: {
    gap: 12,
    justifyContent: "flex-start",
  },
  pressable: {
    marginBottom: 12,
  },
  card: {
    gap: 8,
  },
  thumb: {
    aspectRatio: 1,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1B2024",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  fileType: {
    opacity: 0.72,
  },
  center: {
    flex: 1,
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    opacity: 0.72,
  },
});

export default GalleryTab;
