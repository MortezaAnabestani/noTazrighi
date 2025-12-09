
export enum AppMode {
  TERMINAL = 'TERMINAL',
  VISUALIZER = 'VISUALIZER',
  MANIFESTO = 'MANIFESTO'
}

export enum Genre {
  POETRY = 'شعر سپید',
  FLASH_FICTION = 'داستان برق‌آسا',
  PHILOSOPHY = 'شطحیات دیجیتال',
  HAIKU = 'هایکوی سایبری'
}

export enum ModificationType {
  DARKER = 'تاریک‌تر',
  ABSTRACT = 'انتزاعی‌تر',
  SIMPLIFY = 'مینیمال',
  EXPAND = 'بسط داده شده'
}

export enum VisualizerMode {
  GALAXY = 'کهکشان'
}

export interface PoetryResponse {
  id: string;
  createdAt: number;
  title: string;
  content: string; // The raw poem
  keywords: string[]; // For visualization
  mood: string;
  genre: string;
  analysis: string; // New field for literary critique
  imageBase64?: string; // Generated abstract image
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface NodeData {
  id: string;
  group: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface LinkData {
  source: string | NodeData;
  target: string | NodeData;
  value: number;
}

export interface GraphData {
  nodes: NodeData[];
  links: LinkData[];
}
