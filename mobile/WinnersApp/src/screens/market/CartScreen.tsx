import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Card from "../../components/ui/Card";
import { MarketStackParamList } from "../../navigation/types";
import { useMarketStore } from "../../stores/marketStore";
import { colors, radius, spacing, touch, typography } from "../../theme/tokens";

type Props = NativeStackScreenProps<MarketStackParamList, "Cart">;

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function CartScreen({ navigation }: Props) {
  const products = useMarketStore((state) => state.products);
  const cartItems = useMarketStore((state) => state.cartItems);
  const removeFromCart = useMarketStore((state) => state.removeFromCart);
  const updateQuantity = useMarketStore((state) => state.updateQuantity);

  const lineItems = useMemo(
    () =>
      cartItems
        .map((item) => {
          const product = products.find((entry) => entry.id === item.productId);
          if (!product) return null;
          return { product, quantity: item.quantity };
        })
        .filter(Boolean) as Array<{ product: (typeof products)[number]; quantity: number }>,
    [cartItems, products],
  );

  const subtotal = lineItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const shipping = lineItems.length ? 5 : 0;
  const total = subtotal + shipping;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.topAction, pressed && styles.pressed]}>
            <Text style={styles.topActionText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Cart ({lineItems.length} items)</Text>
          <View style={styles.topSpacer} />
        </View>

        {lineItems.map(({ product, quantity }) => (
          <Card key={product.id} accent="gold">
            <View style={styles.itemRow}>
              <View style={styles.itemImage}>
                <Text style={styles.imageText}>Image</Text>
              </View>
              <View style={styles.itemCopy}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{product.name}</Text>
                  <Pressable onPress={() => removeFromCart(product.id)}>
                    <Text style={styles.removeText}>✕</Text>
                  </Pressable>
                </View>
                <Text style={styles.itemMeta}>Vendor: {product.vendorName}</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>{formatPrice(product.price)}</Text>
                  <View style={styles.quantityRow}>
                    <Pressable onPress={() => updateQuantity(product.id, quantity - 1)} style={styles.qtyButton}>
                      <Text style={styles.qtyText}>-</Text>
                    </Pressable>
                    <Text style={styles.qtyValue}>{quantity}</Text>
                    <Pressable onPress={() => updateQuantity(product.id, quantity + 1)} style={styles.qtyButton}>
                      <Text style={styles.qtyText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        ))}

        <Card accent="gold">
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>{formatPrice(shipping)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </Card>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Proceed to checkout"
        onPress={() => navigation.navigate("Checkout", { source: "cart", cartId: "mobile-cart" })}
        style={({ pressed }) => [styles.stickyButton, pressed && styles.pressed]}
      >
        <Text style={styles.stickyButtonText}>Proceed to Checkout →</Text>
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
  itemRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  imageText: {
    color: colors.textDim,
    ...typography.labelMd,
  },
  itemCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  itemName: {
    flex: 1,
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  removeText: {
    color: colors.red,
    ...typography.labelLg,
  },
  itemMeta: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  itemPrice: {
    color: colors.gold,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  qtyButton: {
    width: touch.minimum,
    height: touch.minimum,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    color: colors.text,
    ...typography.labelLg,
  },
  qtyValue: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  summaryTitle: {
    color: colors.text,
    ...typography.displaySm,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    color: colors.textDim,
    ...typography.bodyMd,
  },
  summaryValue: {
    color: colors.text,
    ...typography.bodyMd,
  },
  summaryTotal: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 0,
  },
  totalLabel: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  totalValue: {
    color: colors.gold,
    ...typography.displaySm,
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
