import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MessageSquareText } from 'lucide-react-native';

const AssistantFAB = ({ onPress }: any) => {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
      <MessageSquareText color="#0D1520" size={24} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#C9A84C',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default AssistantFAB;