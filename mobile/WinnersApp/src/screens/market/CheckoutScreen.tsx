import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Card from "../../components/ui/Card";
import { MarketStackParamList } from "../../navigation/types";
import { useMarketStore } from "../../stores/marketStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<MarketStackParamList, "Checkout">;
type PaymentMethod = "applepay" | "googlepay" | "mpesa" | "momo" | "card";

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function CheckoutScreen({ navigation }: Props) {
  const products = useMarketStore((state) => state.products);
  const cartItems = useMarketStore((state) => state.cartItems);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("applepay");
  const [message, setMessage] = useState("Biometric confirmation will be required before the payment intent is finalized.");

  const total = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return sum + (product?.price ?? 0) * item.quantity;
    }, 0);

    return subtotal + (cartItems.length ? 5 : 0);
  }, [cartItems, products]);

  const methods: Array<{ id: PaymentMethod; label: string }> = [
    { id: "card", label: "Card ending in 4242" },
    { id: "applepay", label: "Apple Pay / Google Pay" },
    { id: "mpesa", label: "M-Pesa" },
    { id: "momo", label: "MTN MoMo" },
  ];

  const handlePay = () => {
    setMessage(`Payment flow prepared for ${paymentMethod.toUpperCase()}. Stripe and native-wallet confirmation are the next integration step.`);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.topAction, pressed && styles.pressed]}>
            <Text style={styles.topActionText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Checkout</Text>
          <View style={styles.topSpacer} />
        </View>

        <Card accent="gold">
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Pressable style={({ pressed }) => [styles.addressCard, pressed && styles.pressed]}>
            <View>
              <Text style={styles.addressName}>Amina Njeri</Text>
              <Text style={styles.addressText}>Westlands · Nairobi</Text>
              <Text style={styles.addressText}>+254 700 000 111</Text>
            </View>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </Card>

        <Card accent="gold">
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.methods}>
            {methods.map((method) => {
              const selected = paymentMethod === method.id;

              return (
                <Pressable
                  key={method.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={method.label}
                  onPress={() => setPaymentMethod(method.id)}
                  style={({ pressed }) => [styles.methodRow, selected && styles.methodRowSelected, pressed && styles.pressed]}
                >
                  <View style={[styles.radio, selected && styles.radioSelected]} />
                  <Text style={[styles.methodText, selected && styles.methodTextSelected]}>{method.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card accent="gold">
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <Text style={styles.summaryText}>
            {cartItems.length} items from {new Set(cartItems.map((item) => products.find((entry) => entry.id === item.productId)?.vendorName)).size || 1} vendors
          </Text>
          <Text style={styles.totalText}>Total: {formatPrice(total)}</Text>
        </Card>

        <Text style={styles.message}>{message}</Text>
      </ScrollView>

      <Pressable onPress={handlePay} style={({ pressed }) => [styles.stickyButton, pressed && styles.pressed]}>
        <Text style={styles.stickyButtonText}>Pay {formatPrice(total)} →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 120,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topAction: {
    minHeight: touch.minimum,
    justifyContent: "center",
  },
  topActionText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  topSpacer: {
    width: 56,
  },
  title: {
    color: colors.text,
    ...typography.displaySm,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.displaySm,
    marginBottom: spacing.sm,
  },
  addressCard: {
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  addressName: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  addressText: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  editText: {
    color: colors.gold,
    ...typography.labelLg,
  },
  methods: {
    gap: spacing.sm,
  },
  methodRow: {
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  methodRowSelected: {
    borderColor: colors.gold,
    backgroundColor: withAlpha("gold", 0.08),
  },
  radio: {
    width: spacing.md,
    height: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.textDim,
    backgroundColor: colors.surface2,
  },
  radioSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  methodText: {
    color: colors.text,
    ...typography.bodyMd,
  },
  methodTextSelected: {
    color: colors.gold,
  },
  summaryText: {
    color: colors.textDim,
    ...typography.bodyMd,
    marginBottom: spacing.sm,
  },
  totalText: {
    color: colors.gold,
    ...typography.displaySm,
  },
  message: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  stickyButton: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyButtonText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  pressed: {
    opacity: 0.78,
  },
});
