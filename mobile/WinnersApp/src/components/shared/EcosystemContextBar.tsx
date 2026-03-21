import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  context: string;
};

const EcosystemContextBar = ({ context, label }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.context}>{context}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111D2E",
    borderBottomWidth: 1,
    borderBottomColor: "#1E3248",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
  },
  label: {
    color: "#C9A84C",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  context: {
    color: "#9AB1C6",
    fontSize: 13,
    lineHeight: 18,
  },
});

export default EcosystemContextBar;
