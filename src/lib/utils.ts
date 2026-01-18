import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UIMessage } from 'ai';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMsgContent(message: UIMessage): string {
  if (!message.parts) return '';
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => (part as any).text)
    .join('');
}
