import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import { WorkStackParamList } from "../../navigation/types";
import { useWorkStore } from "../../stores/workStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<WorkStackParamList, "Home">;
type WorkTab = "Discover" | "Hire" | "Services" | "Profile";
type Filter = "Remote" | "Product" | "Community" | "AI";

const FILTERS: Filter[] = ["Remote", "Product", "Community", "AI"];

export default function JobsScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<WorkTab>("Discover");
  const [activeFilter, setActiveFilter] = useState<Filter>("Remote");
  const jobs = useWorkStore((state) => state.jobs);
  const contracts = useWorkStore((state) => state.contracts);
  const freelancers = useWorkStore((state) => state.freelancers);
  const services = useWorkStore((state) => state.services);
  const intelligenceTools = useWorkStore((state) => state.intelligenceTools);
  const platformIntegrations = useWorkStore((state) => state.platformIntegrations);
  const currentFreelancerId = useWorkStore((state) => state.currentFreelancerId);
  const freelancer = freelancers.find((entry) => entry.id === currentFreelancerId);

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        if (activeFilter === "Remote") {
          return job.mode === "Remote";
        }

        if (activeFilter === "Product") {
          return job.tags.some((tag) => ["React", "Mobile", "Analytics", "Operations"].includes(tag));
        }

        if (activeFilter === "Community") {
          return job.tags.some((tag) => ["Community", "Strategy", "Design"].includes(tag));
        }

        return job.tags.some((tag) => ["AI Systems", "Operations"].includes(tag));
      }),
    [activeFilter, jobs],
  );

  const hiringPlatforms = platformIntegrations.filter((entry) => entry.category === "Hire talent" || entry.category === "Find jobs");
  const servicePlatforms = platformIntegrations.filter(
    (entry) => entry.category === "Offer services" || entry.category === "Get services",
  );
  const featuredFreelancers = freelancers.slice(0, 2);
  const recommendedServices = services.slice(0, 3);
  const openApplications = jobs.filter((job) => !job.applied).length;

  return (
    <View style={styles.screen}>
      <EcosystemContextBar
        accent="blue"
        label="CIRCUIT"
        context="Work now helps you discover jobs, hire talent, package services, and compare major platforms from one operating layer."
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card accent="blue">
          <Text style={styles.eyebrow}>Work Layer</Text>
          <Text style={styles.heroTitle}>Find jobs, hire experts, and turn services into repeatable offers.</Text>
          <Text style={styles.heroBody}>
            CIRCUIT recommends the next highest-leverage move based on fit, trust, delivery speed, and where the work is easiest to win.
          </Text>

          <View style={styles.statGrid}>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{String(filteredJobs.length)}</Text>
              <Text style={styles.statLabel}>ranked roles</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{String(featuredFreelancers.length)}</Text>
              <Text style={styles.statLabel}>hire-ready experts</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{String(servicePlatforms.length)}</Text>
              <Text style={styles.statLabel}>platform workflows</Text>
            </View>
          </View>
        </Card>

        <View style={styles.tabRow}>
          {(["Discover", "Hire", "Services", "Profile"] as WorkTab[]).map((tab) => {
            const selected = tab === activeTab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={({ pressed }) => [styles.tabButton, selected && styles.tabButtonSelected, pressed && styles.pressed]}
              >
                <Text style={[styles.tabButtonText, selected && styles.tabButtonTextSelected]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>

        <Card accent="ice">
          <Text style={styles.sectionTitle}>Smart tools</Text>
          <Text style={styles.sectionBody}>Recommended intelligence features to help users apply faster, hire better, and reduce marketplace risk.</Text>

          <View style={styles.stack}>
            {intelligenceTools.map((tool) => (
              <View key={tool.id} style={styles.toolCard}>
                <View style={styles.toolHeader}>
                  <Badge label={tool.name} variant="ice" />
                  <Badge label={tool.impactLabel} variant="dim" />
                </View>
                <Text style={styles.toolHeadline}>{tool.headline}</Text>
                <Text style={styles.toolBody}>{tool.summary}</Text>
                <Text style={styles.inlineHint}>{tool.actionLabel}</Text>
              </View>
            ))}
          </View>
        </Card>

        {activeTab === "Discover" ? (
          <>
            <Card accent="blue">
              <Text style={styles.sectionTitle}>Find work</Text>
              <Text style={styles.sectionBody}>
                Search roles with fit scoring, then route the best opportunities into your proposal workflow.
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {FILTERS.map((filter) => {
                  const selected = filter === activeFilter;
                  return (
                    <Pressable
                      key={filter}
                      onPress={() => setActiveFilter(filter)}
                      style={({ pressed }) => [styles.filterChip, selected && styles.filterChipSelected, pressed && styles.pressed]}
                    >
                      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{filter}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.stack}>
                {filteredJobs.map((job) => (
                  <View key={job.id} style={styles.jobCard}>
                    <View style={styles.jobTop}>
                      <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>{job.company.slice(0, 1)}</Text>
                      </View>

                      <View style={styles.jobCopy}>
                        <Text style={styles.jobTitle}>{job.title}</Text>
                        <Text style={styles.companyText}>{job.company}</Text>
                        <Text style={styles.jobMeta}>{`${job.compensation} | ${job.mode} | ${job.location}`}</Text>
                        <Text style={styles.jobMeta}>{`Posted ${job.postedLabel} | ${job.applicants} applicants`}</Text>
                        <View style={styles.tagRow}>
                          <Badge label={`${job.circuitFitScore} Match`} variant="blue" />
                          {job.applied ? <Badge label="Applied" variant="green" /> : null}
                          {job.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} label={tag} variant="dim" />
                          ))}
                        </View>
                      </View>
                    </View>

                    <Text style={styles.toolBody}>{job.summary}</Text>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${job.title}`}
                      accessibilityHint="Opens the full job brief and application actions."
                      onPress={() => navigation.navigate("JobDetail", { jobId: job.id })}
                      style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                    >
                      <Text style={styles.primaryButtonText}>View opportunity</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </Card>

            <Card accent="green">
              <Text style={styles.sectionTitle}>Active contracts</Text>
              <Text style={styles.sectionBody}>
                Keep execution visible while you continue sourcing new work. {openApplications} roles still match your current window.
              </Text>

              <View style={styles.stack}>
                {contracts.map((contract) => (
                  <Pressable
                    key={contract.id}
                    onPress={() => navigation.navigate("ContractDetail", { contractId: contract.id })}
                    style={({ pressed }) => [styles.contractCard, pressed && styles.pressed]}
                  >
                    <View style={styles.toolHeader}>
                      <Badge label={contract.statusLabel} variant={contract.statusLabel === "In Progress" ? "green" : "gold"} />
                      <Badge label={contract.userRole === "client" ? "Hiring mode" : "Delivery mode"} variant="dim" />
                    </View>
                    <Text style={styles.contractTitle}>{contract.projectName}</Text>
                    <Text style={styles.jobMeta}>{contract.client}</Text>
                    <Text style={styles.toolBody}>{`${contract.escrowAmount} in escrow | ${contract.messageThreadLabel}`}</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          </>
        ) : null}

        {activeTab === "Hire" ? (
          <>
            <Card accent="gold">
              <Text style={styles.sectionTitle}>Hire talent</Text>
              <Text style={styles.sectionBody}>
                Turn a rough need into a hiring brief, shortlist trusted specialists, and choose where to recruit based on speed and quality.
              </Text>

              <View style={styles.stack}>
                {featuredFreelancers.map((entry) => (
                  <View key={entry.id} style={styles.jobCard}>
                    <View style={styles.toolHeader}>
                      <Badge label={`Trust ${entry.trustScore}`} variant="blue" />
                      <Badge label={entry.availability} variant="gold" />
                    </View>
                    <Text style={styles.jobTitle}>{entry.name}</Text>
                    <Text style={styles.companyText}>{entry.title}</Text>
                    <Text style={styles.jobMeta}>{`${entry.hourlyRate} | ${entry.responseTime}`}</Text>
                    <Text style={styles.toolBody}>{entry.bio}</Text>
                    <View style={styles.tagRow}>
                      {entry.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} label={skill} variant="dim" />
                      ))}
                    </View>
                    <Pressable
                      onPress={() => navigation.navigate("FreelancerProfile", { userId: entry.id })}
                      style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                    >
                      <Text style={styles.secondaryButtonText}>Open talent profile</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </Card>

            <Card accent="ice">
              <Text style={styles.sectionTitle}>Hiring integrations</Text>
              <Text style={styles.sectionBody}>Recommended world platforms for job discovery and talent sourcing inside the Work operating layer.</Text>
              <View style={styles.stack}>
                {hiringPlatforms.map((platform) => (
                  <View key={platform.id} style={styles.integrationCard}>
                    <View style={styles.toolHeader}>
                      <Badge label={platform.category} variant="ice" />
                      <Badge label={platform.syncStatus} variant="dim" />
                    </View>
                    <Text style={styles.jobTitle}>{platform.name}</Text>
                    <Text style={styles.companyText}>{platform.bestFor}</Text>
                    <Text style={styles.toolBody}>{platform.workflow}</Text>
                    <View style={styles.tagRow}>
                      {platform.strengths.map((strength) => (
                        <Badge key={strength} label={strength} variant="dim" />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          </>
        ) : null}

        {activeTab === "Services" ? (
          <>
            <Card accent="purple">
              <Text style={styles.sectionTitle}>Offer or get services</Text>
              <Text style={styles.sectionBody}>
                Package repeatable services, discover expert offers, and route clients to the right platform based on scope and budget.
              </Text>

              <View style={styles.stack}>
                {recommendedServices.map((service) => (
                  <View key={service.id} style={styles.jobCard}>
                    <View style={styles.toolHeader}>
                      <Badge label={service.serviceType} variant={service.serviceType === "Offer service" ? "purple" : "gold"} />
                      <Badge label={`${service.fitScore} Fit`} variant="blue" />
                    </View>
                    <Text style={styles.jobTitle}>{service.title}</Text>
                    <Text style={styles.companyText}>{service.provider}</Text>
                    <Text style={styles.jobMeta}>{`${service.pricing} | ${service.deliveryWindow}`}</Text>
                    <Text style={styles.toolBody}>{service.summary}</Text>
                    <View style={styles.tagRow}>
                      {service.tags.map((tag) => (
                        <Badge key={tag} label={tag} variant="dim" />
                      ))}
                    </View>

                    {service.linkedProfileId ? (
                      <Pressable
                        onPress={() => navigation.navigate("FreelancerProfile", { userId: service.linkedProfileId! })}
                        style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                      >
                        <Text style={styles.secondaryButtonText}>Open provider profile</Text>
                      </Pressable>
                    ) : null}

                    {service.linkedJobId ? (
                      <Pressable
                        onPress={() => navigation.navigate("JobDetail", { jobId: service.linkedJobId! })}
                        style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                      >
                        <Text style={styles.secondaryButtonText}>Open related opportunity</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            </Card>

            <Card accent="purple">
              <Text style={styles.sectionTitle}>Service integrations</Text>
              <Text style={styles.sectionBody}>Marketplace workflows for people who want to sell services or buy specialist help.</Text>
              <View style={styles.stack}>
                {servicePlatforms.map((platform) => (
                  <View key={platform.id} style={styles.integrationCard}>
                    <View style={styles.toolHeader}>
                      <Badge label={platform.category} variant="purple" />
                      <Badge label={platform.syncStatus} variant="dim" />
                    </View>
                    <Text style={styles.jobTitle}>{platform.name}</Text>
                    <Text style={styles.companyText}>{platform.bestFor}</Text>
                    <Text style={styles.toolBody}>{platform.workflow}</Text>
                    <View style={styles.tagRow}>
                      {platform.strengths.map((strength) => (
                        <Badge key={strength} label={strength} variant="dim" />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          </>
        ) : null}

        {activeTab === "Profile" && freelancer ? (
          <Card accent="blue">
            <Badge label={`Trust ${freelancer.trustScore}`} variant="blue" />
            <Text style={styles.contractTitle}>{freelancer.name}</Text>
            <Text style={styles.companyText}>{freelancer.title}</Text>
            <Text style={styles.jobMeta}>{`${freelancer.hourlyRate} | ${freelancer.availability}`}</Text>
            <Text style={styles.toolBody}>{freelancer.bio}</Text>

            <View style={styles.statGrid}>
              {freelancer.highlights.map((highlight) => (
                <View key={highlight.id} style={styles.statPill}>
                  <Text style={styles.statValue}>{highlight.value}</Text>
                  <Text style={styles.statLabel}>{highlight.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.tagRow}>
              {freelancer.focusAreas.map((focus) => (
                <Badge key={focus} label={focus} variant="dim" />
              ))}
            </View>

            <Pressable
              onPress={() => navigation.navigate("FreelancerProfile", { userId: freelancer.id })}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>Open full profile</Text>
            </Pressable>
          </Card>
        ) : null}
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
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  eyebrow: {
    color: colors.gold,
    ...typography.labelLg,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    color: colors.text,
    ...typography.displaySm,
    marginBottom: spacing.sm,
  },
  heroBody: {
    color: colors.textDim,
    ...typography.bodyMd,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statPill: {
    minWidth: "30%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: withAlpha("blue", 0.08),
    padding: spacing.md,
    gap: spacing.xs,
  },
  statValue: {
    color: colors.text,
    ...typography.displaySm,
  },
  statLabel: {
    color: colors.textDim,
    ...typography.labelMd,
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tabButton: {
    minHeight: touch.minimum,
    minWidth: 74,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  tabButtonSelected: {
    borderColor: colors.blue,
    backgroundColor: withAlpha("blue", 0.12),
  },
  tabButtonText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  tabButtonTextSelected: {
    color: colors.blue,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.displaySm,
    marginBottom: spacing.xs,
  },
  sectionBody: {
    color: colors.textDim,
    ...typography.bodyMd,
    marginBottom: spacing.md,
  },
  stack: {
    gap: spacing.sm,
  },
  toolCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: withAlpha("surface2", 0.72),
    padding: spacing.md,
    gap: spacing.sm,
  },
  toolHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  toolHeadline: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  toolBody: {
    color: colors.textDim,
    ...typography.bodyMd,
  },
  inlineHint: {
    color: colors.ice,
    ...typography.labelLg,
  },
  filterRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  filterChip: {
    minHeight: touch.minimum,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipSelected: {
    borderColor: colors.blue,
    backgroundColor: withAlpha("blue", 0.12),
  },
  filterChipText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  filterChipTextSelected: {
    color: colors.blue,
  },
  jobCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: withAlpha("surface2", 0.66),
    padding: spacing.md,
    gap: spacing.md,
  },
  jobTop: {
    flexDirection: "row",
    gap: spacing.md,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: withAlpha("blue", 0.12),
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: colors.blue,
    ...typography.labelLg,
  },
  jobCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  jobTitle: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  companyText: {
    color: colors.text,
    ...typography.bodySm,
  },
  jobMeta: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
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
  contractCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: withAlpha("green", 0.08),
    padding: spacing.md,
    gap: spacing.sm,
  },
  contractTitle: {
    color: colors.text,
    ...typography.displaySm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  secondaryButton: {
    minHeight: touch.minimum,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.text,
    ...typography.labelLg,
  },
  integrationCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: withAlpha("surface3", 0.78),
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.78,
  },
});
