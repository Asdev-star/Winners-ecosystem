import { create } from "zustand";

export type AcademyLesson = {
  id: string;
  title: string;
  moduleLabel: string;
  duration: string;
  overview: string;
  videoUrl: string;
};

export type AcademyCourse = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  duration: string;
  category: string;
  progress: number;
  downloaded: boolean;
  enrolled: boolean;
  certificateEligible: boolean;
  nextLessonId: string;
  lessons: AcademyLesson[];
};

type AcademyState = {
  courses: AcademyCourse[];
  notesByLessonId: Record<string, string>;
  enrolledCourseSlugs: string[];
  downloadedCourseSlugs: string[];
  enrollCourse: (slug: string) => void;
  toggleCourseDownload: (slug: string) => void;
  saveLessonNotes: (lessonId: string, notes: string) => void;
};

const COURSE_CATALOG: AcademyCourse[] = [
  {
    slug: "growth-systems-for-diaspora-founders",
    title: "Growth systems for diaspora founders",
    tagline: "Build a repeatable trust-to-transaction engine across Community, Academy, and Market.",
    description:
      "This flagship Academy track helps founders design operator workflows that convert community attention into learning momentum, product demand, and high-trust action.",
    duration: "2 hours 30 minutes",
    category: "Growth",
    progress: 78,
    downloaded: true,
    enrolled: true,
    certificateEligible: true,
    nextLessonId: "lesson-growth-systems",
    lessons: [
      {
        id: "lesson-brand-core",
        title: "Clarifying your operator promise",
        moduleLabel: "Module 1 · Lesson 1",
        duration: "18 minutes",
        overview: "Anchor your promise so every community, course, and market action feels coherent.",
        videoUrl: "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
      },
      {
        id: "lesson-growth-systems",
        title: "Building Your Brand Identity",
        moduleLabel: "Module 3 · Lesson 4",
        duration: "22 minutes",
        overview: "SAGE recommends focusing on how your brand promise, offer structure, and community signals reinforce each other.",
        videoUrl: "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
      },
    ],
  },
  {
    slug: "creator-commerce-operating-model",
    title: "Creator commerce operating model",
    tagline: "Turn audience trust into a structured commercial engine without losing cultural signal.",
    description:
      "Map the creator journey from content rhythm to offer design, operational handoff, and fulfillment visibility across the Winners ecosystem.",
    duration: "1 hour 20 minutes",
    category: "Creator",
    progress: 22,
    downloaded: false,
    enrolled: true,
    certificateEligible: false,
    nextLessonId: "lesson-creator-commerce",
    lessons: [
      {
        id: "lesson-creator-commerce",
        title: "Creator commerce operating model",
        moduleLabel: "Module 2 · Lesson 1",
        duration: "20 minutes",
        overview: "This lesson connects monetization mechanics with audience trust and repeatable community rhythms.",
        videoUrl: "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
      },
      {
        id: "lesson-creator-offers",
        title: "Offer ladders that convert",
        moduleLabel: "Module 2 · Lesson 2",
        duration: "16 minutes",
        overview: "Package simple offers that are easy to explain inside a feed, a lesson, or a live session.",
        videoUrl: "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
      },
    ],
  },
  {
    slug: "building-your-brand-identity",
    title: "Building your brand identity",
    tagline: "Sharpen positioning, narrative, and visual trust markers.",
    description:
      "A concise course for founders and creators who need their voice, positioning, and presence to feel intentional across every surface.",
    duration: "55 minutes",
    category: "Brand",
    progress: 0,
    downloaded: false,
    enrolled: false,
    certificateEligible: false,
    nextLessonId: "lesson-brand-identity",
    lessons: [
      {
        id: "lesson-brand-identity",
        title: "Brand identity foundations",
        moduleLabel: "Module 1 · Lesson 1",
        duration: "15 minutes",
        overview: "Define a brand system that feels clear, distinctive, and culturally grounded.",
        videoUrl: "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
      },
    ],
  },
  {
    slug: "ai-operations-for-lean-teams",
    title: "AI operations for lean teams",
    tagline: "Use assistants to reduce coordination drag without adding chaos.",
    description:
      "Learn where AI creates leverage inside a small team, how to preserve signal quality, and where human review still matters.",
    duration: "1 hour 45 minutes",
    category: "Tech",
    progress: 0,
    downloaded: false,
    enrolled: false,
    certificateEligible: false,
    nextLessonId: "lesson-ai-ops",
    lessons: [
      {
        id: "lesson-ai-ops",
        title: "AI operations for lean teams",
        moduleLabel: "Module 1 · Lesson 1",
        duration: "19 minutes",
        overview: "Use assistants for drafting, triage, and knowledge routing while keeping humans in the loop.",
        videoUrl: "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
      },
    ],
  },
  {
    slug: "community-systems-for-launches",
    title: "Community systems for launches",
    tagline: "Structure momentum before, during, and after a launch.",
    description:
      "Build launch rituals, content prompts, and accountability loops that keep your community active without burning people out.",
    duration: "48 minutes",
    category: "Community",
    progress: 0,
    downloaded: false,
    enrolled: false,
    certificateEligible: false,
    nextLessonId: "lesson-community-systems",
    lessons: [
      {
        id: "lesson-community-systems",
        title: "Community systems for launches",
        moduleLabel: "Module 1 · Lesson 1",
        duration: "14 minutes",
        overview: "Design prompts and events that turn attention into action during a launch window.",
        videoUrl: "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
      },
    ],
  },
];

export const useAcademyStore = create<AcademyState>((set) => ({
  courses: COURSE_CATALOG,
  notesByLessonId: {},
  enrolledCourseSlugs: COURSE_CATALOG.filter((course) => course.enrolled).map((course) => course.slug),
  downloadedCourseSlugs: COURSE_CATALOG.filter((course) => course.downloaded).map((course) => course.slug),

  enrollCourse: (slug) => {
    set((state) => ({
      courses: state.courses.map((course) =>
        course.slug === slug
          ? {
              ...course,
              enrolled: true,
            }
          : course,
      ),
      enrolledCourseSlugs: state.enrolledCourseSlugs.includes(slug)
        ? state.enrolledCourseSlugs
        : [...state.enrolledCourseSlugs, slug],
    }));
  },

  toggleCourseDownload: (slug) => {
    set((state) => {
      const downloaded = !state.downloadedCourseSlugs.includes(slug);

      return {
        courses: state.courses.map((course) =>
          course.slug === slug
            ? {
                ...course,
                downloaded,
              }
            : course,
        ),
        downloadedCourseSlugs: downloaded
          ? [...state.downloadedCourseSlugs, slug]
          : state.downloadedCourseSlugs.filter((entry) => entry !== slug),
      };
    });
  },

  saveLessonNotes: (lessonId, notes) => {
    set((state) => ({
      notesByLessonId: {
        ...state.notesByLessonId,
        [lessonId]: notes,
      },
    }));
  },
}));

export function getAcademyCourse(slug: string) {
  return useAcademyStore.getState().courses.find((course) => course.slug === slug);
}

export function getAcademyLesson(lessonId: string) {
  for (const course of useAcademyStore.getState().courses) {
    const lesson = course.lessons.find((entry) => entry.id === lessonId);
    if (lesson) {
      return {
        course,
        lesson,
      };
    }
  }

  return null;
}
