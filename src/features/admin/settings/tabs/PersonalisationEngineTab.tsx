import SettingSelect from "../components/SettingSelect";
import SettingSlider from "../components/SettingSlider";
import SettingToggle from "../components/SettingToggle";
import type { PersonalisationConfig } from "../settingsTypes";

type Props = {
  value: PersonalisationConfig;
  disabled?: boolean;
  onChange: (value: PersonalisationConfig) => void;
};

export default function PersonalisationEngineTab({ value, disabled, onChange }: Props) {
  const profileOptions = [
    { value: "creator", label: "Creator" },
    { value: "learner", label: "Learner" },
    { value: "supervisor", label: "Supervisor" },
    { value: "vendor", label: "Vendor" },
    { value: "freelancer", label: "Freelancer" },
  ];

  return (
    <div className="tabstack">
      <section className="tabcard">
        <div className="tabtitle">OMEGA Onboarding Control</div>
        <div className="tabgrid">
          <SettingToggle
            label="Show onboarding questions"
            description="Enable the full OMEGA classification flow for new users."
            checked={value.questionsEnabled}
            disabled={disabled}
            onChange={(questionsEnabled) => onChange({ ...value, questionsEnabled })}
          />
          <SettingSelect
            label="Questions count"
            description="Choose the onboarding depth."
            value={String(value.questionsCount)}
            disabled={disabled}
            options={[
              { value: "3", label: "3 questions" },
              { value: "5", label: "5 questions" },
              { value: "7", label: "7 questions" },
            ]}
            onChange={(questionsCount) => onChange({ ...value, questionsCount: Number(questionsCount) as 3 | 5 | 7 })}
          />
          <SettingToggle
            label='Allow "Skip for now"'
            description="Let users skip each onboarding question."
            checked={value.skipAllowed}
            disabled={disabled}
            onChange={(skipAllowed) => onChange({ ...value, skipAllowed })}
          />
          <SettingSelect
            label="Default profile"
            description="Applied when classification is ambiguous."
            value={value.defaultProfile}
            disabled={disabled}
            options={profileOptions}
            onChange={(defaultProfile) => onChange({ ...value, defaultProfile })}
          />
          <SettingSelect
            label="Onboarding tone"
            description="Adjust OMEGA's voice during the flow."
            value={value.onboardingTone}
            disabled={disabled}
            options={[
              { value: "warm", label: "Warm" },
              { value: "direct", label: "Direct" },
              { value: "formal", label: "Formal" },
              { value: "energetic", label: "Energetic" },
            ]}
            onChange={(onboardingTone) => onChange({ ...value, onboardingTone: onboardingTone as PersonalisationConfig["onboardingTone"] })}
          />
          <SettingSelect
            label="Default plan"
            description="Choose the plan assigned on onboarding completion."
            value={value.defaultPlan}
            disabled={disabled}
            options={[
              { value: "FREE", label: "Free" },
              { value: "PRO_TRIAL_7", label: "Pro trial 7 days" },
              { value: "PRO_TRIAL_14", label: "Pro trial 14 days" },
            ]}
            onChange={(defaultPlan) => onChange({ ...value, defaultPlan: defaultPlan as PersonalisationConfig["defaultPlan"] })}
          />
          <SettingToggle
            label="Trial conversion nudge"
            description="Show the upgrade nudge at the end of the trial."
            checked={value.trialConversionNudge}
            disabled={disabled}
            onChange={(trialConversionNudge) => onChange({ ...value, trialConversionNudge })}
          />
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Profile Signal Weighting</div>
        <div className="tabgrid">
          <SettingSlider
            label="Role signal weight"
            description="How much the role answer influences routing."
            value={value.roleSignalWeight}
            min={0}
            max={100}
            disabled={disabled}
            onChange={(roleSignalWeight) => onChange({ ...value, roleSignalWeight })}
          />
          <SettingSlider
            label="Skills signal weight"
            description="How much the skills answer influences routing."
            value={value.skillsSignalWeight}
            min={0}
            max={100}
            disabled={disabled}
            onChange={(skillsSignalWeight) => onChange({ ...value, skillsSignalWeight })}
          />
          <SettingSlider
            label="Income goal weight"
            description="How much the income goal answer influences routing."
            value={value.incomeGoalWeight}
            min={0}
            max={100}
            disabled={disabled}
            onChange={(incomeGoalWeight) => onChange({ ...value, incomeGoalWeight })}
          />
          <SettingSlider
            label="Market signal weight"
            description="How much the market answer influences routing."
            value={value.marketSignalWeight}
            min={0}
            max={100}
            disabled={disabled}
            onChange={(marketSignalWeight) => onChange({ ...value, marketSignalWeight })}
          />
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Supervisor Personality Settings</div>
        <div className="tabgrid">
          <SettingSelect
            label="Select supervisor"
            description="Tune personality per supervisor."
            value={value.supervisorPersonality.activeSupervisor}
            disabled={disabled}
            options={[
              { value: "OMEGA", label: "OMEGA" },
              { value: "NOVA", label: "NOVA" },
              { value: "SAGE", label: "SAGE" },
              { value: "ATLAS", label: "ATLAS" },
              { value: "CIRCUIT", label: "CIRCUIT" },
            ]}
            onChange={(activeSupervisor) => onChange({
              ...value,
              supervisorPersonality: { ...value.supervisorPersonality, activeSupervisor },
            })}
          />
          <SettingSlider
            label="Verbosity"
            description="Concise to detailed output."
            value={value.supervisorPersonality.verbosity}
            min={0}
            max={100}
            disabled={disabled}
            onChange={(verbosity) => onChange({
              ...value,
              supervisorPersonality: { ...value.supervisorPersonality, verbosity },
            })}
          />
          <SettingSlider
            label="Proactivity"
            description="How often the supervisor initiates."
            value={value.supervisorPersonality.proactivity}
            min={0}
            max={100}
            disabled={disabled}
            onChange={(proactivity) => onChange({
              ...value,
              supervisorPersonality: { ...value.supervisorPersonality, proactivity },
            })}
          />
          <SettingSlider
            label="Data orientation"
            description="Qualitative to data-driven."
            value={value.supervisorPersonality.dataOrientation}
            min={0}
            max={100}
            disabled={disabled}
            onChange={(dataOrientation) => onChange({
              ...value,
              supervisorPersonality: { ...value.supervisorPersonality, dataOrientation },
            })}
          />
          <SettingSelect
            label="Active hours"
            description="When the supervisor should respond."
            value={value.supervisorPersonality.activeHours}
            disabled={disabled}
            options={[
              { value: "all_day", label: "All day" },
              { value: "business_hours", label: "Business hours" },
              { value: "night_shift", label: "Night shift" },
            ]}
            onChange={(activeHours) => onChange({
              ...value,
              supervisorPersonality: { ...value.supervisorPersonality, activeHours },
            })}
          />
          <SettingSelect
            label="Timezone"
            description="Response window timezone."
            value={value.supervisorPersonality.timezone}
            disabled={disabled}
            options={["UTC", "Africa/Nairobi", "Africa/Lagos", "Africa/Johannesburg"].map((tz) => ({ value: tz, label: tz }))}
            onChange={(timezone) => onChange({
              ...value,
              supervisorPersonality: { ...value.supervisorPersonality, timezone },
            })}
          />
          <SettingSelect
            label="Max responses per user"
            description="Daily response cap per user."
            value={String(value.supervisorPersonality.maxResponsesPerUserPerDay)}
            disabled={disabled}
            options={["10", "25", "50", "100", "unlimited"].map((option) => ({ value: option, label: option === "unlimited" ? "Unlimited" : option }))}
            onChange={(raw) => onChange({
              ...value,
              supervisorPersonality: {
                ...value.supervisorPersonality,
                maxResponsesPerUserPerDay: raw === "unlimited" ? 9999 : Number(raw),
              },
            })}
          />
          <SettingToggle
            label="Short-term memory"
            description="Keep session memory active."
            checked={value.supervisorPersonality.shortTermMemory}
            disabled={disabled}
            onChange={(shortTermMemory) => onChange({
              ...value,
              supervisorPersonality: { ...value.supervisorPersonality, shortTermMemory },
            })}
          />
          <SettingToggle
            label="Long-term memory"
            description="Persist AssistantMemory across sessions."
            checked={value.supervisorPersonality.longTermMemory}
            disabled={disabled}
            onChange={(longTermMemory) => onChange({
              ...value,
              supervisorPersonality: { ...value.supervisorPersonality, longTermMemory },
            })}
          />
          <SettingSelect
            label="Memory expiry"
            description="Expiry for non-critical memories."
            value={value.supervisorPersonality.memoryExpiryDays}
            disabled={disabled}
            options={["7", "14", "30", "90", "never"].map((item) => ({ value: item, label: item === "never" ? "Never" : `${item} days` }))}
            onChange={(memoryExpiryDays) => onChange({
              ...value,
              supervisorPersonality: { ...value.supervisorPersonality, memoryExpiryDays },
            })}
          />
          <SettingSelect
            label="Critical memory expiry"
            description="Expiry for milestone memories."
            value={value.supervisorPersonality.criticalMemoryExpiryDays}
            disabled={disabled}
            options={["30", "90", "180", "never"].map((item) => ({ value: item, label: item === "never" ? "Never" : `${item} days` }))}
            onChange={(criticalMemoryExpiryDays) => onChange({
              ...value,
              supervisorPersonality: { ...value.supervisorPersonality, criticalMemoryExpiryDays },
            })}
          />
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Recommendation Engine Settings</div>
        <div className="tabgrid">
          <SettingSelect
            label="Briefing frequency"
            description="When OMEGA should generate briefings."
            value={value.recommendationEngine.briefingFrequency}
            disabled={disabled}
            options={[
              { value: "daily", label: "Daily" },
              { value: "every_login", label: "Every login" },
              { value: "weekly", label: "Weekly" },
            ]}
            onChange={(briefingFrequency) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, briefingFrequency: briefingFrequency as PersonalisationConfig["recommendationEngine"]["briefingFrequency"] },
            })}
          />
          <SettingSelect
            label="Briefing depth"
            description="How detailed the recommendation briefing is."
            value={value.recommendationEngine.briefingDepth}
            disabled={disabled}
            options={[
              { value: "summary", label: "Summary" },
              { value: "standard", label: "Standard" },
              { value: "deep", label: "Deep" },
            ]}
            onChange={(briefingDepth) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, briefingDepth: briefingDepth as PersonalisationConfig["recommendationEngine"]["briefingDepth"] },
            })}
          />
          <SettingSelect
            label="Briefing cron"
            description="Generate time for scheduled briefings."
            value={value.recommendationEngine.briefingGenerateAt}
            disabled={disabled}
            options={["0 6 * * *", "0 7 * * *", "0 8 * * 1"].map((item) => ({ value: item, label: item }))}
            onChange={(briefingGenerateAt) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, briefingGenerateAt },
            })}
          />
          <SettingToggle
            label="Cross-layer nudges"
            description="Surface relevant nudges across layers."
            checked={value.recommendationEngine.crossLayerNudges}
            disabled={disabled}
            onChange={(crossLayerNudges) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, crossLayerNudges },
            })}
          />
          <SettingSlider
            label="Nudge frequency limit"
            description="Max nudges per user per day."
            value={value.recommendationEngine.nudgeFrequencyLimit}
            min={0}
            max={10}
            disabled={disabled}
            onChange={(nudgeFrequencyLimit) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, nudgeFrequencyLimit },
            })}
          />
          <SettingSlider
            label="Nudge cooldown hours"
            description="Minimum hours between similar nudges."
            value={value.recommendationEngine.nudgeCooldownHours}
            min={0}
            max={24}
            disabled={disabled}
            onChange={(nudgeCooldownHours) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, nudgeCooldownHours },
            })}
          />
          <SettingToggle
            label="SAGE proactive prompts"
            description="Suggest study prompts automatically."
            checked={value.recommendationEngine.sageProactiveStudyPrompts}
            disabled={disabled}
            onChange={(sageProactiveStudyPrompts) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, sageProactiveStudyPrompts },
            })}
          />
          <SettingSlider
            label="SAGE streak warning"
            description="Days inactive before warning."
            value={value.recommendationEngine.sageStreakWarningDayThreshold}
            min={1}
            max={30}
            disabled={disabled}
            onChange={(sageStreakWarningDayThreshold) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, sageStreakWarningDayThreshold },
            })}
          />
          <SettingToggle
            label="ATLAS auto product suggestions"
            description="Suggest products automatically."
            checked={value.recommendationEngine.atlasAutoProductSuggestions}
            disabled={disabled}
            onChange={(atlasAutoProductSuggestions) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, atlasAutoProductSuggestions },
            })}
          />
          <SettingSelect
            label="ATLAS insight schedule"
            description="Cron for vendor insight generation."
            value={value.recommendationEngine.atlasVendorInsightSchedule}
            disabled={disabled}
            options={["0 8 * * 1", "0 9 * * 1", "0 12 * * 1"].map((item) => ({ value: item, label: item }))}
            onChange={(atlasVendorInsightSchedule) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, atlasVendorInsightSchedule },
            })}
          />
          <SettingToggle
            label="CIRCUIT auto job matching"
            description="Enable automatic job matching."
            checked={value.recommendationEngine.circuitAutoJobMatching}
            disabled={disabled}
            onChange={(circuitAutoJobMatching) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, circuitAutoJobMatching },
            })}
          />
          <SettingSlider
            label="Match threshold"
            description="Default minimum match score."
            value={value.recommendationEngine.circuitMatchThresholdDefault}
            min={0}
            max={100}
            disabled={disabled}
            onChange={(circuitMatchThresholdDefault) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, circuitMatchThresholdDefault },
            })}
          />
          <SettingToggle
            label="CIRCUIT auto proposal generation"
            description="Draft proposals automatically."
            checked={value.recommendationEngine.circuitProposalAutoGenerate}
            disabled={disabled}
            onChange={(circuitProposalAutoGenerate) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, circuitProposalAutoGenerate },
            })}
          />
          <SettingSlider
            label="Cert trust weight"
            description="Trust score weight for certificates."
            value={value.recommendationEngine.trustScoreWeightCerts}
            min={0}
            max={100}
            disabled={disabled}
            onChange={(trustScoreWeightCerts) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, trustScoreWeightCerts },
            })}
          />
          <SettingSlider
            label="Contract trust weight"
            description="Trust score weight for contracts."
            value={value.recommendationEngine.trustScoreWeightContracts}
            min={0}
            max={100}
            disabled={disabled}
            onChange={(trustScoreWeightContracts) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, trustScoreWeightContracts },
            })}
          />
          <SettingSlider
            label="Community trust weight"
            description="Trust score weight for community activity."
            value={value.recommendationEngine.trustScoreWeightCommunity}
            min={0}
            max={100}
            disabled={disabled}
            onChange={(trustScoreWeightCommunity) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, trustScoreWeightCommunity },
            })}
          />
          <SettingSlider
            label="Identity trust weight"
            description="Trust score weight for identity verification."
            value={value.recommendationEngine.trustScoreWeightIdentity}
            min={0}
            max={100}
            disabled={disabled}
            onChange={(trustScoreWeightIdentity) => onChange({
              ...value,
              recommendationEngine: { ...value.recommendationEngine, trustScoreWeightIdentity },
            })}
          />
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Flow Settings</div>
        <div className="tabgrid">
          <SettingToggle
            label="Onboarding flow enabled"
            description="Show the guided OMEGA flow to new users."
            checked={value.onboardingFlowEnabled}
            disabled={disabled}
            onChange={(onboardingFlowEnabled) => onChange({ ...value, onboardingFlowEnabled })}
          />
          <SettingToggle
            label="Recommended content"
            description="Enable contextual suggestions."
            checked={value.recommendedContent}
            disabled={disabled}
            onChange={(recommendedContent) => onChange({ ...value, recommendedContent })}
          />
          <SettingToggle
            label="Learning path"
            description="Generate a guided learning track."
            checked={value.learningPath}
            disabled={disabled}
            onChange={(learningPath) => onChange({ ...value, learningPath })}
          />
          <SettingToggle
            label="Notifications"
            description="Adapt notification behavior by user preference."
            checked={value.notifications}
            disabled={disabled}
            onChange={(notifications) => onChange({ ...value, notifications })}
          />
          <SettingSelect
            label="Supervisor tone"
            description="Affects general system prompts and nudges."
            value={value.supervisorTone}
            disabled={disabled}
            options={[
              { value: "measured", label: "Measured" },
              { value: "direct", label: "Direct" },
              { value: "friendly", label: "Friendly" },
              { value: "premium", label: "Premium" },
              { value: "urgent", label: "Urgent" },
            ]}
            onChange={(supervisorTone) => onChange({ ...value, supervisorTone })}
          />
          <SettingSlider
            label="Recommendation aggressiveness"
            description="How hard the system pushes the next best action."
            value={value.recommendationAggressiveness}
            min={0}
            max={100}
            disabled={disabled}
            onChange={(recommendationAggressiveness) => onChange({ ...value, recommendationAggressiveness })}
          />
        </div>
      </section>

      <section className="tabcard">
        <div className="tabtitle">Content Weighting</div>
        <div className="aslist">
          {value.profileTypeWeights.map((item) => (
            <div key={item.profileType} className="aslist-row">
              <strong>{item.profileType}</strong>
              <span>{item.weight}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
