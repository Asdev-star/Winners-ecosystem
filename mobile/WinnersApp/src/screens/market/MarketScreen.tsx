import React, { useMemo, useState } from "react";
import {
  AccessibilityInfo,
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import { MarketStackParamList } from "../../navigation/types";
import { useMarketStore, type MarketProduct } from "../../stores/marketStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<MarketStackParamList, "Home">;

const CATEGORY_CHIPS = ["All", "Fashion", "Beauty", "Tech"];

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function MarketScreen({ navigation }: Props) {
  const products = useMarketStore((state) => state.products);
  const cartItems = useMarketStore((state) => state.cartItems);
  const wishlist = useMarketStore((state) => state.wishlist);
  const addToCart = useMarketStore((state) => state.addToCart);
  const toggleWishlist = useMarketStore((state) => state.toggleWishlist);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory = category === "All" || product.category === category;
        const matchesSearch = `${product.name} ${product.vendorName}`.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    [category, products, search],
  );

  const recommended = useMemo(() => products.slice(0, 3), [products]);

  const onAddToCart = (product: MarketProduct) => {
    addToCart(product.id);
    const nextCount = cartCount + 1;
    void AccessibilityInfo.announceForAccessibility(`Added, cart has ${nextCount} items`);
  };

  const header = (
    <View style={styles.headerStack}>
      <EcosystemContextBar accent="gold" label="ATLAS" context="3 trending products are climbing fast across mobile traffic and repeat-buyer signals." />

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          accessibilityLabel="Search products"
          accessibilityHint="Filters products by name or vendor."
          onChangeText={setSearch}
          placeholder="Search products..."
          placeholderTextColor={colors.textDim}
          style={styles.searchInput}
          value={search}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
        {CATEGORY_CHIPS.map((chip) => {
          const selected = chip === category;

          return (
            <Pressable
              key={chip}
              accessibilityRole="button"
              accessibilityLabel={`${chip} category`}
              onPress={() => setCategory(chip)}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{chip}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionLabel}>Recommended</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
        {recommended.map((product) => (
          <Card key={product.id} accent="gold" style={styles.recommendedCard}>
            <View style={styles.productImage}>
              <Text style={styles.imageText}>Image</Text>
            </View>
            <View style={styles.rowBetween}>
              <Badge label={`ATLAS ${product.atlasScore}`} variant="gold" />
              <Badge label={product.vendorType} variant="dim" />
            </View>
            <Text numberOfLines={2} style={styles.productName}>
              {product.name}
            </Text>
            <Text accessibilityLabel={formatPrice(product.price)} style={styles.price}>
              {formatPrice(product.price)}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${product.name}`}
              onPress={() => navigation.navigate("ProductDetail", { productId: product.id })}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>View product</Text>
            </Pressable>
          </Card>
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>All Products</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <Card accent="gold" style={styles.gridCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${formatPrice(item.price)}, ${item.rating} stars`}
              accessibilityHint="Opens the product detail screen."
              onLongPress={() => toggleWishlist(item.id)}
              onPress={() => navigation.navigate("ProductDetail", { productId: item.id })}
            >
              <View accessibilityLabel={item.images[0]} style={styles.gridImage}>
                <Text style={styles.imageText}>Image</Text>
              </View>
              <Text numberOfLines={2} style={styles.gridName}>
                {item.name}
              </Text>
              <Text accessibilityLabel={formatPrice(item.price)} style={styles.price}>
                {formatPrice(item.price)}
              </Text>
              <Text style={styles.meta}>
                ⭐ {item.rating} · {item.reviews} reviews
              </Text>
              <View style={styles.gridBadges}>
                <Badge label={item.vendorType} variant="dim" />
                {wishlist.includes(item.id) ? <Badge label="Saved" variant="purple" /> : null}
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add ${item.name} to cart`}
              accessibilityHint={`Adds ${item.name} to your cart.`}
              onLongPress={() => {
                void Share.share({
                  message: `${item.name} · ${formatPrice(item.price)} · ${item.vendorName}`,
                });
              }}
              onPress={() => onAddToCart(item)}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>Add Cart</Text>
            </Pressable>
          </Card>
        )}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open cart, ${cartCount} items`}
        accessibilityHint="Opens your shopping cart."
        onPress={() => navigation.navigate("Cart")}
        style={({ pressed }) => [styles.cartButton, pressed && styles.pressed]}
      >
        <Text style={styles.cartButtonText}>Cart ({cartCount})</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerStack: {
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
  },
  searchWrap: {
    minHeight: touch.minimum,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    ...typography.bodyMd,
  },
  horizontalRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  chip: {
    minHeight: touch.minimum,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    borderColor: colors.gold,
    backgroundColor: withAlpha("gold", 0.1),
  },
  chipText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  chipTextSelected: {
    color: colors.gold,
  },
  sectionLabel: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  recommendedCard: {
    width: 220,
  },
  productImage: {
    height: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  imageText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  productName: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  price: {
    color: colors.gold,
    ...typography.displaySm,
    marginBottom: spacing.xs,
  },
  meta: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  secondaryButton: {
    minHeight: touch.minimum,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.text,
    ...typography.labelLg,
  },
  gridRow: {
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  gridCard: {
    flex: 1,
  },
  gridImage: {
    height: 108,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  gridName: {
    color: colors.text,
    ...typography.bodySm,
    fontWeight: "700",
    marginBottom: spacing.xs,
    minHeight: 34,
  },
  gridBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    minHeight: touch.minimum,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  cartButton: {
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
  cartButtonText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  pressed: {
    opacity: 0.78,
  },
});
