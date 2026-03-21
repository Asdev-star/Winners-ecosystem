import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';

const OfflineBanner = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <WifiOff color="#FFFFFF" size={14} />
      <Text style={styles.text}>Working Offline</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#C53030',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default OfflineBanner;