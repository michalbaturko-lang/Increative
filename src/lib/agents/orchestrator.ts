/**
 * FSA Agent Orchestrator
 *
 * This module handles the coordination of AI agents, including:
 * - Task assignment and routing
 * - Supervisor → Worker hierarchy
 * - Escalation handling
 * - Shared learning/knowledge base integration
 */

import type {
  Agent,
  AgentCapability,
  Task,
  TaskStatus,
  KnowledgeEntry,
  CreateTaskRequest,
  EscalationRule,
  EscalationCondition,
} from '@/types'

// =============================================================================
// ORCHESTRATOR CONFIGURATION
// =============================================================================

export interface OrchestratorConfig {
  maxConcurrentTasks: number
  defaultTimeout: number // minutes
  autoEscalateAfter: number // minutes without progress
  supervisorId: string
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  maxConcurrentTasks: 10,
  defaultTimeout: 60,
  autoEscalateAfter: 15,
  supervisorId: '', // Set on init
}

// =============================================================================
// ORCHESTRATOR CLASS
// =============================================================================

export class AgentOrchestrator {
  private config: OrchestratorConfig
  private agents: Map<string, Agent> = new Map()
  private taskQueue: Task[] = []
  private knowledgeBase: KnowledgeEntry[] = []

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  async initialize(agents: Agent[], knowledgeEntries: KnowledgeEntry[]) {
    // Register agents
    agents.forEach((agent) => {
      this.agents.set(agent.id, agent)
      if (agent.role === 'supervisor') {
        this.config.supervisorId = agent.id
      }
    })

    // Load knowledge base
    this.knowledgeBase = knowledgeEntries

    console.log(`[Orchestrator] Initialized with ${agents.length} agents and ${knowledgeEntries.length} knowledge entries`)
  }

  // ---------------------------------------------------------------------------
  // TASK MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Create a new task and add it to the queue
   */
  async createTask(request: CreateTaskRequest): Promise<Task> {
    const task: Task = {
      id: generateId(),
      type: request.type,
      title: request.title,
      description: request.description,
      status: 'queued',
      priority: request.priority || 'medium',
      assignedAgentId: null,
      supervisorId: this.config.supervisorId,
      clientId: request.clientId || null,
      clientName: null, // Will be populated from client data
      progress: 0,
      steps: [],
      currentStepIndex: 0,
      messages: [],
      pendingQuestion: null,
      output: null,
      templateId: request.templateId || null,
      similarTaskIds: [],
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      estimatedDuration: null,
    }

    // Find similar tasks for learning
    if (request.referenceTaskId) {
      task.similarTaskIds = [request.referenceTaskId]
    } else {
      task.similarTaskIds = await this.findSimilarTasks(task)
    }

    // Find relevant knowledge entries
    const relevantKnowledge = await this.findRelevantKnowledge(task)
    if (relevantKnowledge.length > 0) {
      // Attach knowledge context to task description
      task.description += `\n\n[Knowledge Context: ${relevantKnowledge.map(k => k.title).join(', ')}]`
    }

    this.taskQueue.push(task)
    await this.assignTask(task)

    return task
  }

  /**
   * Assign a task to the best available agent
   */
  private async assignTask(task: Task): Promise<void> {
    // First, let supervisor review and potentially assign
    const supervisor = this.agents.get(this.config.supervisorId)
    if (!supervisor) {
      throw new Error('No supervisor agent found')
    }

    // Find best worker for this task
    const bestAgent = this.findBestAgent(task)

    if (bestAgent) {
      task.assignedAgentId = bestAgent.id
      task.status = 'assigned'
      bestAgent.currentTaskId = task.id
      bestAgent.status = 'working'

      console.log(`[Orchestrator] Task ${task.id} assigned to ${bestAgent.name}`)
    } else {
      // No available agent, keep in queue
      console.log(`[Orchestrator] Task ${task.id} queued - no available agents`)
    }
  }

  /**
   * Find the best agent for a task based on capabilities and availability
   */
  private findBestAgent(task: Task): Agent | null {
    const requiredCapabilities = this.getRequiredCapabilities(task.type)

    const availableAgents = Array.from(this.agents.values())
      .filter((agent) => {
        // Must be a worker
        if (agent.role !== 'worker') return false
        // Must be idle
        if (agent.status !== 'idle') return false
        // Must have at least one matching capability
        return agent.capabilities.some((cap) => requiredCapabilities.includes(cap))
      })
      .sort((a, b) => {
        // Sort by: capability match count, then success rate
        const aMatch = a.capabilities.filter((c) => requiredCapabilities.includes(c)).length
        const bMatch = b.capabilities.filter((c) => requiredCapabilities.includes(c)).length
        if (aMatch !== bMatch) return bMatch - aMatch
        return b.stats.successRate - a.stats.successRate
      })

    return availableAgents[0] || null
  }

  /**
   * Get required capabilities for a task type
   */
  private getRequiredCapabilities(taskType: Task['type']): AgentCapability[] {
    const mapping: Record<Task['type'], AgentCapability[]> = {
      content_creation: ['content_writing', 'social_media'],
      seo_audit: ['seo_analysis', 'data_analysis'],
      competitor_analysis: ['competitor_analysis', 'data_analysis'],
      ads_campaign: ['ads_management', 'data_analysis'],
      social_media: ['social_media', 'content_writing'],
      email_marketing: ['content_writing', 'data_analysis'],
      mvp_creation: ['web_development', 'design'],
      client_analysis: ['client_research', 'data_analysis'],
      strategy_creation: ['strategy', 'data_analysis'],
      report_generation: ['data_analysis', 'content_writing'],
      custom: [],
    }
    return mapping[taskType] || []
  }

  // ---------------------------------------------------------------------------
  // ESCALATION
  // ---------------------------------------------------------------------------

  /**
   * Check if a task should be escalated based on rules
   */
  async checkEscalation(task: Task, agent: Agent): Promise<boolean> {
    const supervisor = this.agents.get(this.config.supervisorId) as Agent & { escalationRules?: EscalationRule[] }
    if (!supervisor?.escalationRules) return false

    for (const rule of supervisor.escalationRules) {
      if (this.matchesEscalationCondition(rule.condition, task, agent)) {
        await this.executeEscalation(rule, task, agent)
        return true
      }
    }

    return false
  }

  private matchesEscalationCondition(
    condition: EscalationCondition,
    task: Task,
    agent: Agent
  ): boolean {
    switch (condition.type) {
      case 'task_stuck':
        const stuckMinutes = task.startedAt
          ? (Date.now() - task.startedAt.getTime()) / 60000
          : 0
        return stuckMinutes > condition.durationMinutes && task.progress < 100

      case 'confidence_low':
        // Would check agent's confidence score
        return false

      case 'client_facing':
        return condition.always

      case 'manual':
        return task.status === 'needs_input'

      default:
        return false
    }
  }

  private async executeEscalation(
    rule: EscalationRule,
    task: Task,
    agent: Agent
  ): Promise<void> {
    console.log(`[Orchestrator] Escalating task ${task.id} - rule: ${rule.id}`)

    switch (rule.action.type) {
      case 'notify_human':
        // In real implementation, send notification
        task.status = 'needs_input'
        break

      case 'reassign_task':
        task.assignedAgentId = rule.action.toAgentId
        agent.currentTaskId = null
        agent.status = 'idle'
        break

      case 'pause_task':
        task.status = 'needs_input'
        agent.status = 'waiting'
        break

      case 'request_human_input':
        task.pendingQuestion = {
          id: generateId(),
          question: rule.action.question,
          context: '',
          options: null,
          askedAt: new Date(),
          askedBy: 'supervisor',
        }
        task.status = 'needs_input'
        break
    }
  }

  // ---------------------------------------------------------------------------
  // KNOWLEDGE BASE / LEARNING
  // ---------------------------------------------------------------------------

  /**
   * Find similar tasks for learning context
   */
  private async findSimilarTasks(task: Task): Promise<string[]> {
    // In real implementation, use vector similarity search
    return []
  }

  /**
   * Find relevant knowledge entries for a task
   */
  private async findRelevantKnowledge(task: Task): Promise<KnowledgeEntry[]> {
    // Filter by task type and capabilities
    return this.knowledgeBase.filter((entry) => {
      // Match by type
      if (task.type === 'content_creation' && entry.capabilities.includes('content_writing')) {
        return true
      }
      if (task.type === 'seo_audit' && entry.capabilities.includes('seo_analysis')) {
        return true
      }
      // Add more matching logic
      return false
    }).slice(0, 5)
  }

  /**
   * Add a new entry to knowledge base from completed task
   */
  async learnFromTask(task: Task): Promise<KnowledgeEntry | null> {
    if (task.status !== 'completed' || !task.output) {
      return null
    }

    // Create knowledge entry from successful task
    const entry: KnowledgeEntry = {
      id: generateId(),
      type: 'example',
      title: `${task.type}: ${task.title}`,
      description: task.description,
      tags: [task.type],
      capabilities: this.getRequiredCapabilities(task.type),
      industries: [], // Would be derived from client
      content: {
        exampleOutput: task.output.content,
        exampleFiles: task.output.files,
      },
      sourceTaskId: task.id,
      sourceClientId: task.clientId,
      createdByAgentId: task.assignedAgentId!,
      approvedByHuman: false,
      timesUsed: 0,
      successRate: 0,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.knowledgeBase.push(entry)
    console.log(`[Orchestrator] New knowledge entry created: ${entry.id}`)

    return entry
  }

  // ---------------------------------------------------------------------------
  // STATUS & QUERIES
  // ---------------------------------------------------------------------------

  getAgents(): Agent[] {
    return Array.from(this.agents.values())
  }

  getTaskQueue(): Task[] {
    return this.taskQueue
  }

  getActiveTasks(): Task[] {
    return this.taskQueue.filter(
      (t) => !['completed', 'cancelled', 'failed'].includes(t.status)
    )
  }

  getPendingQuestions(): Array<{ task: Task; question: NonNullable<Task['pendingQuestion']> }> {
    return this.taskQueue
      .filter((t) => t.pendingQuestion !== null)
      .map((t) => ({ task: t, question: t.pendingQuestion! }))
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let orchestratorInstance: AgentOrchestrator | null = null

export function getOrchestrator(): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator()
  }
  return orchestratorInstance
}
