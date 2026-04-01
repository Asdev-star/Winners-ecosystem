import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { MarketStackParamList } from "../../navigation/types";
import { api } from "../../services/api";
import {
  colors,
  radius,
  spacing,
  touch,
  typography,
  withAlpha,
} from "../../theme/tokens";

type Props = NativeStackScreenProps<MarketStackParamList, "Wallet">;

type WalletBalance = {
  balance: number;
  available: number;
  pending: number;
  totalEarned: number;
  totalSpent: number;
  currency: string;
};

type Transaction = {
  id: string;
  type: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: string;
  description: string;
  createdAt: string;
};

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function WalletScreen({ navigation }: Props) {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        api.get<WalletBalance>("/finance/balance"),
        api.get<{ transactions: Transaction[] }>(
          "/finance/transactions?limit=20",
        ),
      ]);
      setBalance(balanceRes);
      setTransactions(transactionsRes.transactions);
    } catch (err) {
      console.error("[WalletScreen] Failed to fetch wallet data:", err);
      setError("Failed to load wallet data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return "⬇️";
      case "withdrawal":
        return "⬆️";
      case "transfer":
        return "↔️";
      case "earned":
        return "💰";
      case "spent":
        return "🛒";
      default:
        return "📄";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return colors.green;
      case "pending":
        return colors.gold;
      case "failed":
        return colors.red;
      default:
        return colors.textDim;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          onPress={fetchWalletData}
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

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
            <Text style={styles.topActionText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Wallet</Text>
          <View style={styles.topSpacer} />
        </View>

        {/* Balance Cards */}
        <View style={styles.balanceGrid}>
          <Card accent="gold" style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>
              {formatPrice(balance?.available ?? 0)}
            </Text>
            <Badge label={balance?.currency ?? "USD"} variant="dim" />
          </Card>

          <Card accent="gold" style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Pending</Text>
            <Text style={styles.balanceValue}>
              {formatPrice(balance?.pending ?? 0)}
            </Text>
            <Badge label="Clearing" variant="gold" />
          </Card>

          <Card accent="gold" style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Earned</Text>
            <Text style={styles.balanceValue}>
              {formatPrice(balance?.totalEarned ?? 0)}
            </Text>
            <Badge label="Lifetime" variant="green" />
          </Card>

          <Card accent="gold" style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Spent</Text>
            <Text style={styles.balanceValue}>
              {formatPrice(balance?.totalSpent ?? 0)}
            </Text>
            <Badge label="Lifetime" variant="dim" />
          </Card>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionIcon}>⬆️</Text>
            <Text style={styles.actionText}>Send</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionIcon}>⬇️</Text>
            <Text style={styles.actionText}>Receive</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionIcon}>💳</Text>
            <Text style={styles.actionText}>Deposit</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.actionIcon}>🏦</Text>
            <Text style={styles.actionText}>Withdraw</Text>
          </Pressable>
        </View>

        {/* Transaction History */}
        <Text style={styles.sectionLabel}>Recent Transactions</Text>
        {transactions.length === 0 ? (
          <Card accent="gold">
            <Text style={styles.emptyText}>No transactions yet</Text>
          </Card>
        ) : (
          transactions.map((tx) => (
            <Card key={tx.id} accent="gold" style={styles.transactionCard}>
              <View style={styles.transactionRow}>
                <View style={styles.transactionIcon}>
                  <Text style={styles.iconText}>
                    {getTransactionIcon(tx.type)}
                  </Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>
                    {tx.description}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(tx.createdAt)}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text
                    style={[
                      styles.amountText,
                      tx.amount >= 0
                        ? styles.positiveAmount
                        : styles.negativeAmount,
                    ]}
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    {formatPrice(Math.abs(tx.amount))}
                  </Text>
                  <Badge
                    label={tx.status}
                    variant={
                      tx.status === "completed"
                        ? "green"
                        : tx.status === "pending"
                          ? "gold"
                          : "dim"
                    }
                  />
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
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
  balanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  balanceCard: {
    flex: 1,
    minWidth: "45%",
  },
  balanceLabel: {
    color: colors.textDim,
    ...typography.labelSm,
    marginBottom: spacing.xs,
  },
  balanceValue: {
    color: colors.gold,
    ...typography.displayMd,
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    color: colors.textDim,
    ...typography.labelLg,
    marginTop: spacing.sm,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    color: colors.text,
    ...typography.labelMd,
  },
  transactionCard: {
    marginBottom: spacing.xs,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 18,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "600",
  },
  transactionDate: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    ...typography.bodyMd,
    fontWeight: "700",
  },
  positiveAmount: {
    color: colors.green,
  },
  negativeAmount: {
    color: colors.red,
  },
  emptyText: {
    color: colors.textDim,
    ...typography.bodyMd,
    textAlign: "center",
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg,
  },
  loadingText: {
    color: colors.textDim,
    ...typography.bodyMd,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg,
    padding: spacing.xl,
  },
  errorText: {
    color: colors.red,
    ...typography.bodyMd,
    textAlign: "center",
  },
  retryButton: {
    minHeight: touch.minimum,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  pressed: {
    opacity: 0.78,
  },
});
