import { TaskPriority } from './types';

// TODO: Replace with your actual Google Client ID from Google Cloud Console
// https://console.cloud.google.com/apis/credentials
export const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE';

export const NOTE_COLORS = [
  '#fef3c7', // amber-100
  '#dcfce7', // green-100
  '#dbeafe', // blue-100
  '#fae8ff', // fuchsia-100
  '#fee2e2', // red-100
  '#f3f4f6', // gray-100
];

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'bg-slate-200 text-slate-700',
  [TaskPriority.MEDIUM]: 'bg-blue-100 text-blue-700',
  [TaskPriority.HIGH]: 'bg-orange-100 text-orange-700',
  [TaskPriority.URGENT]: 'bg-red-100 text-red-700',
};

export const DEFAULT_NOTE_SIZE = { width: 240, height: 240 };
export const DEFAULT_TASK_SIZE = { width: 300, height: 200 };
export const DEFAULT_EXPENSE_SIZE = { width: 320, height: 400 };
export const DEFAULT_GROUP_SIZE = { width: 600, height: 400 };

export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 3;