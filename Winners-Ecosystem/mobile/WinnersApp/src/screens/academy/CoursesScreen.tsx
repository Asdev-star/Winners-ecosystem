import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CoursesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Academy Courses</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1520', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#E8EEF5', fontSize: 18 },
});

export default CoursesScreen;