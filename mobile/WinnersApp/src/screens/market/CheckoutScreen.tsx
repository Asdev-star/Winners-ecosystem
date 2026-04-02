import React, { useMemo, useState } from "react";
import { useStripe } from "@stripe/stripe-react-native";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Card from "../../components/ui/Card";
import { MarketStackParamList } from "../../navigation/types";
import {
  useMarketStore,
  type MarketCartItem,
  type MarketProduct,
} from "../../stores/marketStore";
import { api } from "../../services/api";
import {
  colors,
  radius,
  spacing,
  touch,
  typography,
  withAlpha,
} from "../../theme/tokens";

type Props = NativeStackScreenProps<MarketStackParamList, "Checkout">;
type PaymentMethod = "applepay" | "googlepay" | "mpesa" | "momo" | "card";
type ShippingAddress = {
  fullName: string;
  addressLine: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
};
type CheckoutVendorGroup = {
  vendorId: string;
  vendorName: string;
  items: Array<{
    cartItemId: string;
    productId: string;
    title: string;
    price: number;
    quantity: number;
    isDigital: boolean;
  }>;
  subtotal: number;
};
type PaymentIntentResponse = {
  paymentIntents: Array<{
    vendorId: string;
    vendorName: string;
    clientSecret: string;
    amount: number;
  }>;
  total: number;
  platformFeePct: number;
};
type ConfirmCheckoutResponse = {
  success: boolean;
  orders: Array<{ id: string; orderNumber: string }>;
};

const DEFAULT_SHIPPING_ADDRESS: ShippingAddress = {
  fullName: "Amina Njeri",
  addressLine: "Westlands",
  city: "Nairobi",
  region: "Nairobi County",
  postalCode: "00100",
  country: "Kenya",
  phone: "+254 700 000 111",
};

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

function getCartProduct(item: MarketCartItem, products: MarketProduct[]) {
  return item.product ?? products.find((entry) => entry.id === item.productId);
}

function buildVendorGroups(
  cartItems: MarketCartItem[],
  products: MarketProduct[],
): CheckoutVendorGroup[] {
  const groups = new Map<string, CheckoutVendorGroup>();

  for (const item of cartItems) {
    const product = getCartProduct(item, products);
    if (!product?.vendorId) {
      continue;
    }

    const current = groups.get(product.vendorId) ?? {
      vendorId: product.vendorId,
      vendorName: product.vendorName,
      items: [],
      subtotal: 0,
    };

    current.items.push({
      cartItemId: item.id,
      productId: item.productId,
      title: product.name,
      price: product.price,
      quantity: item.quantity,
      isDigital: product.isDigital,
    });
    current.subtotal += product.price * item.quantity;

    groups.set(product.vendorId, current);
  }

  return Array.from(groups.values());
}

export default function CheckoutScreen({ navigation }: Props) {
  const products = useMarketStore((state) => state.products);
  const cartItems = useMarketStore((state) => state.cartItems);
  const clearCart = useMarketStore((state) => state.clearCart);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("applepay");
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(
    DEFAULT_SHIPPING_ADDRESS,
  );
  const [draftAddress, setDraftAddress] = useState<ShippingAddress>(
    DEFAULT_SHIPPING_ADDRESS,
  );
  const [message, setMessage] = useState(
    "Biometric confirmation will be required before the payment intent is finalized.",
  );

  const vendorGroups = useMemo(
    () => buildVendorGroups(cartItems, products),
    [cartItems, products],
  );
  const unresolvedItems = useMemo(
    () =>
      cartItems.filter((item) => {
        const product = getCartProduct(item, products);
        return !product?.vendorId;
      }),
    [cartItems, products],
  );
  const vendorCount = vendorGroups.length;
  const itemCount = useMemo(
    () =>
      vendorGroups.reduce(
        (sum, group) =>
          sum + group.items.reduce((count, item) => count + item.quantity, 0),
        0,
      ),
    [vendorGroups],
  );
  const subtotal = useMemo(
    () => vendorGroups.reduce((sum, group) => sum + group.subtotal, 0),
    [vendorGroups],
  );
  const serviceFee = vendorCount ? vendorCount * 2.5 : 0;
  const total = subtotal + serviceFee;
  const isShippingAddressComplete = useMemo(
    () =>
      Object.values(shippingAddress).every((value) => value.trim().length > 0),
    [shippingAddress],
  );

  const methods: Array<{ id: PaymentMethod; label: string }> = [
    { id: "card", label: "Card ending in 4242" },
    { id: "applepay", label: "Apple Pay / Google Pay" },
    { id: "mpesa", label: "M-Pesa" },
    { id: "momo", label: "MTN MoMo" },
  ];

  const updateDraftAddress = (
    field: keyof ShippingAddress,
    value: string,
  ) => {
    setDraftAddress((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleAddressSave = () => {
    const trimmedAddress = Object.fromEntries(
      Object.entries(draftAddress).map(([key, value]) => [key, value.trim()]),
    ) as ShippingAddress;

    if (Object.values(trimmedAddress).some((value) => value.length === 0)) {
      setMessage("Complete every delivery field before saving the address.");
      return;
    }

    setShippingAddress(trimmedAddress);
    setDraftAddress(trimmedAddress);
    setIsEditingAddress(false);
    setMessage("Delivery address saved for this checkout.");
  };

  const handleAddressCancel = () => {
    setDraftAddress(shippingAddress);
    setIsEditingAddress(false);
    setMessage("Delivery address changes were discarded.");
  };

  const handlePay = async () => {
    if (unresolvedItems.length > 0) {
      const names = unresolvedItems
        .map((item) => getCartProduct(item, products)?.name ?? item.productId)
        .join(", ");
      setMessage(`${unresolvedItems.length} item(s) missing vendor: ${names}. Remove them to continue.`);
      return;
    }

    if (!vendorGroups.length) {
      setMessage("Your cart is empty or missing vendor routing data.");
      return;
    }

    if (!isShippingAddressComplete) {
      setMessage("Add a complete delivery address before starting payment.");
      return;
    }

    if (isEditingAddress) {
      setMessage("Save or cancel the address form before starting payment.");
      return;
    }

    setIsProcessing(true);

    try {
      setMessage(
        `Preparing ${vendorCount} vendor payment ${vendorCount === 1 ? "intent" : "intents"}...`,
      );

      const paymentSetup = await api.post<PaymentIntentResponse>(
        "/checkout/create-payment-intents",
        {
          items: vendorGroups.flatMap((group) =>
            group.items.map((item) => ({
              productId: item.productId,
              vendorId: group.vendorId,
              vendorName: group.vendorName,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              type: item.isDigital ? "digital" : "physical",
            })),
          ),
          paymentMethod,
          shippingAddress,
        },
      );

      const paymentIntentIds: string[] = [];

      for (
        let intentIndex = 0;
        intentIndex < paymentSetup.paymentIntents.length;
        intentIndex += 1
      ) {
        const intent = paymentSetup.paymentIntents[intentIndex];
        setMessage(
          `Confirming payment ${intentIndex + 1} of ${paymentSetup.paymentIntents.length} for ${intent.vendorName}...`,
        );

        const initResult = await initPaymentSheet({
          merchantDisplayName: `Winners Market - ${intent.vendorName}`,
          paymentIntentClientSecret: intent.clientSecret,
        });

        if (initResult.error) {
          setMessage(initResult.error.message ?? "Failed to initialize payment.");
          return;
        }

        const paymentResult = await presentPaymentSheet();
        if (paymentResult.error) {
          setMessage(
            paymentResult.error.message ?? "Payment confirmation was cancelled.",
          );
          return;
        }

        paymentIntentIds.push(intent.clientSecret.split("_secret_")[0]);
      }

      const confirmation = await api.post<ConfirmCheckoutResponse>(
        "/checkout/confirm",
        {
          paymentIntentIds,
          shippingAddress,
          vendorGroups: vendorGroups.map((group) => ({
            vendorId: group.vendorId,
            items: group.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          })),
        },
      );

      await clearCart();
      setMessage(
        `Orders confirmed: ${confirmation.orders.map((order) => order.orderNumber).join(", ")}`,
      );
    } catch (error) {
      console.error("[CheckoutScreen] Checkout failed:", error);
      setMessage("Failed to complete checkout. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.topAction,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.topActionText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Checkout</Text>
          <View style={styles.topSpacer} />
        </View>

        <Card accent="gold">
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {isEditingAddress ? (
            <View style={styles.addressForm}>
              <TextInput
                onChangeText={(value) => updateDraftAddress("fullName", value)}
                placeholder="Full name"
                placeholderTextColor={colors.textDim}
                style={styles.input}
                value={draftAddress.fullName}
              />
              <TextInput
                onChangeText={(value) =>
                  updateDraftAddress("addressLine", value)
                }
                placeholder="Street or estate"
                placeholderTextColor={colors.textDim}
                style={styles.input}
                value={draftAddress.addressLine}
              />
              <View style={styles.inputRow}>
                <TextInput
                  onChangeText={(value) => updateDraftAddress("city", value)}
                  placeholder="City"
                  placeholderTextColor={colors.textDim}
                  style={[styles.input, styles.inputHalf]}
                  value={draftAddress.city}
                />
                <TextInput
                  onChangeText={(value) => updateDraftAddress("region", value)}
                  placeholder="State / Region"
                  placeholderTextColor={colors.textDim}
                  style={[styles.input, styles.inputHalf]}
                  value={draftAddress.region}
                />
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  onChangeText={(value) =>
                    updateDraftAddress("postalCode", value)
                  }
                  placeholder="Postal code"
                  placeholderTextColor={colors.textDim}
                  style={[styles.input, styles.inputHalf]}
                  value={draftAddress.postalCode}
                />
                <TextInput
                  onChangeText={(value) => updateDraftAddress("country", value)}
                  placeholder="Country"
                  placeholderTextColor={colors.textDim}
                  style={[styles.input, styles.inputHalf]}
                  value={draftAddress.country}
                />
              </View>
              <TextInput
                keyboardType="phone-pad"
                onChangeText={(value) => updateDraftAddress("phone", value)}
                placeholder="Phone"
                placeholderTextColor={colors.textDim}
                style={styles.input}
                value={draftAddress.phone}
              />
              <View style={styles.addressActions}>
                <Pressable
                  onPress={handleAddressCancel}
                  style={({ pressed }) => [
                    styles.secondaryAddressButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.secondaryAddressButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddressSave}
                  style={({ pressed }) => [
                    styles.primaryAddressButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.primaryAddressButtonText}>Save address</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setIsEditingAddress(true)}
              style={({ pressed }) => [
                styles.addressCard,
                pressed && styles.pressed,
              ]}
            >
              <View>
                <Text style={styles.addressName}>{shippingAddress.fullName}</Text>
                <Text style={styles.addressText}>
                  {shippingAddress.addressLine}
                </Text>
                <Text style={styles.addressText}>
                  {`${shippingAddress.city}, ${shippingAddress.region}`}
                </Text>
                <Text style={styles.addressText}>
                  {`${shippingAddress.country} ${shippingAddress.postalCode}`}
                </Text>
                <Text style={styles.addressText}>{shippingAddress.phone}</Text>
              </View>
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          )}
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
                  style={({ pressed }) => [
                    styles.methodRow,
                    selected && styles.methodRowSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[styles.radio, selected && styles.radioSelected]}
                  />
                  <Text
                    style={[
                      styles.methodText,
                      selected && styles.methodTextSelected,
                    ]}
                  >
                    {method.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card accent="gold">
          <Text style={styles.sectionTitle}>Vendor Split</Text>
          <Text style={styles.summaryText}>
            {itemCount} item(s) across {vendorCount || 0} vendor
            {vendorCount === 1 ? "" : "s"}
          </Text>
          {unresolvedItems.length > 0 && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>
                ⚠ {unresolvedItems.length} item(s) missing vendor assignment. Remove them to continue checkout.
              </Text>
            </View>
          )}
          {vendorGroups.map((group) => (
            <View key={group.vendorId} style={styles.vendorSummaryRow}>
              <View style={styles.vendorSummaryCopy}>
                <Text style={styles.vendorSummaryTitle}>{group.vendorName}</Text>
                <Text style={styles.summaryText}>
                  {group.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                </Text>
              </View>
              <Text style={styles.vendorSummaryAmount}>
                {formatPrice(group.subtotal)}
              </Text>
            </View>
          ))}
        </Card>

        <Card accent="gold">
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.vendorSummaryRow}>
            <Text style={styles.summaryText}>Subtotal</Text>
            <Text style={styles.summaryText}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.vendorSummaryRow}>
            <Text style={styles.summaryText}>Service fee</Text>
            <Text style={styles.summaryText}>{formatPrice(serviceFee)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <Text style={styles.totalText}>Total: {formatPrice(total)}</Text>
        </Card>

        <Text style={styles.message}>{message}</Text>
      </ScrollView>

      <Pressable
        disabled={isProcessing}
        onPress={handlePay}
        style={({ pressed }) => [
          styles.stickyButton,
          isProcessing && styles.stickyButtonDisabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.stickyButtonText}>
          {isProcessing ? "Processing..." : `Pay ${formatPrice(total)}`}
        </Text>
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
  addressForm: {
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
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  input: {
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    color: colors.text,
    ...typography.bodyMd,
  },
  inputHalf: {
    flex: 1,
  },
  addressActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  secondaryAddressButton: {
    flex: 1,
    minHeight: touch.minimum,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryAddressButtonText: {
    color: colors.text,
    ...typography.labelLg,
  },
  primaryAddressButton: {
    flex: 1,
    minHeight: touch.minimum,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryAddressButtonText: {
    color: colors.bg,
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
  },
  vendorSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  vendorSummaryCopy: {
    flex: 1,
  },
  vendorSummaryTitle: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  vendorSummaryAmount: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
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
  warningBanner: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(240, 180, 41, 0.4)",
    backgroundColor: withAlpha("gold", 0.08),
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  warningText: {
    color: colors.gold,
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
  stickyButtonDisabled: {
    backgroundColor: withAlpha("gold", 0.55),
  },
  stickyButtonText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  pressed: {
    opacity: 0.78,
  },
});
