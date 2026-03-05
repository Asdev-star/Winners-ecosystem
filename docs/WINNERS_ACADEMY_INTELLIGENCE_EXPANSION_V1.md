# 🎓 WINNERS ACADEMY — SUPER-INTELLIGENCE EXPANSION
## Complete Recommendations · Features · Tools · Architecture
### Making the Learning Layer the Most Intelligent Education Platform in Africa
**Version 1.0 · March 2026 · learn.winnersempire.io · Supervised by SAGE**

---

> *"A course platform gives people access to content.*
> *An intelligent academy gives people access to transformation.*
> *The difference is not the video quality.*
> *It is whether the platform knows who you are, where you are going,*
> *and exactly what you need to learn next — before you ask."*

---

## WHY THIS DOCUMENT EXISTS

Winners Academy is currently at 45% completion. The infrastructure is solid — `academyRoutes.ts`, `AcademyPage.tsx`, `CoursePage.tsx`, `StudentDashboardPage.tsx`, and the core Prisma schema are all live. The API layer covers courses, modules, lessons, enrollment, progress, reviews, and certificate scaffolding.

What is missing is not more infrastructure. What is missing is **intelligence** — the layer that transforms a well-built LMS into a platform that users describe as the best learning experience they have ever had.

This document is the complete blueprint for that transformation. It is structured in three tiers:

- **Foundation Intelligence** — what SAGE must do as the permanent AI supervisor of the Academy layer (before any new features are built)
- **Feature Expansion** — the specific tools, pages, and capabilities that make Winners Academy category-defining
- **Advanced Intelligence** — the capabilities that place Winners Academy beyond any competitor operating in the African and diaspora market

Every recommendation connects back to the ecosystem's core mission: learning on this platform must have a direct, measurable, visible connection to economic opportunity. A course that does not lead to a Work contract, a Market sale, or a Community reputation is a course that is failing the learner. SAGE exists to make sure that never happens.

---

---

# PART 1 — SAGE: THE PERMANENT INTELLIGENCE LAYER

*These capabilities must be built before any other Academy expansion. SAGE is not a feature — it is the foundation everything else sits on.*

---

## 1.1 SAGE Core — What Must Be Live First

### The SAGE Floating Panel

SAGE must be present on every Academy route via `<AssistantPanel supervisor="sage" />`. When a learner opens any Academy page, SAGE has already reviewed their progress and has something specific to say. Not a blank input. Not a generic welcome. A context-aware observation followed by a recommendation or a question.

The SAGE panel on the CoursePage should pre-load with the current module's context — lesson content, the learner's quiz scores so far in this module, and the number of Work contracts that become available upon certificate completion. This context is injected into SAGE's system prompt before the user types anything.

**Standard SAGE opening — CoursePage:**
*"You're on Module 4 of 6 in React Fundamentals — 68% complete overall. Your quiz average in this course is 81%. At your current pace you finish in 11 days. This certificate unlocks 43 Work contracts averaging $71/hour. What do you want to work through today?"*

This opening demonstrates intelligence. It references real numbers. It connects learning to income. It ends with an open invitation, not a generic question.

---

### 1.2 SAGE as the Socratic Tutor

SAGE never gives quiz answers. This is the most important design constraint in the entire Academy layer. An assistant that gives quiz answers on request is actively undermining the learning it is supposed to support. A learner who passes a quiz via SAGE has not learned — they have gamed the system. When that learner attempts a Work contract requiring those skills, they will fail. That failure damages the platform's reputation.

**The Socratic Method — implemented:**

When a learner asks for a quiz answer:
- SAGE acknowledges the difficulty of the question
- SAGE identifies the specific concept the question is testing
- SAGE provides one piece of relevant context from the course material
- SAGE asks a guiding question that points toward the answer
- SAGE does not reveal the answer, but it makes finding it much easier

**Example:**

Learner: *"What's the answer to question 3? Is React a framework or a library?"*

SAGE: *"That distinction matters more than it sounds. Think about what 'library' and 'framework' actually mean in terms of control — which one calls your code, and which one does your code call? React gives you components and hooks. It doesn't tell you how to route your app, manage state at scale, or fetch data. What does that suggest about where control lives?"*

This response teaches the concept while withholding the answer. The learner arrives at the correct answer through their own reasoning. That understanding stays with them.

---

### 1.3 SAGE Learning Pace Intelligence

SAGE continuously classifies each learner's pace and adjusts its approach accordingly.

```typescript
type LearnerPaceProfile = {
  classification: "accelerated" | "steady" | "struggling" | "disengaged";
  signals: {
    daysBetweenModules: number;
    quizFirstAttemptPassRate: number;     // percentage
    contentReplayRate: number;            // how often videos are rewatched
    questionFrequency: number;            // questions asked per module
    timeOnPage: number;                 // average minutes per lesson
  };
  sageApproach: string;
  proactiveTrigger: string;
};

// Classification → approach mapping:
const PACE_APPROACHES = {
  accelerated: "Challenge-forward. Add extension material. Surface advanced Work contracts.",
  steady:      "Path-maintenance. Celebrate consistency. Keep momentum.",
  struggling:  "Scaffolding mode. Smaller chunks. More guiding questions. Less content per session.",
  disengaged:  "Reconnection mode. Surface the income opportunity. Estimate time to completion. Offer course swap."
};

// Disengagement proactive trigger (fires if no lesson activity in 4 days):
// SAGE sends notification: "Your React certificate is 68% built.
//  At your previous pace, 11 days away. 43 contracts open now.
//  That number will be higher when you finish. Want to do one module today?"
```

---

### 1.4 The Certificate Readiness Report

Before any certificate is issued, SAGE generates a `CertificateReadinessReport` and presents it to the learner. This is not a pass/fail gate — it is a structured intelligence briefing that connects completion to economic opportunity.

```typescript
interface CertificateReadinessReport {
  courseId: string;
  userId: string;
  overallScore: number;           // 0–100
  ready: boolean;
  components: {
    quizAverage: number;          // average across all module quizzes
    completionRate: number;       // percentage of lessons completed
    projectSubmitted: boolean;    // if course has a project
    minimumQuizPasses: boolean;   // all required quizzes passed
    timeInvestment: number;       // hours spent in course
  };
  gaps: {
    module: string;
    issue: string;
    recommendation: string;       // SAGE's specific action to close the gap
  }[];
  economicImpact: {
    workContractsUnlocked: number;
    averageRateForCertifiedHolders: number;    // $/hour
    projectedMonthlyEarningIncrease: number;   // based on platform data
    skillDemandTrajectory: "rising" | "stable" | "cooling";
  };
  sageMessage: string;            // personalised message from SAGE to the learner
}
```

The `economicImpact` section is what makes this different from any other LMS. When a learner sees "this certificate unlocks 43 Work contracts averaging $71/hour with a rising demand trajectory," they are not reading a number. They are reading the economic consequence of the work they just did. That connection is what drives completion rates.

---

### 1.5 The Loop Event — SAGE → OMEGA → CIRCUIT

When SAGE issues a certificate, four events fire simultaneously:

```typescript
// Event 1: Certificate published to public verification URL
// Event 2: Certificate badge added to Work freelancer profile
// Event 3: SAGE fires to OMEGA:
{
  type: "certificate_issued",
  userId: string,
  courseId: string,
  skillsUnlocked: string[],   // skills this certificate validates
  certificateId: string,
  timestamp: Date
}

// OMEGA processes the event → fires to CIRCUIT:
{
  type: "skill_certified",
  userId: string,
  skills: string[],
  action: "scan_job_board"
}

// CIRCUIT scans job board → generates notification:
// "3 contracts are open for your new React Developer skills.
//  Your top match is 94%. Here's a draft proposal ready to submit."
// Notification badge appears on Work tab in sidebar (no page refresh)

// Event 4: AgenticLoop model updated:
// currentStage advances from "academy" to "work"
// Step logged with timestamp, credits used, outcome
```

This is the loop made visible. Certificate → notification → proposal → contract. A learner who completes a course and immediately receives a notification that CIRCUIT has found matching contracts does not need to be convinced to use Winners Work. The connection is self-evident.

---

---

# PART 2 — FOUNDATION FEATURES: WHAT ACADEMY NEEDS NOW

*These are the features that complete the V1.0 and V1.1 roadmap. They must be built before the intelligence expansions in Part 3.*

---

## 2.1 Quiz System — The Certification Engine's Core

The quiz system is the most important missing feature in the entire Academy layer. Without it, certificates cannot be meaningfully gated, and a certificate that anyone can earn by clicking through lessons has no economic value in the Work layer.

**Quiz types to support:**

| Type | Description | When to Use |
|---|---|---|
| Multiple choice | 1 correct answer from 4 options | Concept recall, terminology |
| Multiple select | 1-3 correct answers from 5 options | Complex scenarios, compound knowledge |
| True/False | Binary judgment | Quick comprehension checks |
| Short answer | 2-3 sentence text response | Application of concepts |
| Code submission | Write or fix code in an editor | Technical courses |
| Drag-and-drop ordering | Arrange steps in correct sequence | Process-heavy content |

**Quiz intelligence requirements:**

- Each quiz attempt is scored and stored with timestamp
- Minimum score per quiz is configurable per course (default: 70%)
- Failed attempts show which questions were wrong but not the correct answer — SAGE surfaces a hint instead
- After two failed attempts on the same quiz, SAGE proactively offers a tutoring session on the failing concepts
- Quiz analytics are visible to instructors: which questions have the highest failure rate, which concepts need better teaching

---

## 2.2 PDF Certificate Generation — The Economic Signal

PDFKit is already installed. The certificate is not a PDF document — it is an economic credential. Every design decision should reinforce this.

**Certificate visual design specification:**

- Background: deep navy (`var(--bg)` #0D1520) with a subtle gold geometric pattern
- Top: Winners Academy wordmark in Cormorant Garamond 300 weight, gold
- Centre: learner's full name in Cormorant Garamond 600 weight, 48px, white
- Below name: certificate title in Syne 700 weight, 24px, gold
- Below title: completion date, course ID, and a unique cryptographic verification hash
- Bottom left: SAGE's signature mark (the green supervisor badge)
- Bottom right: QR code linking to public verification URL
- Border: 2px gold frame with subtle corner flourishes
- Watermark: "Winners Ecosystem" in Space Mono, very low opacity, diagonal, repeating

**Certificate verification endpoint:**

```typescript
// GET /academy/certificates/verify/:certificateId
// Returns:
{
  valid: boolean,
  certificate: {
    id: string,
    learnerName: string,
    courseName: string,
    completedAt: Date,
    skills: string[],
    issuerSignature: string  // cryptographic proof
  }
}
```

This endpoint is public — accessible without authentication — because employers need to verify certificates without having a platform account. This is a deliberate friction reduction for the Work layer integration.

---

## 2.3 Instructor Dashboard — The Content Creator's Command Centre

`InstructorDashboard.tsx` is the most important missing page. Without it, no instructor can manage their content, and the catalog remains empty.

**Layout — Bloomberg Terminal aesthetic:**

Top row (6 KPI cards):
- Total students enrolled
- Course revenue (month, with trend arrow)
- Average course rating (star rating + numeric)
- Completion rate across all courses
- SAGE satisfaction score (how learners rate SAGE's help in this instructor's courses)
- Active course count

Below: two-column layout
- Left: course list with per-course metrics (enrolled, completion %, average quiz score, revenue)
- Right: SAGE insights panel with specific recommendations for improving each course

**SAGE Instructor Coaching:**
SAGE analyses each course's performance data and generates specific, actionable recommendations — not generic advice:

*"Module 3 of your React course has a 41% quiz failure rate on Question 4 — the one about hooks dependency arrays. This is the most commonly misunderstood concept in React fundamentals. Adding a 3-minute supplementary video demonstrating a concrete bug caused by incorrect dependencies would likely reduce this failure rate by 60% based on similar improvements in comparable courses."*

This is not an algorithm output. This is SAGE functioning as a teaching coach with genuine domain knowledge.

---

## 2.4 Course Creation — The Instructor's Studio

`CourseCreatePage.tsx` — a full-featured course builder with AI assistance at every step.

**Course creation flow:**

Step 1: Course concept
- Title, tagline, description (SAGE can generate a suggested description from a title + target audience)
- Category selection (10 categories mapped to Work job types)
- Difficulty level (Beginner / Intermediate / Advanced / Expert)
- Target audience — SAGE suggests the right Work contract types this course prepares learners for

Step 2: Curriculum builder
- Drag-and-drop module ordering
- Per-module: title, description, estimated duration
- Per-lesson within module: title, content type (video / text / PDF / interactive)
- SAGE can generate a suggested 6–8 module curriculum structure from the course title and target audience — instructor edits, not starts from scratch

Step 3: Content upload
- Video: Cloudinary upload (direct upload, progress bar, thumbnail auto-generated at 30s mark)
- Text: rich markdown editor with code highlighting
- PDF: upload and embed
- Quiz: question builder with SAGE-generated initial questions (instructor reviews and edits)

Step 4: Pricing and access
- Free / Paid (Stripe price)
- Preview lessons (which lessons are free to preview)
- Certificate configuration (which modules must be completed + minimum quiz scores)

Step 5: SAGE review
Before publishing, SAGE reviews the course structure and generates a `CourseQualityReport`:
- Content completeness score
- Curriculum structure rating
- Quiz difficulty calibration
- Predicted completion rate based on similar courses
- Specific improvements with estimated impact

---

## 2.5 Video Player — The Core Learning Experience

The video player is where learners spend the majority of their Academy time. It must be built to a standard that communicates premium quality.

**Player specification:**

- Provider: Cloudinary (now) → Mux (at scale)
- Custom player skin: dark navy background, gold progress bar, white controls
- Chapter marks: visible in the progress scrubber, clickable to jump directly to any chapter
- Speed controls: 0.75x, 1x, 1.25x, 1.5x, 2x — persistent per user, remembered across sessions
- Transcript toggle: auto-generated via faster-whisper, displayed as scrolling text synced to playback position
- Closed captions: same transcript data displayed as traditional subtitles
- Picture-in-picture: native browser PiP so learners can take notes in another window
- Keyboard shortcuts: Space (play/pause), F (fullscreen), M (mute), ← → (skip 10s), ↑ ↓ (volume)
- Offline download: for Academy Pro subscribers — download lessons for offline viewing on mobile

**SAGE integration in the player:**
A persistent SAGE button in the corner of the player. Clicking it pauses the video and opens SAGE with the current timestamp injected as context: *"The learner just paused at 14:32 in Module 3. The topic at this point is React's useEffect hook. Offer help."*

When the learner types a question, SAGE answers with full awareness of exactly where in the course they are.

---

---

# PART 3 — ADVANCED INTELLIGENCE: THE CATEGORY-DEFINING LAYER

*These are the recommendations that make Winners Academy genuinely different from every other learning platform in the African and diaspora market. These are not incremental improvements — they are the features that users describe to others.*

---

## REC 1 — Lecture-to-Notes: Multimodal Learning Intelligence

**Priority: 🔴 Critical · Revenue: Direct (credits) + Retention multiplier**

A learner uploads an audio recording of an external lecture — a university class, a conference talk, a workshop session they attended. SAGE transcribes it via faster-whisper, structures the content, and generates a complete study package.

**Output for a 60-minute lecture upload:**

```
SAGE STUDY PACKAGE — [Lecture Title]
Generated: [Date] · Processing time: ~3 minutes

─── STRUCTURED NOTES ──────────────────────────────────────
[Topic 1]: [2-3 sentence summary]
  • Key point 1
  • Key point 2
  • Key point 3

[Topic 2]: [2-3 sentence summary]
  ...

─── GLOSSARY (12 terms) ───────────────────────────────────
Term: [definition in plain English, 1-2 sentences]
...

─── 5 QUIZ QUESTIONS ──────────────────────────────────────
Q1. [Multiple choice question testing the core concept]
  A) [Option]  B) [Option]  C) [Option]  D) [Option]
...

─── KEY FORMULAS / CODE SNIPPETS ──────────────────────────
[Any technical content detected in the lecture]

─── SAGE CONNECTIONS ──────────────────────────────────────
"This lecture covers [concept X]. The Academy courses that build
on this material are: [Course 1], [Course 2]. The Work contracts
that commonly require this knowledge are: [Contract types]."

─── RECOMMENDED NEXT STEPS ────────────────────────────────
1. [SAGE's specific recommendation based on the lecture content]
2. [Related Academy course if the skill has a gap]
3. [Work opportunity if the skill is market-ready]
```

**Credit cost:** 15 credits per lecture (expensive — this is a premium feature)
**Why it works:** No other platform in Africa lets you turn an external lecture into a structured learning resource in 3 minutes. Students from African universities — where lecture notes are often unavailable — will use this constantly. Diaspora professionals attending industry conferences will use this to process content they cannot otherwise review.

---

## REC 2 — Adaptive Quiz Generation: SAGE Writes the Test

**Priority: 🔴 Critical · Enables: Certificate credibility**

SAGE reads every lesson in a module and generates a quiz tailored to the actual content. This is not template-based question generation — it is genuine content analysis.

**The generation process:**

```typescript
// POST /academy/courses/:courseId/modules/:moduleId/generate-quiz
// Body: { difficulty: "beginner" | "intermediate" | "advanced" }

// SAGE system prompt for quiz generation:
`You are SAGE, Academy Supervisor for Winners Ecosystem.
You are generating a quiz for Module {{moduleNumber}}: {{moduleName}}.

Module content: {{fullLessonContent}}
Target learner level: {{difficulty}}
Existing learner performance on similar modules: {{platformBenchmarks}}

Generate exactly 10 questions. Rules:
- 5 multiple choice questions (factual recall, concept application)
- 2 multiple select questions (compound knowledge)
- 2 true/false questions with non-obvious correct answers
- 1 short answer question requiring application of the core concept

For each question provide:
- The question text
- All options (for MC and MS)
- The correct answer(s)
- A 2-sentence explanation of why the correct answer is correct
- A SAGE hint — a guiding question that points toward the answer without revealing it

Calibrate difficulty: a learner who read the material carefully but did not memorise it
should pass (score ≥70%) but it should require genuine understanding, not just recognition.

Return ONLY valid JSON. No preamble.`
```

**Instructor controls:**
After SAGE generates the quiz, the instructor sees a full review interface — they can edit, delete, or replace any question before publishing. SAGE's generation is a starting point the instructor improves, not an authoritative output that replaces their judgment.

---

## REC 3 — SAGE Study Groups: AI-Facilitated Peer Learning

**Priority: 🔴 High · Retention multiplier: 4× completion rates vs solo**

SAGE identifies learners who are in the same course at similar progress levels and invites them to form a study group of 3–8 members. The study group has its own dedicated space — a shared progress tracker, a SAGE-moderated discussion channel, and a weekly AI-generated discussion prompt.

**Study group mechanics:**

Every Monday at 09:00 local time, SAGE generates a discussion prompt for the group based on the current module all members are working through:

*"Your group is on Module 4: React Hooks. Before you discuss this week, SAGE noticed that 3 of you scored below 70% on the useState quiz while 2 of you scored above 85%. The two strongest performers on useState: can you explain in your own words why you should never directly mutate state in React? The others: what's your current understanding of why this matters?"*

This prompt does four things simultaneously: it creates accountability, surfaces the specific conceptual gap, invites peer teaching, and uses the quiz data SAGE already has to make the prompt precise rather than generic.

**Group intelligence:**

SAGE monitors quiz scores across all group members and surfaces group-level insights:

- Which concept is causing the most difficulty across the group
- Which member is furthest ahead (offered extended content)
- Which member is furthest behind (offered scaffolded support)
- Whether the group is on track to complete the course before the recommended cohort end date

**Cohort completion rate impact:**
Research across LMS platforms consistently shows that learners in peer groups complete courses at 3–4× the rate of solo learners. SAGE study groups is the single highest-leverage retention mechanism in the Academy layer.

---

## REC 4 — Skill Gap Analysis: The SAGE→CIRCUIT Bridge

**Priority: 🔴 High · Connects Academy directly to Work layer revenue**

When a learner visits the Academy for the first time, or when a learner hasn't been active for 7 days, SAGE runs a Skill Gap Analysis that cross-references three data sources:

1. The learner's current skill profile (from NOVA detections + existing certificates)
2. The Work contracts the learner has viewed, liked, or applied to
3. The current job board demand signal from CIRCUIT

The output is a specific, ranked list of skill gaps with recommended courses for each:

```
─── SAGE SKILL GAP ANALYSIS ───────────────────────────────
Generated for: [User Name] · March 2026

YOUR TARGET: React Developer contracts ($65–$85/hour)
YOUR CURRENT SKILLS: HTML, CSS, JavaScript (NOVA detected)
CIRCUIT MARKET DATA: 156 React contracts open · avg $71/hour

─── GAP PRIORITY RANKING ──────────────────────────────────

🔴 GAP 1 — React Fundamentals (Critical)
   87% of your target contracts require this skill.
   Recommended course: React Fundamentals for African Developers
   Duration: 6 weeks at 5 hours/week
   Certificate value: unlocks 43 direct contract matches

🟡 GAP 2 — Node.js Basics (High)
   64% of your target contracts prefer this skill as a complement.
   Recommended course: Node.js & Express API Development
   Duration: 4 weeks at 4 hours/week
   Adds $12/hour to average React Developer rate

🟢 GAP 3 — TypeScript (Medium)
   41% of senior contracts (>$80/hour) require TypeScript.
   Recommended: complete React Fundamentals first, then add TypeScript.
   This moves you from junior to mid-level rate range.

─── SAGE RECOMMENDED PATH ─────────────────────────────────
React Fundamentals → Node.js Basics → TypeScript Essentials
Total time: 14 weeks at 5 hours/week
Expected outcome: 3–5 contract wins in first 60 days post-certification
Projected monthly income increase: $2,400–$3,800 (based on platform data)
```

This is not motivational content. These are specific, data-grounded projections based on actual platform data from CIRCUIT. When a learner sees "projected monthly income increase: $2,400–$3,800," they are not reading marketing copy — they are reading an economic model based on what other Academy graduates are actually earning on Winners Work.

---

## REC 5 — The Assignment Review Engine

**Priority: 🟡 High · Differentiator: No LMS in Africa offers this**

Learners submit assignments — code files, design screenshots, written essays, business plans — and SAGE reviews them with rubric-based, structured feedback. Not a grade. Not a word count check. Actual pedagogical feedback from an AI that has read the full course content and knows exactly what the assignment is trying to teach.

**Feedback structure for a code submission:**

```
─── SAGE ASSIGNMENT REVIEW ────────────────────────────────
Course: React Fundamentals · Module 4: State Management
Assignment: Build a counter with multiple controls

─── OVERALL ───────────────────────────────────────────────
Score: 74/100 · Status: REVISION RECOMMENDED

─── RUBRIC BREAKDOWN ──────────────────────────────────────
✅ Correct implementation of useState (25/25)
   Your state management is clean. The separation of concerns
   between the counter value and the step size is good practice.

🟡 Component structure (18/25)
   The Reset and Increment logic in the same component makes
   this harder to test and reuse. Consider extracting a
   CounterControl component that receives callbacks as props.

🔴 Error handling (12/25)
   What happens if the user types a letter into the step size
   input? Your current code will break. Add input validation
   and a fallback value. This is what separates professional
   React from hobby React.

⬜ Code style (19/25)
   Good variable naming. The comment on line 23 is redundant —
   the code already describes what it does. Comments should
   explain WHY, not WHAT.

─── SAGE'S SPECIFIC NEXT STEPS ────────────────────────────
1. Extract CounterControl into a separate component (30 minutes)
2. Add input validation with a fallback to the previous valid value
3. Remove the redundant comment on line 23

Resubmit when you have implemented these three changes.
SAGE will review the revision within 30 seconds of submission.
```

This feedback is what a great teaching assistant gives. Not a rubric score. Specific, line-level, concept-connected guidance that tells the learner exactly what to do next.

**Supported assignment types:**
- Code files (JavaScript, TypeScript, Python, HTML/CSS)
- Screenshots of UI designs (SAGE evaluates against UX principles)
- PDF documents (business plans, essays, reports)
- Google Slides / presentation exports
- Written text (essays, reports, reflections)

---

## REC 6 — Live Cohorts: The Community Classroom

**Priority: 🟡 High · Revenue: $199–$999 per cohort**

Live Cohort courses are time-gated, cohort-based learning experiences with a defined start date, a structured curriculum, live sessions, and a shared community space. They combine the structure of formal education with the community dynamics of the Winners platform.

**Cohort structure:**

- Start date: cohorts open every 2–4 weeks
- Duration: 4–12 weeks depending on course
- Max cohort size: 30 students per cohort
- Live sessions: 1–2 per week via Winners Stream (integration with Layer 4C)
- Cohort space: private Group in Winners Community (auto-created on cohort start)
- SAGE facilitation: SAGE moderates the cohort group discussion, generates weekly prompts, surfaces struggling learners to the instructor
- Alumni network: cohort graduates remain connected in a persistent alumni group

**The SAGE cohort facilitator:**

Every Monday, SAGE generates a cohort briefing for both the instructor and the students:

**For the instructor:**
*"Week 3 update: 24/30 students are on track. 4 students have not submitted the Module 2 assignment. 2 students — [names] — have not logged in since Week 1. I recommend a personal message to these 6 learners today. The Module 2 quiz shows 18 students struggled with the async/await section — the Q&A session on Wednesday should dedicate 20 minutes to this specifically."*

**For students:**
*"Week 3: You're ahead of 68% of your cohort on quiz performance. Your assignment was reviewed and returned — there are 3 specific improvements to make before Wednesday's session. The live session is at 19:00 WAT Thursday. SAGE will be in the cohort group all week — ask questions any time."*

---

## REC 7 — The Learning Path Engine: Structured Journeys

**Priority: 🟡 High · Retention + Average order value**

Learning Paths are curated sequences of 3–7 courses that together deliver a complete professional skill set. They are distinct from individual courses in four ways: they have an overarching goal, they are sequenced (course 2 builds on course 1), they have a culminating credential (the Path Certificate, which is worth more than any individual course certificate), and SAGE supervises the entire journey rather than just individual courses.

**Ten anchor paths for the African and diaspora market:**

| Path | Courses | Duration | Path Certificate | Work Target |
|---|---|---|---|---|
| African Software Developer | React → Node.js → TypeScript → APIs → Testing | 5 months | Certified African Developer | $65–$100/hr contracts |
| Digital Marketing Specialist | Social Media → SEO → Email → Ads → Analytics | 4 months | Certified Digital Marketer | Freelance campaigns, $2K–$5K/mo |
| E-Commerce Entrepreneur | Product Sourcing → Store Setup → Dropshipping → Ads → Analytics | 3 months | Certified E-Commerce Operator | Market vendor launch |
| African Fintech Builder | Financial Literacy → Fintech APIs → Digital Payments → Compliance | 4 months | Certified Fintech Navigator | Trading + fintech contracts |
| Creative Brand Professional | Design Fundamentals → Figma → Brand Identity → Motion → Portfolio | 4 months | Certified Creative Professional | Design contracts, Market products |
| Business Founder | Business Planning → Legal Basics → Fundraising → Marketing → Operations | 3 months | Certified Entrepreneur | Market business tools, investors |
| Wellness Coach | Nutrition → Personal Training → Mental Health → Business → Online Coaching | 4 months | Certified Wellness Coach | Work coaching contracts |
| Content Creator Professional | Writing → Video Production → Community Building → Monetisation → Analytics | 3 months | Certified Content Creator | Community creator, brand deals |
| African Language Professional | Primary language course → Translation → Cultural Bridge → Business Communication | 4 months | Certified Language Professional | Translation contracts |
| Data Intelligence Analyst | Data Fundamentals → Python → SQL → Visualisation → Machine Learning Basics | 5 months | Certified Data Analyst | $70–$120/hr data contracts |

**Path Certificate vs Course Certificate:**

The Path Certificate carries significantly more weight than any individual course certificate for three reasons: it represents a sustained commitment (months, not weeks), it demonstrates a complete professional skill set (not a single skill), and SAGE has verified every stage of the journey. In the Work layer, filtering for Path Certificate holders becomes a quality signal for employers seeking senior or specialist talent.

---

## REC 8 — Multilingual Intelligence: Learning in Every Language

**Priority: 🟡 High · Market expansion + African market depth**

Winners Academy serves learners across 54 African countries plus the diaspora. The platform's default English-only experience is not a limitation of the vision — it is a temporary gap that must be addressed.

**Six-language support — implementation sequence:**

| Language | Priority | Learner Market | SAGE Tone Guidance |
|---|---|---|---|
| English | ✅ Live | All African markets, diaspora | Professional, warm, adaptive to learner level |
| French | 🔴 Next | Francophone West + Central Africa (250M speakers) | Formal but not stiff. Francophone African professionals value intellectual rigour. |
| Swahili | 🔴 Next | East Africa — Kenya, Tanzania, Uganda, Rwanda | Communal, warm. Swahili-speaking learners respond to connection and collective progress. |
| Nigerian Pidgin | 🟡 High | Nigeria (220M) — the largest single market | Conversational, direct, uses local reference points. Never condescending. |
| Amharic | 🟡 High | Ethiopia, Eritrea — 60M+ Amharic speakers | Respectful, structured. Ethiopian learners often come from strong formal education backgrounds. |
| Hausa | 🟢 Later | Northern Nigeria, Niger, Ghana — 80M+ speakers | Community-oriented. Reference family and community context. |

**Implementation approach:**

Course content translation: DeepL API for text lessons + auto-translated transcripts. Video dubbing: AI-generated audio dubbing (ElevenLabs or Eleven Multilingual) for premium courses.

SAGE language detection: SAGE detects the language the learner writes in and responds in that language automatically — no language selection required. If a learner writes in Pidgin, SAGE responds in Pidgin. If they switch to English mid-conversation, SAGE switches too.

**Tone guidance in practice — SAGE in Nigerian Pidgin:**

English: *"Your quiz score was below the minimum. Review Module 3 before attempting again."*

Pidgin: *"You no pass the quiz yet — no worry. Go back look Module 3 again well-well, den try again. I go help you with the part wey you miss."*

The second message communicates the same information but in a register that feels like a peer helping you, not a system notifying you of failure. That difference in tone is the difference between a learner who retries and a learner who drops out.

---

## REC 9 — AI Course Outline Generator: The Instructor's Accelerator

**Priority: 🟡 High · Supply side: More courses faster**

The bottleneck on the supply side of any LMS is instructor content creation. An instructor who knows their subject deeply may still spend weeks organising a course curriculum before creating any content.

SAGE eliminates this bottleneck by generating a complete course outline in under 60 seconds from three inputs: course title, target learner level, and target outcome.

**Example generation:**

Input:
```
Course title: "African Fintech APIs: Building Payment Integration for Nigerian Developers"
Target level: Intermediate (knows JavaScript, basic Node.js)
Target outcome: "Build a production-ready payment integration using Flutterwave and Paystack"
```

SAGE output:
```
GENERATED COURSE OUTLINE
8 modules · Estimated 24 hours of content · Recommended weekly pace: 3 hours

MODULE 1: African Fintech Landscape (2 hours)
  Lesson 1.1: How Flutterwave and Paystack changed African commerce (30min)
  Lesson 1.2: API authentication patterns in African fintech (45min)
  Lesson 1.3: Regulatory context — CBN guidelines for developers (30min)
  Quiz: 8 questions on fintech fundamentals
  
MODULE 2: Paystack Integration Fundamentals (3 hours)
  Lesson 2.1: Setting up your Paystack test environment (45min)
  Lesson 2.2: Initialising transactions via the Paystack API (45min)
  Lesson 2.3: Handling webhook callbacks securely (60min)
  Lesson 2.4: Testing with Nigerian test cards (30min)
  Assignment: Build a working checkout flow using Paystack test mode

[...modules 3-8...]

SAGE RECOMMENDATIONS FOR THIS OUTLINE:
1. Add a Module 0 (Environment Setup) — learners at this level often have inconsistent setups.
   20 minutes of setup video will save 3 hours of support questions.
2. Module 7 (Error Handling) is currently too short. Payment errors are where junior devs fail in
   production. Consider splitting into 7A (Client errors) and 7B (Provider errors).
3. The assignment in Module 4 assumes Ngrok is installed — document this dependency explicitly.
```

The instructor receives a complete, professionally structured course outline in 60 seconds, with specific improvement recommendations from SAGE. They review, edit, and improve — then begin creating content. The generation removes the blank-page problem entirely.

---

## REC 10 — Learning Streak System: Behavioural Architecture

**Priority: 🟡 Medium · Retention: Daily active learning habit**

The most powerful retention mechanic in consumer education apps is the streak — a visible, emotionally significant counter of consecutive days of learning. Duolingo built an empire on it.

Winners Academy implements streaks with SAGE intelligence on top — the streak is not just a number, it is a coaching tool.

**Streak mechanics:**

- A "learning day" is counted when a learner completes at least one lesson or 15 minutes of study
- Streak count resets at midnight local time
- SAGE sends a gentle reminder at 20:00 local time if the streak is at risk and the learner has not studied today
- Streak milestones unlock: 7-day (SAGE recognition), 30-day (streak badge on profile), 90-day (featured in Community), 365-day (Winners Scholar status + physical certificate)

**SAGE on at-risk streaks:**

*"Your 23-day streak ends in 2 hours and 14 minutes. Your shortest remaining module today is Lesson 4.2 — CSS Grid Fundamentals, 12 minutes. Want to keep it going?"*

This message is precisely calibrated. It mentions the exact time remaining. It suggests the shortest available action. It ends with a gentle question, not a command. The cognitive load of "save my streak" is much lower than "do a lesson" — the streak makes the action emotionally significant.

**SAGE streak intelligence — knowing when NOT to push:**

If SAGE detects that a learner has had an unusually high volume of platform activity (long sessions, multiple modules), SAGE does not send the streak reminder. If the learner has logged in but seems to be browsing rather than studying, SAGE offers a shorter path. SAGE is a coach who knows when to push and when to let the learner breathe.

---

## REC 11 — Corporate Learning Portal: The Enterprise Revenue Layer

**Priority: 🟡 Medium · Revenue: $29/employee/month — scalable**

African corporations and diaspora businesses need to train their teams. The current consumer learning model — individual enrollment, individual certificates — does not serve this market. The Corporate Learning Portal is a separate interface that allows organisations to:

- Purchase bulk enrollments for their team members
- Create custom learning paths from existing Academy courses
- Track employee progress via a manager dashboard
- Generate organisation-level reports (completion rates, skill gap analysis by department)
- Earn verified Workforce Certification — "This team is Academy-trained in [skill area]"

**SAGE for Corporate:**

SAGE in the corporate context serves two users simultaneously: the individual employee (standard learning support) and the manager (team-level insights).

**Manager SAGE briefing — weekly, automated:**

*"Week 4 corporate team report: 12/15 enrolled employees are on track. 3 employees are behind — 2 have not accessed the course in 5 days, 1 failed the Module 3 quiz twice. Recommend: schedule a 30-minute team session this week on the content from Module 3 — SAGE identified it as the highest-difficulty module for your team specifically. Completion rate trajectory: your team is on track to reach 80% completion by the end of the month, putting you 2 weeks ahead of the platform average for comparable corporate cohorts."*

This report is what a corporate training manager would pay a consultant to produce. SAGE generates it automatically every week.

---

## REC 12 — The Public Certificate Verification Page

**Priority: 🟡 Medium · Enabler: Work layer credibility**

Every certificate issued by Winners Academy must have a public verification URL that works without authentication. This page is what an employer sees when they click the QR code on a certificate submitted in a job application.

**Verification page design:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎓 WINNERS ACADEMY — CERTIFICATE VERIFIED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  HOLDER:          [Full Name]
  COURSE:          React Fundamentals for African Developers
  CERTIFICATE ID:  CERT-2026-XXX-XXXXXX
  ISSUED:          March 15, 2026
  VALID:           No expiry (foundational certificate)
  SKILLS:          React, Component Architecture, State Management,
                   Hooks, Performance Optimisation

  LEARNING JOURNEY:
  ✅ 6 modules completed (100%)
  ✅ Quiz average: 84%
  ✅ Final project submitted and reviewed by SAGE
  ✅ Cryptographic signature verified

  SUPERVISED BY:   SAGE · Winners Academy AI Supervisor

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [Verify another certificate]  [Visit Winners Academy]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

The verification page communicates more than "this is real" — it shows the employer what the learner actually did: module count, quiz average, project completion, and the AI supervisor who verified their work. This is significantly more credible than a name and a date on a PDF.

---

## REC 13 — SAGE Weekly Learning Report: The Coaching Relationship

**Priority: 🟡 Medium · Retention + Engagement**

Every Monday at 08:00 local time, SAGE sends each active learner a personalised weekly learning report. This is not a newsletter. It is a coaching session delivered in 90 seconds of reading.

**Report structure:**

```
Subject: SAGE: Your Week 4 Learning Intelligence Report

Hey [Name],

Week 4 complete. Here is what your data shows.

THIS WEEK:
- 4 lessons completed (React Hooks — Module 4)
- 2 hours 40 minutes total study time
- 1 quiz passed (86% on first attempt)
- Learning streak: 12 consecutive days 🔥

SAGE OBSERVATION:
Your quiz performance on hooks is strong. The one concept
you hesitated on — the dependency array — is worth revisiting.
I noticed you watched the useEffect video twice but did not
ask SAGE any questions. This is exactly the kind of concept
to talk through before the Module 5 quiz, which tests it deeply.

THIS WEEK'S FOCUS:
Module 5 covers custom hooks. It builds directly on what you
learned in Module 4. At your current pace, finishing Module 5
this week puts your certificate 8 days away.

MARKET UPDATE (from CIRCUIT):
The React developer job board this week: 156 contracts open,
average rate $71/hour, up from $68 last week. Your certificate
gets closer to market while the market moves in the right direction.

Your move: start Module 5 today. I will be here.

— SAGE
```

This email does not feel like a system communication. It feels like a message from a mentor who has been watching your progress for a month. The inclusion of market data from CIRCUIT is deliberate — it connects the learner's daily study effort to real economic signals, week by week.

---

## REC 14 — Notebook: The Learner's Companion

**Priority: 🟢 Later · Engagement + Depth**

Every learner gets a persistent Notebook inside the Academy — a space to take notes, save SAGE explanations, bookmark course moments, and build a personal knowledge base that grows across all their courses.

**Notebook features:**

- Rich text editor with markdown support
- Auto-save every 30 seconds
- Timestamp notes to specific moments in a video (click "Note" in the player → opens notebook at that timestamp)
- Tag notes by course, module, and skill
- SAGE can read the notebook — if a learner mentions a concept in chat, SAGE can reference relevant notes they have already taken
- Export notebook to PDF (with Winners Academy branding)
- Share specific notes to Community with one click

**SAGE notebook intelligence:**

When a learner's notes on a concept contradict the course material, SAGE gently flags it:

*"I noticed your note on line 47 says useState returns an object. Looking at Module 3, Lesson 2.1, it actually returns an array. This is a common early confusion — the destructuring syntax can look like object syntax. Want me to clarify?"*

---

## REC 15 — The Instructor-to-Consultant Pipeline

**Priority: 🟢 Later · Cross-layer: Academy → Work → Community**

The most knowledgeable people on the Academy are its instructors. When an instructor teaches a React course that has 500 enrolled students and a 91% completion rate, they have demonstrated something that matters in the Work layer: they can communicate technical concepts clearly, they can structure knowledge for others, and they have a verified body of expertise.

SAGE recognises this and creates a bridge:

**After an instructor's course reaches 100 enrolled students with a rating ≥4.5:**

*"SAGE: Your React Fundamentals course has 127 enrolled students and a 4.7 rating. CIRCUIT has identified 23 open consulting contracts where your teaching expertise is directly relevant — training junior developers, technical documentation, and developer education roles. Would you like CIRCUIT to create a consulting profile that showcases your Academy work? Your students' completion rates and quiz improvements are powerful proof of your teaching effectiveness."*

The instructor's students become their social proof. The course catalog becomes their portfolio. Winners Work becomes their next revenue stream. This is the Agentic Loop operating at the instructor level — not just the learner level.

---

---

# PART 4 — PRISMA SCHEMA ADDITIONS

*Add these to `prisma/schema.prisma` alongside the existing Academy models.*

```prisma
// ─── Quiz System ──────────────────────────────────────────────────────────────
model Quiz {
  id           String        @id @default(cuid())
  moduleId     String
  module       Module        @relation(fields:[moduleId], references:[id])
  title        String
  description  String?
  minimumScore Int           @default(70)
  maxAttempts  Int           @default(3)      // 0 = unlimited
  timeLimit    Int?                           // seconds, null = no limit
  sageGenerated Boolean      @default(false)  // whether SAGE auto-generated this quiz
  questions    Question[]
  attempts     QuizAttempt[]
  createdAt    DateTime      @default(now())
}

model Question {
  id            String      @id @default(cuid())
  quizId        String
  quiz          Quiz        @relation(fields:[quizId], references:[id])
  type          String      // multiple_choice|multiple_select|true_false|short_answer|code|ordering
  content       String      @db.Text
  options       Json?       // [{id, text, correct}] for MC/MS
  correctAnswer String?     @db.Text
  explanation   String      @db.Text    // shown after answer submitted
  sageHint      String      @db.Text    // guiding question after failed attempt
  difficulty    String      @default("medium")  // easy|medium|hard
  orderIndex    Int
  createdAt     DateTime    @default(now())
}

model QuizAttempt {
  id            String    @id @default(cuid())
  quizId        String
  quiz          Quiz      @relation(fields:[quizId], references:[id])
  userId        String
  answers       Json      // [{questionId, answer, correct, timeSpent}]
  score         Int       // percentage 0-100
  passed        Boolean
  attemptNumber Int
  timeTaken     Int       // seconds
  sageReviewed  Boolean   @default(false)  // whether SAGE flagged this for tutoring
  createdAt     DateTime  @default(now())
  @@index([userId, quizId])
}

// ─── Learning Paths ───────────────────────────────────────────────────────────
model LearningPath {
  id           String         @id @default(cuid())
  title        String
  description  String         @db.Text
  tagline      String
  category     String
  difficulty   String
  durationWeeks Int
  courses      PathCourse[]
  enrollments  PathEnrollment[]
  certificate  String?        // path certificate title
  price        Float          @default(0)
  published    Boolean        @default(false)
  createdAt    DateTime       @default(now())
}

model PathCourse {
  id         String      @id @default(cuid())
  pathId     String
  path       LearningPath @relation(fields:[pathId], references:[id])
  courseId   String
  orderIndex Int
  required   Boolean     @default(true)
}

model PathEnrollment {
  id            String       @id @default(cuid())
  pathId        String
  path          LearningPath @relation(fields:[pathId], references:[id])
  userId        String
  currentCourse String?      // courseId of current active course
  completedAt   DateTime?
  certificateId String?
  createdAt     DateTime     @default(now())
  @@unique([pathId, userId])
}

// ─── Study Groups ─────────────────────────────────────────────────────────────
model StudyGroup {
  id          String         @id @default(cuid())
  courseId    String
  name        String
  maxMembers  Int            @default(8)
  members     StudyMember[]
  sagePrompts Json           @default("[]")  // weekly SAGE-generated prompts
  active      Boolean        @default(true)
  createdAt   DateTime       @default(now())
}

model StudyMember {
  id          String      @id @default(cuid())
  groupId     String
  group       StudyGroup  @relation(fields:[groupId], references:[id])
  userId      String
  role        String      @default("member")  // member|facilitator
  joinedAt    DateTime    @default(now())
  @@unique([groupId, userId])
}

// ─── Assignments ──────────────────────────────────────────────────────────────
model Assignment {
  id          String       @id @default(cuid())
  lessonId    String
  title       String
  description String       @db.Text
  type        String       // code|design|essay|pdf|project
  rubric      Json         // [{criterion, maxScore, description}]
  submissions Submission[]
  createdAt   DateTime     @default(now())
}

model Submission {
  id             String     @id @default(cuid())
  assignmentId   String
  assignment     Assignment @relation(fields:[assignmentId], references:[id])
  userId         String
  content        String?    @db.Text   // text submission
  fileUrl        String?               // uploaded file
  sageFeedback   String?    @db.Text   // SAGE's review
  sageScore      Int?                  // 0-100
  sageReviewedAt DateTime?
  submittedAt    DateTime   @default(now())
  @@index([userId, assignmentId])
}

// ─── Learning Streaks ─────────────────────────────────────────────────────────
model LearningStreak {
  id              String    @id @default(cuid())
  userId          String    @unique
  currentStreak   Int       @default(0)
  longestStreak   Int       @default(0)
  lastActivityDate DateTime?
  totalDaysLearned Int      @default(0)
  milestones      Json      @default("[]")  // [{days, achievedAt, badge}]
  updatedAt       DateTime  @updatedAt
}

// ─── Lecture-to-Notes ─────────────────────────────────────────────────────────
model LectureUpload {
  id            String    @id @default(cuid())
  userId        String
  courseId      String?               // if linked to a specific course
  fileName      String
  fileUrl       String
  durationSecs  Int?
  status        String    @default("processing")  // processing|complete|failed
  transcript    String?   @db.Text
  notes         String?   @db.Text   // SAGE-generated structured notes
  glossary      Json?                // [{term, definition}]
  quizQuestions Json?                // generated quiz questions
  creditsCost   Int       @default(15)
  createdAt     DateTime  @default(now())
  @@index([userId])
}

// ─── Corporate Learning ───────────────────────────────────────────────────────
model CorporateAccount {
  id            String            @id @default(cuid())
  tenantId      String            @unique
  companyName   String
  seats         Int               @default(10)
  seatsUsed     Int               @default(0)
  plan          String            @default("standard")  // standard|premium|enterprise
  enrollments   CorporateEnroll[]
  createdAt     DateTime          @default(now())
}

model CorporateEnroll {
  id            String           @id @default(cuid())
  corporateId   String
  corporate     CorporateAccount @relation(fields:[corporateId], references:[id])
  userId        String
  courseId      String
  managerId     String           // who enrolled this employee
  completedAt   DateTime?
  createdAt     DateTime         @default(now())
  @@index([corporateId])
  @@index([userId])
}

// ─── Learner Notebook ─────────────────────────────────────────────────────────
model LearnerNote {
  id          String    @id @default(cuid())
  userId      String
  courseId    String?
  moduleId    String?
  lessonId    String?
  videoTimestamp Int?              // seconds into video when note was taken
  content     String    @db.Text
  tags        Json      @default("[]")
  shared      Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  @@index([userId, courseId])
}
```

---

---

# PART 5 — IMPLEMENTATION BLUEPRINT

## Sprint Sequence for Academy Intelligence

**🔴 Sprint A — Core Completion (Weeks 1-3)**

These are the items that complete V1.0 and V1.1 and are blocking all further development:

```bash
# Files to create:
src/features/academy/InstructorDashboard.tsx      # Priority 1
src/features/academy/CourseCreatePage.tsx        # Priority 2
src/features/academy/QuizEngine.tsx              # Priority 3
src/features/academy/AssignmentPage.tsx          # Priority 4

# Backend routes to add to academyRoutes.ts:
POST   /academy/courses/:id/quizzes               # create quiz
POST   /academy/quizzes/:id/attempt               # submit quiz attempt
GET    /academy/quizzes/:id/attempts              # learner's attempt history
POST   /academy/lessons/:id/assignment           # submit assignment
POST   /academy/certificates/generate/:enrollmentId  # trigger certificate

# Prisma migration:
npx prisma migrate dev --name academy_quiz_certificates
npx prisma generate
```

**🟡 Sprint B — SAGE Intelligence (Weeks 4-6)**

Wire SAGE into the Academy layer as a live supervisor:

```typescript
// Wire AssistantPanel to CoursePage.tsx:
<AssistantPanel
  supervisor="sage"
  pageContext={{
    courseId,
    moduleName,
    lessonContent,
    progressPercent,
    quizScores,
    contractsUnlocked
  }}
/>

// New routes:
POST /academy/sage/generate-quiz        // SAGE generates quiz questions from lesson content
POST /academy/sage/review-assignment    // SAGE reviews a submission
POST /academy/sage/lecture-to-notes     // SAGE processes uploaded lecture audio
GET  /academy/sage/skill-gap/:userId   // SAGE generates skill gap analysis
GET  /academy/sage/readiness/:enrollmentId  // certificate readiness report
```

**🟡 Sprint C — Study Groups + Paths (Weeks 7-9)**

```typescript
// New pages:
src/features/academy/LearningPathsPage.tsx    // path catalog
src/features/academy/PathDetailPage.tsx       // specific path + enrollment
src/features/academy/StudyGroupPage.tsx        // study group space

// New routes:
GET  /academy/paths                           // all learning paths
POST /academy/paths/:id/enroll               // enroll in path
GET  /academy/study-groups/:courseId         // groups for a course
POST /academy/study-groups                   // create or join a group

// SAGE weekly study group prompt job:
// runs every Monday 09:00, generates prompt for each active group
// uses group members' quiz scores to make prompt specific to their struggles
```

**🟢 Sprint D — Advanced Intelligence (Weeks 10-12)**

```typescript
// New pages:
src/features/academy/NotebookPage.tsx              // learner notebook
src/features/academy/CorporatePortalPage.tsx       // corporate learning dashboard
src/features/academy/StreakDashboard.tsx           // streak visualiser

// Streak background job:
// runs every night at 23:00 UTC
// checks last activity date for each learner
// sends at-risk streak notification at 20:00 local time if no activity that day
// updates LearningStreak model

// SAGE weekly report job:
// runs every Monday 08:00 local time
// generates personalised report for every learner with activity in last 7 days
// sends via Resend email
```

---

## Sub-Navigation for Academy

Following the LayerSubNav architecture from the master intelligence bible:

```typescript
export const ACADEMY_SUBNAV: SubNavItem[] = [
  { label: "Explore",       path: "/academy",              icon: "🔭", shortcut: "E" },
  { label: "My Learning",   path: "/academy/my-learning",  icon: "📚", shortcut: "L",
    badge: { count: activeCoursesCount, type: "normal" } },
  { label: "Paths",         path: "/academy/paths",        icon: "🗺️",  shortcut: "P" },
  { label: "Certificates", path: "/academy/certificates", icon: "🏆", shortcut: "C" },
  { label: "Study Groups",  path: "/academy/groups",      icon: "👥", shortcut: "G" },
  { label: "Teach",         path: "/academy/instructor",  icon: "📡", shortcut: "T",
    badge: pendingReviews > 0 ? { count: pendingReviews, type: "alert" } : undefined },
  { label: "Notebook",      path: "/academy/notebook",   icon: "📝", shortcut: "N" },
];

// SAGE Smart Action examples (right side of sub-nav):
// User is 80% through a course:
{ label: "Finish today — 45 min left", supervisor: "sage", href: "/academy/...", urgency: "streak" }

// User just earned a certificate:
{ label: "Share your certificate", supervisor: "sage", href: "/academy/certificates", urgency: "hot" }

// Study group has a new SAGE prompt this Monday:
{ label: "SAGE posted your group prompt", supervisor: "sage", href: "/academy/groups", urgency: "normal" }
```

---

---

# PART 6 — MONETISATION ARCHITECTURE

## Complete Revenue Model for Winners Academy

| Product | Description | Price | Platform Cut |
|---|---|---|---|
| Course Sales | Learners pay per course | $19–$499 | 30% of sale |
| Academy Pro | All courses + SAGE AI tutor unlimited | $19/month | 100% (platform course) |
| Learning Paths | Bundled path pricing (better than individual) | $49–$199 | 30% of sale |
| Live Cohorts | Time-gated, structured learning with live sessions | $199–$999 | 30% of sale |
| Corporate Learning | $29/employee/month, 10-seat minimum | $290+/month | 100% |
| Certificate Verification API | Third parties verify certificates | $0.50/call or $49/month | 100% |
| Lecture-to-Notes | SAGE processes external lecture recordings | 15 AI credits | 100% (credit revenue) |
| Assignment Review | SAGE reviews submitted work | 5 AI credits | 100% (credit revenue) |
| SAGE Pro | Unlimited AI tutor + Lecture-to-Notes + priority response | $29/month | 100% |
| Instructor Promotion | Featured placement in catalog + newsletter | $99–$499/campaign | 100% |
| Path Certificate Verification | Premium employer-facing verification page | $2/call | 100% |

**MRR projections at scale:**

| Scenario | Key Driver | Estimated MRR |
|---|---|---|
| Conservative (1,000 enrolled learners) | 20% Pro conversion | $38K |
| Medium (5,000 enrolled learners) | 25% Pro + 10 corporate accounts | $145K |
| Optimistic (20,000 enrolled learners) | 30% Pro + 50 corporate + 200 cohorts/yr | $580K |

---

---

# PART 7 — SUCCESS METRICS

## How to Know When Academy Intelligence Is Working

| Metric | Month 1 | Month 6 | What It Proves |
|---|---|---|---|
| Course completion rate | >25% | >55% | SAGE reduces abandonment |
| SAGE interaction rate | >40% of active learners | >70% | Learners trust SAGE |
| Quiz first-attempt pass rate | >60% | >72% | SAGE tutoring improves comprehension |
| Certificate-to-Work-contract conversion | >15% | >35% | The loop is closing |
| Study group participation | >20% | >40% | Peer learning is adopted |
| Lecture-to-Notes uploads per week | >50 | >500 | The multimodal feature has product-market fit |
| Academy Pro subscription rate | >8% of learners | >20% | AI intelligence has a clear perceived value |
| SAGE Weekly Report open rate | >35% | >58% | The coaching relationship is real |
| Corporate accounts | 0 | >5 accounts | Enterprise revenue is building |
| Instructor Satisfaction (SAGE coaching quality) | >4.2/5 | >4.6/5 | SAGE is helping instructors improve |

## The North Star Metric for Academy

**Certificate-to-Income Conversion Rate** — the percentage of certificates issued that result in a measurable economic outcome (a Work contract won, a Market product listed, a Community reputation milestone) within 90 days.

**Target: 40% by Month 6.**

When 40% of certificates lead to a visible economic outcome within 90 days, Winners Academy has achieved what no other African learning platform has achieved: learning with a provably closed loop. That number, published as a platform commitment, becomes the most powerful marketing statement in the education sector.

---

*"The academy that teaches for its own sake produces graduates.*
*The academy that teaches for economic transformation produces builders.*
*SAGE's job is to ensure that every lesson, every quiz, every certificate*
*moves the learner one step closer to the contract that pays for everything they built here."*

---

**Document:** `WINNERS_ACADEMY_INTELLIGENCE_EXPANSION_V1.md`
**Layer:** 3 — Winners Academy · learn.winnersempire.io
**Supervisor:** SAGE
**Version:** 1.0 · March 2026
**Recommendations:** 15 features + tools · Complete Prisma schema · Sprint blueprint · Full monetisation model
**Next immediate action:** Build `InstructorDashboard.tsx` → `CourseCreatePage.tsx` → Quiz system → Wire SAGE via AssistantPanel
