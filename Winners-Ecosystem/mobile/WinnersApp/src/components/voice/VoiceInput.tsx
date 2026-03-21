import React, { useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Mic } from 'lucide-react-native';

const VoiceInput = ({ onSpeechResult }: any) => {
  const [isListening, setIsListening] = useState(false);

  return (
    <TouchableOpacity 
      style={[styles.button, isListening && styles.listening]}
      onLongPress={() => setIsListening(true)}
      onPressOut={() => setIsListening(false)}
    >
      <Mic color={isListening ? "#FFFFFF" : "#C9A84C"} size={24} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#172335',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E3248',
  },
  listening: {
    backgroundColor: '#B8912A',
    borderColor: '#C9A84C',
  },
});

export default VoiceInput;