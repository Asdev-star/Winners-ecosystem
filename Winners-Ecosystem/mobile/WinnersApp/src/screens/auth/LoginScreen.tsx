import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const LoginScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Winners Ecosystem</Text>
      <Text style={styles.subtitle}>DIGITAL SOVEREIGN INFRASTRUCTURE</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('Onboarding')}
      >
        <Text style={styles.buttonText}>Login with Biometrics</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1520',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#E8EEF5',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#C9A84C',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#C9A84C',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#0D1520',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LoginScreen;