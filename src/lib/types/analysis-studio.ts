export interface AnalysisPromptTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string; // The "Persona" / instruction
}

export interface AnalysisSlide {
  title: string;
  content: string; // Markdown
  mermaidDiagram?: string; // Optional diagram code
}

export interface AnalysisSection {
  heading: string;
  content: string; // Detailed breakdown
}

export interface AnalysisResult {
  summary: string;
  prdFormat?: string; // Full markdown report
  blueprints?: AnalysisSection[];
  diagrams?: string[]; // Mermaid code strings
  nuances: string[]; // List of specific details found
}

export interface AnalysisRecord {
  id: string;
  url: string;
  videoTitle?: string;
  thumbnailUrl?: string; // Local path or cached URL
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  templateId: string;
  customGoal?: string;
  result?: AnalysisResult;
}

export interface AnalysisState {
  history: AnalysisRecord[];
  activeAnalysisId: string | null;
  templates: AnalysisPromptTemplate[];
}
