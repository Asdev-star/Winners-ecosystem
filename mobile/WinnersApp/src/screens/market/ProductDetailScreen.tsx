import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { MarketStackParamList } from "../../navigation/types";
import { useMarketStore } from "../../stores/marketStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<MarketStackParamList, "ProductDetail">;

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function ProductDetailScreen({ navigation, route }: Props) {
  const products = useMarketStore((state) => state.products);
  const wishlist = useMarketStore((state) => state.wishlist);
  const addToCart = useMarketStore((state) => state.addToCart);
  const toggleWishlist = useMarketStore((state) => state.toggleWishlist);
  const [imageIndex, setImageIndex] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const product = useMemo(
    () => products.find((entry) => entry.id === route.params.productId) ?? products[0],
    [products, route.params.productId],
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.topAction, pressed && styles.pressed]}>
            <Text style={styles.topActionText}>← Back</Text>
          </Pressable>
          <View style={styles.topRight}>
            <Pressable onPress={() => toggleWishlist(product.id)} style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}>
              <Text style={styles.topActionText}>{wishlist.includes(product.id) ? "♥" : "♡"}</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                void Share.share({
                  message: `${product.name} · ${formatPrice(product.price)} · ${product.vendorName}`,
                })
              }
              style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
            >
              <Text style={styles.topActionText}>↗ Share</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.carousel}>
          <View accessibilityLabel={product.images[imageIndex]} style={styles.carouselImage}>
            <Text style={styles.imageText}>Image {imageIndex + 1}</Text>
          </View>
          <View style={styles.dots}>
            {product.images.map((_, index) => (
              <Pressable
                key={`${product.id}-${index}`}
                onPress={() => setImageIndex(index)}
                style={[styles.dot, index === imageIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        <Badge label={product.vendorType} variant="dim" />
        <Text style={styles.title}>{product.name}</Text>
        <Text accessibilityLabel={formatPrice(product.price)} style={styles.price}>
          {formatPrice(product.price)}
        </Text>
        <Text style={styles.rating}>
          ⭐ {product.rating} ({product.reviews} reviews)
        </Text>

        <Card accent="gold">
          <Text style={styles.description}>
            {expanded ? product.description : `${product.description.slice(0, 110)}${product.description.length > 110 ? "..." : ""}`}
          </Text>
          <Pressable onPress={() => setExpanded((current) => !current)} style={({ pressed }) => [styles.inlineAction, pressed && styles.pressed]}>
            <Text style={styles.inlineActionText}>{expanded ? "Show less" : "Show more"}</Text>
          </Pressable>
        </Card>

        <Card accent="gold">
          <View style={styles.vendorRow}>
            <View>
              <Text style={styles.vendorLabel}>Vendor</Text>
              <Text style={styles.vendorName}>{product.vendorName}</Text>
            </View>
            <Badge label={product.vendorTrust} variant="green" />
          </View>
        </Card>

        <Text style={styles.sectionLabel}>Reviews</Text>
        <Card accent="gold">
          <Text style={styles.reviewTitle}>“Worth the price for launch speed.”</Text>
          <Text style={styles.reviewBody}>ATLAS recommended this for fast-moving operators, and it shortened our setup cycle by a week.</Text>
        </Card>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${product.name} to cart`}
        onPress={() => addToCart(product.id)}
        style={({ pressed }) => [styles.stickyButton, pressed && styles.pressed]}
      >
        <Text style={styles.stickyButtonText}>Add to Cart →</Text>
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  topRight: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  topAction: {
    minHeight: touch.minimum,
    justifyContent: "center",
  },
  iconAction: {
    minHeight: touch.minimum,
    justifyContent: "center",
  },
  topActionText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  carousel: {
    gap: spacing.sm,
  },
  carouselImage: {
    height: 260,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  imageText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  dots: {
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
  },
  dot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface3,
  },
  dotActive: {
    backgroundColor: colors.gold,
  },
  title: {
    color: colors.text,
    ...typography.displaySm,
  },
  price: {
    color: colors.gold,
    fontSize: 28,
    fontWeight: "700",
  },
  rating: {
    color: colors.textDim,
    ...typography.bodyMd,
  },
  description: {
    color: colors.text,
    ...typography.bodyMd,
  },
  inlineAction: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
  },
  inlineActionText: {
    color: colors.gold,
    ...typography.labelLg,
  },
  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  vendorLabel: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  vendorName: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  sectionLabel: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  reviewTitle: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  reviewBody: {
    color: colors.textDim,
    ...typography.bodyMd,
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
