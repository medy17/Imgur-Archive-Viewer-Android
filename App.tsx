// App.tsx
import React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";
import ImgurArchiveScreen from "./src/ImgurArchiveScreen";
import { materialTheme } from "./src/theme/materialTheme";

const App = () => {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={materialTheme}>
        <SafeAreaView
          style={styles.safeArea}
          edges={["top", "left", "right", "bottom"]}
        >
          <StatusBar
            barStyle="light-content"
            backgroundColor={materialTheme.colors.surface}
          />
          <View style={styles.container}>
            <ImgurArchiveScreen />
          </View>
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: materialTheme.colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: materialTheme.colors.background,
  },
});

export default App;
