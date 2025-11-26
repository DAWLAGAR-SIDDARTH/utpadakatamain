export enum ItemType {
  NOTE = 'NOTE',
  TASK = 'TASK',
  GROUP = 'GROUP',
  EXPENSE_WIDGET = 'EXPENSE_WIDGET'
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export enum ViewMode {
  BOARD = 'BOARD',
  DASHBOARD = 'DASHBOARD'
}

export type ShareRole = 'view' | 'comment' | 'edit' | 'owner';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface BaseItem {
  id: string;
  type: ItemType;
  position: Position;
  size: Size;
  zIndex: number;
  groupId?: string;
}

export interface NoteItem extends BaseItem {
  type: ItemType.NOTE;
  content: string;
  color: string;
}

export interface TaskItem extends BaseItem {
  type: ItemType.TASK;
  title: string;
  description: string;
  deadline?: string;
  priority: TaskPriority;
  completed: boolean;
  assignee?: string;
}

export interface GroupItem extends BaseItem {
  type: ItemType.GROUP;
  title: string;
  color: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface ExpenseWidgetItem extends BaseItem {
  type: ItemType.EXPENSE_WIDGET;
  title: string;
  expenses: Expense[];
}

export type BoardItem = NoteItem | TaskItem | ExpenseWidgetItem | GroupItem;

export interface User {
  id: string;
  googleId?: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark';
  };
}

export interface WorkspaceState {
  items: BoardItem[];
  expenses: Expense[];
  scale: number;
  offset: Position;
}