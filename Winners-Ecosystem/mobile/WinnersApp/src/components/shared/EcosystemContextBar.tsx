import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EcosystemContextBar = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Winners Empire v1.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#172335',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3248',
  },
  text: {
    color: '#5A7A96',
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});

export default EcosystemContextBar;