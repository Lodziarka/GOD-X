
export interface User {
  id: string;
  name: string;
  avatar?: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  connectedDevices?: string[];
}

export interface HealthStats {
  steps: number;
  activeCalories: number;
  heartRate: number;
  distance: number;
  lastSync: number;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: number;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  description?: string;
  imageUrl?: string;
}

export interface SetLog {
  reps: number;
  weight: number;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sets: SetLog[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  exercises: string[];
}

export interface WorkoutSession {
  id: string;
  planId: string;
  name: string;
  date: number;
  exercises: WorkoutExercise[];
}

export interface PersonalRecord {
  exerciseId: string;
  weight: number;
  date: number;
}

export enum AppTab {
  DIET = 'diet',
  WORKOUT = 'workout'
}
