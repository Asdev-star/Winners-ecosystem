import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import { TabParamList } from "../../navigation/types";

type Props = BottomTabScreenProps<TabParamList, "Market">;

const offers = [
  {
    id: "market-growth-kit",
    title: "Growth stack launch kit",
    detail: "Offer pages, follow-up automations, and campaign copy for a fast launch.",
  },
  {
    id: "market-creator-bundle",
    title: "Creator commerce bundle",
    detail: "Monetization templates, storefront setup, and community conversion playbooks.",
  },
];

const MarketScreen = ({ navigation }: Props) => {
  return (
    <View style={styles.screen}>
      <EcosystemContextBar
        label="Market"
        context="Move from discovery to checkout with a mobile-native buying path."
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>High-conviction offers</Text>
          <Text style={styles.heroBody}>Ship mobile checkout flows that still behave when the network gets shaky.</Text>
        </View>

        {offers.map((offer) => (
          <TouchableOpacity
            key={offer.id}
            activeOpacity={0.9}
            onPress={() => navigation.getParent()?.navigate("Checkout", { planId: offer.id, source: "market" })}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>{offer.title}</Text>
            <Text style={styles.cardBody}>{offer.detail}</Text>
            <Text style={styles.cta}>Open checkout</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0D1520",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  hero: {
    backgroundColor: "#111D2E",
    borderColor: "#1E3248",
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  heroTitle: {
    color: "#E8EEF5",
    fontSize: 24,
    fontWeight: "800",
  },
  heroBody: {
    color: "#8FA6BA",
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#111D2E",
    borderColor: "#1E3248",
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  cardTitle: {
    color: "#E8EEF5",
    fontSize: 18,
    fontWeight: "700",
  },
  cardBody: {
    color: "#8FA6BA",
    fontSize: 14,
    lineHeight: 22,
  },
  cta: {
    color: "#C9A84C",
    fontSize: 13,
    fontWeight: "700",
  },
});

export default MarketScreen;
