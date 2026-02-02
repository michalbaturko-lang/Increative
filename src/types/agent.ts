// =============================================================================
// FSA - Full Solution Agency
// Agent System Types
// =============================================================================

// -----------------------------------------------------------------------------
// Agent Types & Roles
// -----------------------------------------------------------------------------

export type AgentRole = 'supervisor' | 'worker'

export type AgentCapability =
  | 'content_writing'      // Blog posts, product descriptions, copy
  | 'seo_analysis'         // SEO audits, keyword research
  | 'competitor_analysis'  // Market research, competitor monitoring
  | 'ads_management'       // Google Ads, Sklik, Meta Ads
  | 'social_media'         // Social content, scheduling
  | 'web_development'      // MVP creation, landing pages
  | 'design'               // Visual assets, banners
  | 'strategy'             // Marketing strategy, planning
  | 'data_analysis'        // Analytics, reporting
  | 'client_research'      // Client profiling, opportunity detection

export type AgentStatus =
  | 'idle'           // Ready for work
  | 'working'        // Processing a task
  | 'waiting'        // Waiting for human input
  | 'reviewing'      // Supervisor reviewing output
  | 'error'          // Something went wrong
  | 'paused'         // Manually paused

export interface Agent {
  id: string
  name: string
  role: AgentRole
  status: AgentStatus
  capabilities: AgentCapability[]
  currentTaskId: string | null
  createdAt: Date
  lastActiveAt: Date
  stats: AgentStats
}

export interface AgentStats {
  tasksCompleted: number
  tasksInProgress: number
  averageTaskDuration: number // in minutes
  successRate: number // 0-100
  learningsContributed: number
}

// -----------------------------------------------------------------------------
// Supervisor Agent Specific
// -----------------------------------------------------------------------------

export interface SupervisorAgent extends Agent {
  role: 'supervisor'
  managedAgentIds: string[]
  escalationRules: EscalationRule[]
  qualityThreshold: number // 0-100, below this = needs review
}

export interface EscalationRule {
  id: string
  condition: EscalationCondition
  action: EscalationAction
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export type EscalationCondition =
  | { type: 'task_stuck'; durationMinutes: number }
  | { type: 'confidence_low'; threshold: number }
  | { type: 'budget_decision'; amountThreshold: number }
  | { type: 'client_facing'; always: true }
  | { type: 'error_count'; threshold: number }
  | { type: 'manual' }

export type EscalationAction =
  | { type: 'notify_human'; channel: 'dashboard' | 'email' | 'slack' }
  | { type: 'reassign_task'; toAgentId: string }
  | { type: 'pause_task' }
  | { type: 'request_human_input'; question: string }

// -----------------------------------------------------------------------------
// Tasks
// -----------------------------------------------------------------------------

export type TaskStatus =
  | 'queued'           // Waiting to be assigned
  | 'assigned'         // Assigned to agent, not started
  | 'in_progress'      // Being worked on
  | 'needs_input'      // Waiting for human input
  | 'under_review'     // Supervisor is reviewing
  | 'completed'        // Done
  | 'failed'           // Failed with error
  | 'cancelled'        // Manually cancelled

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TaskType =
  | 'content_creation'
  | 'seo_audit'
  | 'competitor_analysis'
  | 'ads_campaign'
  | 'social_media'
  | 'email_marketing'
  | 'web_development'
  | 'mvp_creation'
  | 'client_analysis'
  | 'strategy_creation'
  | 'report_generation'
  | 'custom'

export interface Task {
  id: string
  type: TaskType
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority

  // Assignment
  assignedAgentId: string | null
  supervisorId: string

  // Client context
  clientId: string | null
  clientName: string | null

  // Progress
  progress: number // 0-100
  steps: TaskStep[]
  currentStepIndex: number

  // Communication
  messages: TaskMessage[]
  pendingQuestion: PendingQuestion | null

  // Output
  output: TaskOutput | null

  // Knowledge base reference
  templateId: string | null // If created from a template
  similarTaskIds: string[] // For learning reference

  // Timestamps
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
  estimatedDuration: number | null // minutes
}

export interface TaskStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  output: string | null
}

export interface TaskMessage {
  id: string
  role: 'agent' | 'supervisor' | 'human'
  agentId: string | null
  content: string
  timestamp: Date
}

export interface PendingQuestion {
  id: string
  question: string
  context: string
  options: string[] | null // If multiple choice
  askedAt: Date
  askedBy: 'agent' | 'supervisor'
}

export interface TaskOutput {
  type: 'text' | 'file' | 'code' | 'analysis' | 'mixed'
  content: string
  files: OutputFile[]
  metadata: Record<string, unknown>
}

export interface OutputFile {
  id: string
  name: string
  type: string
  url: string
  size: number
}

// -----------------------------------------------------------------------------
// Knowledge Base / Shared Learning
// -----------------------------------------------------------------------------

export interface KnowledgeEntry {
  id: string
  type: KnowledgeType
  title: string
  description: string

  // Categorization
  tags: string[]
  capabilities: AgentCapability[]
  industries: string[] // e.g., 'e-commerce', 'wellness', 'b2b'

  // Content
  content: KnowledgeContent

  // Source
  sourceTaskId: string | null
  sourceClientId: string | null
  createdByAgentId: string
  approvedByHuman: boolean

  // Usage stats
  timesUsed: number
  successRate: number // When used, how often successful
  lastUsedAt: Date | null

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export type KnowledgeType =
  | 'template'          // Reusable task template
  | 'process'           // Step-by-step process
  | 'best_practice'     // Learned best practice
  | 'example'           // Example output
  | 'prompt'            // Effective prompt pattern
  | 'asset'             // Reusable asset (design, code snippet)

export interface KnowledgeContent {
  // Template/Process
  steps?: string[]
  prompts?: string[]

  // Example output
  exampleOutput?: string
  exampleFiles?: OutputFile[]

  // Code/Asset
  code?: string
  language?: string

  // Context for AI
  systemPrompt?: string
  contextInstructions?: string
}

// -----------------------------------------------------------------------------
// Clients
// -----------------------------------------------------------------------------

export interface Client {
  id: string
  name: string
  industry: string
  website: string | null

  // External IDs
  clickupId: string | null
  googleAnalyticsId: string | null
  metaAdAccountId: string | null
  googleAdsId: string | null
  sklikId: string | null

  // Profile (AI-generated)
  profile: ClientProfile | null

  // Opportunities (AI-detected)
  opportunities: Opportunity[]

  // History
  taskIds: string[]
  totalProjects: number
  activeProjects: number

  // Scoring
  potentialScore: number // 0-100, how much opportunity
  engagementScore: number // 0-100, how engaged

  // Timestamps
  createdAt: Date
  updatedAt: Date
  lastInteractionAt: Date | null
}

export interface ClientProfile {
  summary: string
  toneOfVoice: string
  targetAudience: string
  competitors: string[]
  strengths: string[]
  weaknesses: string[]
  currentServices: string[] // What we do for them
  brandColors: string[]
  logoUrl: string | null
}

export interface Opportunity {
  id: string
  type: OpportunityType
  title: string
  description: string
  estimatedValue: number | null // CZK
  confidence: number // 0-100
  suggestedApproach: string
  relatedKnowledgeIds: string[] // Templates/examples we can use
  detectedAt: Date
  status: 'new' | 'contacted' | 'in_progress' | 'won' | 'lost' | 'dismissed'
}

export type OpportunityType =
  | 'new_service'       // They could use a service we offer
  | 'upsell'           // Expand existing service
  | 'problem_detected' // We noticed something wrong (SEO, ads)
  | 'market_trend'     // Industry trend they should act on
  | 'competitor_move'  // Competitor did something

// -----------------------------------------------------------------------------
// Dashboard & UI State
// -----------------------------------------------------------------------------

export interface DashboardState {
  activeAgents: Agent[]
  taskQueue: Task[]
  recentCompletions: Task[]
  pendingQuestions: Array<{
    task: Task
    question: PendingQuestion
  }>
  stats: DashboardStats
}

export interface DashboardStats {
  tasksToday: number
  tasksThisWeek: number
  averageCompletionTime: number
  activeClients: number
  opportunitiesDetected: number
  knowledgeEntries: number
}

// -----------------------------------------------------------------------------
// API Request/Response Types
// -----------------------------------------------------------------------------

export interface CreateTaskRequest {
  type: TaskType
  title: string
  description: string
  priority?: TaskPriority
  clientId?: string
  templateId?: string
  referenceTaskId?: string // "Do it like this task"
}

export interface AnswerQuestionRequest {
  taskId: string
  questionId: string
  answer: string
}

export interface AgentCommandRequest {
  type: 'pause' | 'resume' | 'cancel' | 'reassign'
  taskId: string
  targetAgentId?: string
}
