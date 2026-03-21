import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MarketStackParamList } from "../../navigation/TabNavigator";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import AssistantFAB from "../../components/shared/AssistantFAB";

type Props = NativeStackScreenProps<MarketStackParamList, "MarketHome">;

const offers = [
  { id: "growth-kit", title: "Growth Kit", price: "$149", note: "Templates, scripts, and launch assets." },
  { id: "audit-pack", title: "Offer Audit", price: "$95", note: "Fastest mobile checkout for service buyers." },
];

export default function MarketScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <EcosystemContextBar layer="Market" assistant="ATLAS" />
        <Text style={styles.title}>High-intent offers</Text>
        <Text style={styles.copy}>
          The mobile storefront is optimized for urgency, trust, and fast checkout completion.
        </Text>

        {offers.map((offer) => (
          <View key={offer.id} style={styles.card}>
            <Text style={styles.cardTitle}>{offer.title}</Text>
            <Text style={styles.cardPrice}>{offer.price}</Text>
            <Text style={styles.cardCopy}>{offer.note}</Text>
            <Pressable onPress={() => navigation.navigate("Checkout")} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Buy now</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <AssistantFAB
        label="Ask ATLAS"
        onPress={() => navigation.getParent()?.navigate("Intelligence" as never)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D1520",
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    color: "#F5F7FA",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  copy: {
    color: "#93A4B8",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 18,
  },
  card: {
    backgroundColor: "#162131",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#223247",
    padding: 18,
    gap: 10,
    marginBottom: 14,
  },
  cardTitle: {
    color: "#F5F7FA",
    fontSize: 18,
    fontWeight: "800",
  },
  cardPrice: {
    color: "#C9A84C",
    fontSize: 16,
    fontWeight: "800",
  },
  cardCopy: {
    color: "#C6D0DA",
    fontSize: 14,
    lineHeight: 21,
  },
  secondaryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#C9A84C",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#0D1520",
    fontWeight: "900",
    fontSize: 12,
  },
});
