import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Sparkles } from "lucide-react-native";

type Props = {
  label?: string;
  onPress: () => void;
};

const AssistantFAB = ({ label = "Ask Aria", onPress }: Props) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.button}>
      <View style={styles.iconWrap}>
        <Sparkles color="#0D1520" size={18} />
      </View>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 20,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#C9A84C",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F6E7B2",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#0D1520",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default AssistantFAB;
