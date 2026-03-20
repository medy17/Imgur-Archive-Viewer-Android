import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";
import RNFS from "react-native-fs";
import Video, {
  OnProgressData,
  VideoRef,
  ViewType,
} from "react-native-video";
import { IconButton, ActivityIndicator, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GalleryItem } from "../types";
import { ensureAppMediaDir } from "../utils/fileManager";

const isGifFile = (name: string) => /\.gif$/i.test(name);
const isImageFile = (name: string) => /\.(jpg|jpeg|png)$/i.test(name);
const isVideoFile = (name: string) => /\.(mp4|webm|mpeg|gifv)$/i.test(name);
const getFileUri = (path: string) => `file://${path}`;
const androidVideoViewType =
  Platform.OS === "android" ? ViewType.TEXTURE : undefined;
const PREVIEW_CYCLE_MS = 2200;
const MANUAL_PREVIEW_HOLD_MS = 4500;

const mediaBadge: Record<GalleryItem["type"], string | null> = {
  image: null,
  gif: "GIF",
  video: "VIDEO",
  file: "FILE",
};

const TileMedia = ({
  item,
  active,
}: {
  item: GalleryItem;
  active: boolean;
}) => {
  if (item.type === "video") {
    return (
      <Video
        source={{ uri: getFileUri(item.path) }}
        style={styles.image}
        resizeMode="cover"
        viewType={androidVideoViewType}
        repeat
        muted
        paused={!active}
        controls={false}
      />
    );
  }

  if (item.type === "image" || item.type === "gif") {
    return (
      <Image
        source={{ uri: getFileUri(item.path) }}
        style={styles.image}
        resizeMode="cover"
      />
    );
  }

  return (
    <Text variant="labelLarge" style={styles.fileType}>
      FILE
    </Text>
  );
};

const ViewerMedia = ({
  item,
  paused,
  currentTime,
  onProgress,
  videoRef,
}: {
  item: GalleryItem;
  paused: boolean;
  currentTime: number;
  onProgress: (event: OnProgressData) => void;
  videoRef: React.RefObject<VideoRef | null>;
}) => {
  if (item.type === "video") {
    return (
      <Video
        ref={videoRef}
        source={{ uri: getFileUri(item.path) }}
        style={styles.viewerMedia}
        resizeMode="contain"
        viewType={androidVideoViewType}
        controls
        paused={paused}
        onProgress={onProgress}
        onLoad={() => {
          if (currentTime > 0) {
            videoRef.current?.seek(currentTime);
          }
        }}
      />
    );
  }

  if (item.type === "image" || item.type === "gif") {
    return (
      <Image
        source={{ uri: getFileUri(item.path) }}
        style={styles.viewerMedia}
        resizeMode="contain"
      />
    );
  }

  return (
    <View style={styles.viewerFallback}>
      <Text variant="titleMedium">Preview unavailable</Text>
      <Text variant="bodyMedium" style={styles.viewerFallbackText}>
        This file type can be opened externally.
      </Text>
    </View>
  );
};

interface Props {
  active: boolean;
  refreshKey: string | null;
  onOpenFile: (path: string) => void;
}

const GalleryTab = ({ active, refreshKey, onOpenFile }: Props) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerCurrentTime, setViewerCurrentTime] = useState(0);
  const [visiblePaths, setVisiblePaths] = useState<Set<string>>(new Set());
  const [activePreviewPath, setActivePreviewPath] = useState<string | null>(null);
  const [manualPreviewPath, setManualPreviewPath] = useState<string | null>(null);
  const expandedVideoRef = useRef<VideoRef | null>(null);
  const fullscreenVideoRef = useRef<VideoRef | null>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 65 });
  const numColumns = width >= 1100 ? 4 : width >= 700 ? 3 : 2;
  const horizontalPadding = 16;
  const gap = 12;
  const itemWidth =
    (width - horizontalPadding * 2 - gap * (numColumns - 1)) / numColumns;
  const viewerHeight = Math.max(320, Math.min(height * 0.68, 640));

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken<GalleryItem>> }) => {
      setVisiblePaths(
        new Set(
          viewableItems
            .map((entry) => entry.item?.path)
            .filter((path): path is string => Boolean(path)),
        ),
      );
    },
  );

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
        const nextItems: GalleryItem[] = entries
          .filter((entry) => entry.isFile())
          .map<GalleryItem>((entry) => ({
            path: entry.path,
            name: entry.name,
            type: isGifFile(entry.name)
              ? "gif"
              : isImageFile(entry.name)
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

  useEffect(() => {
    if (!manualPreviewPath) {
      return;
    }

    const timeout = setTimeout(() => {
      setManualPreviewPath((currentPath) =>
        currentPath === manualPreviewPath ? null : currentPath,
      );
    }, MANUAL_PREVIEW_HOLD_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [manualPreviewPath]);

  useEffect(() => {
    if (!active || selectedItem || isFullscreen) {
      setActivePreviewPath(null);
      return;
    }

    const visibleVideoPaths = items
      .filter((item) => item.type === "video" && visiblePaths.has(item.path))
      .map((item) => item.path);

    if (visibleVideoPaths.length === 0) {
      setActivePreviewPath(null);
      return;
    }

    if (manualPreviewPath && visibleVideoPaths.includes(manualPreviewPath)) {
      setActivePreviewPath((currentPath) =>
        currentPath === manualPreviewPath ? currentPath : manualPreviewPath,
      );
      return;
    }

    setActivePreviewPath((currentPath) => {
      if (currentPath && visibleVideoPaths.includes(currentPath)) {
        return currentPath;
      }

      return visibleVideoPaths[0];
    });

    if (visibleVideoPaths.length === 1) {
      return;
    }

    const interval = setInterval(() => {
      setActivePreviewPath((currentPath) => {
        if (!currentPath || !visibleVideoPaths.includes(currentPath)) {
          return visibleVideoPaths[0];
        }

        const currentIndex = visibleVideoPaths.indexOf(currentPath);
        return visibleVideoPaths[(currentIndex + 1) % visibleVideoPaths.length];
      });
    }, PREVIEW_CYCLE_MS);

    return () => {
      clearInterval(interval);
    };
  }, [active, isFullscreen, items, manualPreviewPath, selectedItem, visiblePaths]);

  const closeExpandedViewer = () => {
    setIsFullscreen(false);
    setSelectedItem(null);
    setViewerCurrentTime(0);
  };

  const closeFullscreenViewer = () => {
    setIsFullscreen(false);
  };

  const handleViewerProgress = (event: OnProgressData) => {
    setViewerCurrentTime(event.currentTime);
  };

  const handleTilePress = (item: GalleryItem) => {
    setViewerCurrentTime(0);
    setIsFullscreen(false);
    setSelectedItem(item);
  };

  const activateTilePreview = (item: GalleryItem) => {
    if (item.type !== "video") {
      return;
    }

    setManualPreviewPath(item.path);
    setActivePreviewPath(item.path);
  };

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
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig.current}
          renderItem={({ item }) => {
            const isPreviewActive =
              active &&
              !selectedItem &&
              !isFullscreen &&
              item.path === activePreviewPath;

            return (
              <Pressable
                style={[styles.pressable, { width: itemWidth }]}
                onPressIn={() => activateTilePreview(item)}
                onHoverIn={() => activateTilePreview(item)}
                onHoverOut={() => {
                  setManualPreviewPath((currentPath) =>
                    currentPath === item.path ? null : currentPath,
                  );
                }}
                onPress={() => handleTilePress(item)}
              >
                <View style={styles.card}>
                  <View style={styles.thumb}>
                    <TileMedia item={item} active={isPreviewActive} />
                    {mediaBadge[item.type] ? (
                      <View style={styles.badge}>
                        <Text variant="labelSmall" style={styles.badgeText}>
                          {mediaBadge[item.type]}
                        </Text>
                      </View>
                    ) : null}
                    {item.type === "video" ? (
                      <View style={styles.playIcon}>
                        <IconButton
                          icon="play"
                          size={18}
                          iconColor="#F1F0F3"
                          containerColor="#111315CC"
                        />
                      </View>
                    ) : null}
                  </View>
                  <Text variant="bodyMedium" numberOfLines={2}>
                    {item.name}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No files yet.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={selectedItem !== null}
        transparent
        animationType="fade"
        onRequestClose={closeExpandedViewer}
      >
        {selectedItem ? (
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.viewerSheet,
                {
                  marginTop: insets.top + 10,
                  marginBottom: insets.bottom + 10,
                },
              ]}
            >
              <View style={styles.viewerHeader}>
                <View style={styles.viewerTitleBlock}>
                  <Text variant="titleMedium" numberOfLines={1}>
                    {selectedItem.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.viewerSubtitle}>
                    {selectedItem.type === "gif"
                      ? "Animated GIF"
                      : selectedItem.type === "video"
                        ? "Video preview"
                        : selectedItem.type === "image"
                          ? "Image preview"
                          : "File preview"}
                  </Text>
                </View>
                <View style={styles.viewerActions}>
                  <IconButton
                    icon="open-in-new"
                    size={20}
                    onPress={() => onOpenFile(selectedItem.path)}
                  />
                  <IconButton
                    icon="fullscreen"
                    size={20}
                    onPress={() => setIsFullscreen(true)}
                  />
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={closeExpandedViewer}
                  />
                </View>
              </View>

              <View style={[styles.viewerStage, { height: viewerHeight }]}>
                <ViewerMedia
                  item={selectedItem}
                  paused={isFullscreen}
                  currentTime={viewerCurrentTime}
                  onProgress={handleViewerProgress}
                  videoRef={expandedVideoRef}
                />
              </View>
            </View>
          </View>
        ) : null}
      </Modal>

      <Modal
        visible={isFullscreen && selectedItem !== null}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={closeFullscreenViewer}
      >
        {selectedItem ? (
          <View style={styles.fullscreenContainer}>
            <StatusBar hidden />
            <View
              style={[
                styles.fullscreenTopBar,
                { top: insets.top + 6 },
              ]}
            >
              <IconButton
                icon="fullscreen-exit"
                size={22}
                iconColor="#F1F0F3"
                containerColor="#111315CC"
                onPress={closeFullscreenViewer}
              />
              <IconButton
                icon="close"
                size={22}
                iconColor="#F1F0F3"
                containerColor="#111315CC"
                onPress={closeExpandedViewer}
              />
            </View>
            <View style={styles.fullscreenMediaFrame}>
              <ViewerMedia
                item={selectedItem}
                paused={!isFullscreen}
                currentTime={viewerCurrentTime}
                onProgress={handleViewerProgress}
                videoRef={fullscreenVideoRef}
              />
            </View>
          </View>
        ) : null}
      </Modal>
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
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    borderRadius: 999,
    backgroundColor: "#111315CC",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#F1F0F3",
    letterSpacing: 0.4,
  },
  playIcon: {
    position: "absolute",
    right: 8,
    bottom: 8,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#050607CC",
    paddingHorizontal: 12,
  },
  viewerSheet: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: "#111315",
    padding: 14,
  },
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  viewerTitleBlock: {
    flex: 1,
    gap: 2,
  },
  viewerSubtitle: {
    color: "#C1C7CE",
  },
  viewerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewerStage: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1B2024",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerMedia: {
    width: "100%",
    height: "100%",
  },
  viewerFallback: {
    alignItems: "center",
    gap: 8,
  },
  viewerFallbackText: {
    color: "#C1C7CE",
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
  },
  fullscreenTopBar: {
    position: "absolute",
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 8,
    right: 8,
  },
  fullscreenMediaFrame: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
});

export default GalleryTab;
