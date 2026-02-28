// src/features/academy/academyStore.ts — Academy Store
// Phase 3: Academy Layer — State management for instructor courses

import { create } from "zustand";

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  about?: string;
  thumbnail?: string;
  previewVideo?: string;
  category: string;
  price: number;
  currency: string;
  published: boolean;
  instructorId: string;
  instructor?: { name: string; email: string };
  modules: Module[];
  enrollments: { id: string; userId: string; createdAt: string }[];
  enrollmentCount: number;
  averageRating: number;
  reviews: Review[];
  createdAt: string;
  updatedAt?: string;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isFree: boolean;
}

export interface Review {
  id: string;
  rating: number;
  body?: string;
  comment?: string;
  user?: { name: string };
}

interface AcademyState {
  instructorCourses: Course[];
  loading: boolean;
  error: string | null;
  fetchInstructorCourses: () => Promise<void>;
  createCourse: (data: Partial<Course>) => Promise<Course>;
  updateCourse: (id: string, data: Partial<Course>) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  createModule: (courseId: string, title: string, order: number) => Promise<Module>;
  createLesson: (moduleId: string, data: Partial<Lesson>) => Promise<Lesson>;
}

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

export const useAcademyStore = create<AcademyState>((set, get) => ({
  instructorCourses: [],
  loading: false,
  error: null,

  fetchInstructorCourses: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/academy/instructor/courses`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch courses");
      const data = await response.json();
      set({ instructorCourses: data, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load", loading: false });
    }
  },

  createCourse: async (data: Partial<Course>) => {
    const response = await fetch(`${API_BASE}/academy/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create course");
    const course = await response.json();
    set({ instructorCourses: [course, ...get().instructorCourses] });
    return course;
  },

  updateCourse: async (id: string, data: Partial<Course>) => {
    const response = await fetch(`${API_BASE}/academy/courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update course");
    const course = await response.json();
    set({
      instructorCourses: get().instructorCourses.map((c) => (c.id === id ? course : c)),
    });
    return course;
  },

  deleteCourse: async (id: string) => {
    const response = await fetch(`${API_BASE}/academy/courses/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to delete course");
    set({
      instructorCourses: get().instructorCourses.filter((c) => c.id !== id),
    });
  },

  createModule: async (courseId: string, title: string, order: number) => {
    const response = await fetch(`${API_BASE}/academy/courses/${courseId}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title, order }),
    });
    if (!response.ok) throw new Error("Failed to create module");
    const module = await response.json();
    // Refresh courses to get updated data
    get().fetchInstructorCourses();
    return module;
  },

  createLesson: async (moduleId: string, data: Partial<Lesson>) => {
    const response = await fetch(`${API_BASE}/academy/modules/${moduleId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create lesson");
    const lesson = await response.json();
    get().fetchInstructorCourses();
    return lesson;
  },
}));
