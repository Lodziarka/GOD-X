
import { Exercise } from './types';

export const EXERCISES: Exercise[] = [
  { id: '1', name: 'Wyciskanie sztangi', category: 'Klatka' },
  { id: '2', name: 'Przysiady', category: 'Nogi' },
  { id: '3', name: 'Martwy ciąg', category: 'Plecy' }
];

export const INITIAL_USER = {
  id: 'user_1',
  name: 'Użytkownik X',
  targetCalories: 2500,
  targetProtein: 160,
  targetCarbs: 250,
  targetFat: 70
};
