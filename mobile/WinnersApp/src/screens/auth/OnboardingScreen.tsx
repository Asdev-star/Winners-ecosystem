import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CheckCircle2 } from "lucide-react-native";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

const items = [
  "Set your mobile context for community, academy, market, work, and ARIA.",
  "Enable notifications for milestone alerts, AI reminders, and order updates.",
  "Prepare an offline-first queue for posting, checkout, and lesson progress.",
];

const OnboardingScreen = ({ navigation }: Props) => {
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const user = useAuthStore((state) => state.user);

  const handleContinue = () => {
    completeOnboarding();
    if (!user) {
      navigation.navigate("Login");
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Mobile Launch Setup</Text>
      <Text style={styles.title}>Build your operating rhythm in under five minutes.</Text>
      <Text style={styles.copy}>
        Winners mobile starts with a guided setup so your team, learning, and AI flows feel coherent from the first
        session.
      </Text>

      <View style={styles.card}>
        {items.map((item) => (
          <View key={item} style={styles.item}>
            <CheckCircle2 color="#C9A84C" size={18} />
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={handleContinue} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>{user ? "Finish setup" : "Return to sign in"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0D1520",
  },
  content: {
    padding: 24,
    gap: 18,
  },
  eyebrow: {
    color: "#C9A84C",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: "#E8EEF5",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
  },
  copy: {
    color: "#9AB1C6",
    fontSize: 15,
    lineHeight: 24,
  },
  card: {
    backgroundColor: "#111D2E",
    borderWidth: 1,
    borderColor: "#1E3248",
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  item: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  itemText: {
    flex: 1,
    color: "#E8EEF5",
    fontSize: 14,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: "#C9A84C",
    borderRadius: 14,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#0D1520",
    fontWeight: "800",
    fontSize: 16,
  },
});

export default OnboardingScreen;
