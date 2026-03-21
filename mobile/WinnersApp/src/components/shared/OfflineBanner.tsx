import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNetworkStatus } from "../../services/offline";

export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <View style={styles.root}>
      <Text style={styles.text}>Offline mode: queued actions will sync when connection returns.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#D66C6C",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
