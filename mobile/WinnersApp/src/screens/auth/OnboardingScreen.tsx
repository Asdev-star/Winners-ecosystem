import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Card from "../../components/ui/Card";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { useAppShellStore } from "../../stores/appShellStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

type OnboardingAnswers = {
  building: string;
  role: string | null;
  experienceLevel: string | null;
  incomeTarget: string | null;
  primaryMarket: string[];
  topSkills: string[];
  structure: string | null;
};

type Question =
  | { key: "building"; title: string; type: "text"; placeholder: string }
  | { key: "role" | "experienceLevel" | "incomeTarget" | "structure"; title: string; type: "single"; options: string[] }
  | { key: "primaryMarket" | "topSkills"; title: string; type: "multi"; options: string[]; max?: number };

const QUESTIONS: Question[] = [
  { key: "building", title: "What are you building?", type: "text", placeholder: "Describe what you are building" },
  {
    key: "role",
    title: "Your role",
    type: "single",
    options: ["Founder", "Creator", "Freelancer", "Operator", "Educator", "Investor"],
  },
  {
    key: "experienceLevel",
    title: "What is your experience level?",
    type: "single",
    options: ["Beginner", "Intermediate", "Advanced", "Expert"],
  },
  {
    key: "incomeTarget",
    title: "What is your income target?",
    type: "single",
    options: ["Under $1k/mo", "$1k-$3k/mo", "$3k-$10k/mo", "$10k-$25k/mo", "$25k+/mo"],
  },
  {
    key: "primaryMarket",
    title: "Primary market",
    type: "multi",
    options: ["Kenya", "Nigeria", "Ghana", "South Africa", "UK Diaspora", "US Diaspora", "Canada Diaspora"],
  },
  {
    key: "topSkills",
    title: "Top skills",
    type: "multi",
    max: 5,
    options: ["Marketing", "Content", "Design", "Sales", "Community", "Product", "Development", "Operations", "Teaching", "Strategy"],
  },
  {
    key: "structure",
    title: "Solo / Team / Organisation",
    type: "single",
    options: ["Solo", "Team", "Organisation"],
  },
];

const INITIAL_ANSWERS: OnboardingAnswers = {
  building: "",
  role: null,
  experienceLevel: null,
  incomeTarget: null,
  primaryMarket: [],
  topSkills: [],
  structure: null,
};

export default function OnboardingScreen({ navigation }: Props) {
  const transition = useRef(new Animated.Value(1)).current;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(INITIAL_ANSWERS);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const user = useAuthStore((state) => state.user);
  const reducedMotion = useAppShellStore((state) => state.preferences.reducedMotion);

  const question = QUESTIONS[step];
  const progress = step + 1;

  useEffect(() => {
    if (reducedMotion) {
      transition.setValue(1);
      return;
    }

    transition.setValue(0);
    Animated.spring(transition, {
      toValue: 1,
      useNativeDriver: true,
      speed: 16,
      bounciness: 5,
    }).start();
  }, [reducedMotion, step, transition]);

  const isAnswered = useMemo(() => {
    switch (question.key) {
      case "building":
        return answers.building.trim().length > 0;
      case "primaryMarket":
        return answers.primaryMarket.length > 0;
      case "topSkills":
        return answers.topSkills.length > 0;
      case "role":
      case "experienceLevel":
      case "incomeTarget":
      case "structure":
        return Boolean(answers[question.key]);
      default:
        return false;
    }
  }, [answers, question]);

  const handleComplete = () => {
    completeOnboarding();

    if (!user) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  };

  const handleContinue = () => {
    if (!isAnswered) {
      return;
    }

    if (step === QUESTIONS.length - 1) {
      handleComplete();
      return;
    }

    setStep((current) => current + 1);
  };

  const handleSkip = () => {
    if (step === QUESTIONS.length - 1) {
      handleComplete();
      return;
    }

    setStep((current) => current + 1);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((current) => current - 1);
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    if (!user) {
      navigation.navigate("Login");
    }
  };

  const renderSingleOption = (option: string, index: number, total: number) => {
    const selected = answers[question.key as "role" | "experienceLevel" | "incomeTarget" | "structure"] === option;

    return (
      <Pressable
        key={option}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${option}, ${selected ? "selected" : "not selected"}, ${index + 1} of ${total}`}
        accessibilityHint="Double tap to choose this option."
        onPress={() =>
          setAnswers((current) => ({
            ...current,
            [question.key]: option,
          }))
        }
        style={({ pressed }) => [styles.optionButton, selected && styles.optionButtonSelected, pressed && styles.optionPressed]}
      >
        <View style={[styles.optionDot, selected && styles.optionDotSelected]} />
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{option}</Text>
      </Pressable>
    );
  };

  const renderMultiOption = (option: string) => {
    const selected = answers[question.key as "primaryMarket" | "topSkills"].includes(option);
    const maxSelections = question.type === "multi" ? question.max : undefined;
    const currentValues = answers[question.key as "primaryMarket" | "topSkills"];
    const atLimit = Boolean(maxSelections && !selected && currentValues.length >= maxSelections);

    return (
      <Pressable
        key={option}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected, disabled: atLimit }}
        accessibilityLabel={`${option}${selected ? ", selected" : ""}`}
        accessibilityHint={atLimit ? `Maximum of ${maxSelections} selections reached.` : "Double tap to toggle this option."}
        disabled={atLimit}
        onPress={() =>
          setAnswers((current) => {
            const values = current[question.key as "primaryMarket" | "topSkills"];
            const nextValues = values.includes(option)
              ? values.filter((value) => value !== option)
              : [...values, option].slice(0, maxSelections ?? undefined);

            return {
              ...current,
              [question.key]: nextValues,
            };
          })
        }
        style={({ pressed }) => [
          styles.tagButton,
          selected && styles.tagButtonSelected,
          atLimit && styles.tagButtonDisabled,
          pressed && !atLimit && styles.optionPressed,
        ]}
      >
        <Text style={[styles.tagLabel, selected && styles.tagLabelSelected]}>{option}</Text>
      </Pressable>
    );
  };

  const renderQuestionBody = () => {
    switch (question.type) {
      case "text":
        return (
          <TextInput
            accessibilityLabel={question.title}
            accessibilityHint="Enter your answer, then use Continue to move to the next question."
            multiline
            onChangeText={(value) =>
              setAnswers((current) => ({
                ...current,
                building: value,
              }))
            }
            placeholder={question.placeholder}
            placeholderTextColor={colors.textDim}
            style={styles.textarea}
            textAlignVertical="top"
            value={answers.building}
          />
        );
      case "single":
        return (
          <View style={styles.optionStack}>
            {question.options.map((option, index) => renderSingleOption(option, index, question.options.length))}
          </View>
        );
      case "multi":
        return <View style={styles.tagGrid}>{question.options.map(renderMultiOption)}</View>;
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={step > 0 ? "Back to previous question" : "Back"}
          accessibilityHint="Moves to the previous question when available."
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.textButtonPressed]}
        >
          <Text style={styles.backButtonText}>{step > 0 ? "Back" : "Exit"}</Text>
        </Pressable>
        <View style={styles.progressDots}>
          {QUESTIONS.map((entry, index) => (
            <View key={entry.key} style={[styles.progressDot, index < progress && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.progressLabel}>
          {progress} / {QUESTIONS.length}
        </Text>
      </View>

      <Animated.View
        style={[
          styles.animatedWrap,
          {
            opacity: transition,
            transform: [
              {
                translateX: transition.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Card accent="gold">
          <View style={styles.questionStack}>
            <Text style={styles.kicker}>OMEGA ONBOARDING</Text>
            <Text style={styles.questionTitle}>
              Q{progress}: {question.title}
            </Text>
            {question.key === "topSkills" ? (
              <Text style={styles.helperText}>Select up to 5 skills.</Text>
            ) : null}
            {renderQuestionBody()}
          </View>
        </Card>
      </Animated.View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={step === QUESTIONS.length - 1 ? "Finish onboarding" : "Continue"}
        accessibilityHint="Moves to the next onboarding question when this answer is complete."
        accessibilityState={{ disabled: !isAnswered }}
        disabled={!isAnswered}
        onPress={handleContinue}
        style={({ pressed }) => [
          styles.primaryButton,
          !isAnswered && styles.primaryDisabled,
          pressed && isAnswered && styles.primaryPressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>{step === QUESTIONS.length - 1 ? "Finish" : "Continue →"}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip for now"
        accessibilityHint="Moves to the next onboarding question without answering this one."
        onPress={handleSkip}
        style={({ pressed }) => [styles.skipButton, pressed && styles.textButtonPressed]}
      >
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  backButton: {
    minHeight: touch.minimum,
    justifyContent: "center",
  },
  backButtonText: {
    ...typography.labelLg,
    color: colors.textDim,
  },
  progressDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
    justifyContent: "center",
  },
  progressDot: {
    width: spacing.sm + spacing.xs,
    height: spacing.sm + spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  progressLabel: {
    ...typography.labelMd,
    color: colors.textDim,
  },
  animatedWrap: {
    marginBottom: spacing.lg,
  },
  questionStack: {
    gap: spacing.sm,
  },
  kicker: {
    ...typography.labelLg,
    color: colors.gold,
  },
  questionTitle: {
    ...typography.displayMd,
    color: colors.text,
  },
  helperText: {
    ...typography.bodySm,
    color: colors.textDim,
  },
  textarea: {
    minHeight: 132,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    ...typography.bodyMd,
  },
  optionStack: {
    gap: spacing.sm,
  },
  optionButton: {
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
  optionButtonSelected: {
    borderColor: colors.gold,
    backgroundColor: withAlpha("gold", 0.08),
  },
  optionDot: {
    width: spacing.sm + spacing.xs,
    height: spacing.sm + spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.textDim,
    backgroundColor: colors.surface2,
  },
  optionDotSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  optionLabel: {
    ...typography.bodyMd,
    color: colors.text,
    flex: 1,
  },
  optionLabelSelected: {
    color: colors.gold,
    fontWeight: "700",
  },
  optionPressed: {
    opacity: 0.86,
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tagButton: {
    minHeight: touch.minimum,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tagButtonSelected: {
    borderColor: colors.gold,
    backgroundColor: withAlpha("gold", 0.1),
  },
  tagButtonDisabled: {
    opacity: 0.35,
  },
  tagLabel: {
    ...typography.labelLg,
    color: colors.textDim,
  },
  tagLabelSelected: {
    color: colors.gold,
  },
  primaryButton: {
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: {
    ...typography.labelLg,
    color: colors.bg,
  },
  primaryDisabled: {
    opacity: 0.38,
  },
  primaryPressed: {
    opacity: 0.88,
  },
  skipButton: {
    minHeight: touch.minimum,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  skipButtonText: {
    ...typography.bodyMd,
    color: colors.textDim,
  },
  textButtonPressed: {
    opacity: 0.76,
  },
});
