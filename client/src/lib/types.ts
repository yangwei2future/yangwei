/**
 * Blog Data Types
 */

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt?: string;
  categories?: string[];
  refs?: string[];
  hidden?: boolean;
}

export interface BlogConfig {
  name: string;
  title: string;
  description: string;
  author: string;
  email?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
}
