export interface GenerationConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  outputDir: string;
  projectName: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  prompt: string;
  dependencies?: string[];
  outputType: 'code' | 'architecture' | 'documentation';
}

export interface GenerationResult {
  stepId: string;
  success: boolean;
  output?: string;
  error?: string;
  timestamp: string;
  duration: number;
}

export interface AppArchitecture {
  projectName: string;
  description: string;
  techStack: string[];
  fileStructure: FileStructure[];
  dependencies: Record<string, string>;
  scripts: Record<string, string>;
  domain?: string;
}

export interface FileStructure {
  path: string;
  type: 'file' | 'directory';
  content?: string;
  description?: string;
}

export interface WorkflowContext {
  config: GenerationConfig;
  architecture?: AppArchitecture;
  generatedFiles: Map<string, string>;
  logs: GenerationResult[];
  startTime: Date;
}

export interface ApiResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
  timestamp: string;
}

export interface ErrorContext {
  sessionId: string;
  userPrompt?: string;
  appFolder?: string;
  duration?: number;
}