import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RefreshCw, WifiOff } from "lucide-react-native";

type Props = {
  isOnline: boolean;
  isSyncing?: boolean;
  pendingCount?: number;
  onSync?: () => void;
};

const OfflineBanner = ({ isOnline, isSyncing = false, onSync, pendingCount = 0 }: Props) => {
  if (isOnline && !pendingCount && !isSyncing) return null;

  return (
    <View style={[styles.container, isOnline ? styles.online : styles.offline]}>
      <View style={styles.messageRow}>
        <WifiOff color="#FFFFFF" size={14} />
        <Text style={styles.text}>
          {!isOnline
            ? "Offline mode enabled. Actions will sync when you reconnect."
            : isSyncing
              ? "Syncing queued activity..."
              : `${pendingCount} queued action${pendingCount === 1 ? "" : "s"} ready to sync.`}
        </Text>
      </View>

      {isOnline && pendingCount > 0 && onSync ? (
        <TouchableOpacity onPress={onSync} style={styles.action}>
          <RefreshCw color="#FFFFFF" size={12} />
          <Text style={styles.actionText}>Sync</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  offline: {
    backgroundColor: "#9B2C2C",
  },
  online: {
    backgroundColor: "#1D4E89",
  },
  messageRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    flex: 1,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
});

export default OfflineBanner;
