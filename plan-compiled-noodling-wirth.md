# Cowerk Plugin - Comprehensive Implementation Plan

## Overview

**Cowerk** is a full-featured Claude Code plugin that merges multi-model AI orchestration with autonomous loop execution capabilities. It combines:

- **Cowerk's multi-model orchestration** (8 providers, 10 collaboration patterns)
- **Ralph TUI's autonomous loop engine** (session persistence, rate limiting, fallback agents)
- **Rich TUI experience** (real-time output, progress tracking, keyboard controls)

**Activation**: `/cowerk`, `/cowerk-loop`, `/ralph`

## Design Concepts Borrowed from Ralph TUI

### 1. Execution Engine Architecture

- **State Machine**: `idle` → `running` → `stopping` (with `pausing` → `paused` states)
- **Five-Step Loop**: Task selection → Prompt construction → Agent execution → Completion detection → Iteration
- **Rate Limit Handling**: Exponential backoff (base × 3^attempt), fallback agent switching
- **Primary Agent Recovery**: Test recovery between iterations when rate limit lifts
- **Error Strategies**: retry (with max retries), skip (mark skipped, continue), abort (halt immediately)
- **Event System**: `engine:started`, `iteration:started`, `task:selected`, `agent:output`, `iteration:completed`

### 2. Session Persistence

- **File-Based State**: JSON serialization with timestamps for reconstruction
- **Checkpointing**: Save state after each iteration for crash recovery
- **Lock Management**: PID-based single-instance enforcement with stale lock detection
- **Pause/Resume**: Graceful interruption with `resumeSession()` reacquiring locks

### 3. TUI Design System

- **Multi-Panel Layout**: Left panel (30-50 width), right panel (min 40 chars), progress dashboard (8 units when active)
- **Task Status Styling**: 7 states with color-symbol pairs (done/green✓, active/blue→, blocked/red✗, etc.)
- **Keyboard Navigation**: Vim bindings (j/k), numeric tabs (1-9), single-key triggers (s=start, p=pause, q=quit)
- **Visual Feedback**: Unicode symbols, progress indicators, status bars

### 4. Configuration Schema

- **Agent Config**: name, plugin, command, defaultFlags, timeout, fallbackAgents, rateLimitHandling
- **Error Handling**: strategy (retry/skip/abort), maxRetries, retryDelayMs, continueOnNonZeroExit
- **Rate Limit Config**: enabled, maxRetries, baseBackoffMs, recoverPrimaryBetweenIterations
- **Subagent Tracing**: levels (off, minimal, moderate, full)
- **Sandbox Support**: mode (auto, bwrap, sandbox-exec, off), network, allowPaths

### 5. Template System

- **Handlebars-Based**: Dynamic prompt rendering with variable injection
- **Template Types**: DEFAULT, BEADS, BEADS_BV, JSON templates
- **Multi-Path Resolution**: project-local, global, custom template locations
- **Context Building**: `buildTemplateVariables()` + `buildTemplateContext()` → `renderPrompt()`

### 6. Output Parsing

- **JSONL Processing**: Extract `result` field from Claude Code events, filter metadata
- **Streaming Parser**: Buffer chunks until newlines, parse incrementally
- **Memory Management**: 100KB output cap, trim older content
- **Subagent Tracking**: Map IDs to hierarchical state, calculate nesting depth

### 7. Remote Management (Future)

- **WebSocket Communication**: Real-time peer connections
- **Token Authentication**: Two-tier (server tokens 90-day, connection tokens 24-hour)
- **Audit Logging**: Activity tracking for compliance
- **Instance Manager**: Multi-instance coordination across machines

## Core Capabilities (Merged)

1. **Multi-Model Orchestration** - 8 providers, 10 collaboration patterns
2. **Autonomous Loop Execution** - Ralph-style iteration with completion promises
3. **Session Persistence** - Checkpointing, pause/resume, crash recovery
4. **Rate Limit Management** - Exponential backoff, fallback agents, primary recovery
5. **PRD Task Management** - JSON-based task queues with dependencies
6. **Rich TUI** - Real-time output, progress tracking, vim-style navigation
7. **Template System** - Handlebars prompts with context injection
8. **Tmux Integration** - Visual workspace for parallel execution

---

## Plugin Structure

```
~/.claude/plugins/cowerk/
├── .claude-plugin/
│   └── plugin.json                    # Plugin manifest
├── README.md                          # Plugin documentation
│
├── commands/
│   ├── cowerk.md                      # /cowerk - Multi-model orchestration
│   ├── cowerk-loop.md                 # /cowerk-loop - Autonomous loop + multi-model
│   ├── ralph.md                       # /ralph - Alias for cowerk-loop
│   ├── cowerk-status.md               # /cowerk-status - Session/progress view
│   ├── cowerk-tasks.md                # /cowerk-tasks - PRD task management
│   ├── cowerk-cancel.md               # /cowerk-cancel - Cancel active loop
│   └── cowerk-config.md               # /cowerk-config - Configure settings
│
├── agents/
│   ├── orchestrator-agent.md          # Multi-model coordination agent
│   ├── task-planner.md                # Decomposes tasks into subtasks
│   └── pattern-selector.md            # Recommends collaboration patterns
│
├── skills/
│   ├── multi-model-orchestration.md   # Core orchestration skill (from SKILL.md)
│   ├── loop-execution.md              # Ralph-style loop execution
│   └── task-management.md             # PRD task management skill
│
├── hooks/
│   ├── hooks.json                     # Hook configuration
│   ├── stop-hook.sh                   # Stop hook for loop control
│   └── session-start-hook.sh          # Session initialization
│
├── templates/
│   ├── default.hbs                    # Default prompt template
│   ├── multi-model.hbs                # Multi-model collaboration template
│   ├── iteration.hbs                  # Loop iteration template
│   └── task-queue.hbs                 # PRD task template
│
├── lib/
│   ├── __init__.py
│   ├── adapters/                      # Provider adapters (from skill)
│   │   ├── __init__.py
│   │   ├── base_adapter.py
│   │   ├── claude_adapter.py
│   │   ├── gemini_adapter.py
│   │   ├── codex_adapter.py
│   │   ├── ollama_adapter.py
│   │   ├── openrouter_adapter.py
│   │   ├── groq_adapter.py
│   │   ├── grok_adapter.py
│   │   └── cerebras_adapter.py
│   ├── orchestrator.py                # Multi-model orchestration engine
│   ├── context_extractor.py           # Context honing
│   ├── file_tree_generator.py         # Codebase structure
│   ├── tui.py                         # Enhanced TUI (rich/textual)
│   ├── tmux_manager.py                # Tmux integration
│   ├── engine.py                      # NEW: Execution engine (Ralph-style)
│   ├── session_manager.py             # NEW: Session persistence
│   ├── task_manager.py                # NEW: PRD task tracking
│   ├── template_engine.py             # NEW: Handlebars-style templates
│   ├── output_parser.py               # NEW: Streaming output parser
│   └── rate_limiter.py                # NEW: Rate limit handling
│
├── scripts/
│   ├── setup-cowerk.sh                # Initialize cowerk session
│   ├── setup-loop.sh                  # Initialize loop state
│   └── check-providers.sh             # Verify provider availability
│
├── assets/
│   ├── hierarchy_diagrams/            # ASCII pattern diagrams
│   └── context_template.md            # Subagent context template
│
├── references/
│   ├── collaboration_patterns.md      # Pattern definitions
│   ├── provider_docs.md               # Provider API docs
│   └── context_templates.md           # Context formatting
│
└── requirements.txt                   # Python dependencies
```

---

## Implementation Phases

### Phase 1: Plugin Foundation (Migrate Existing Skill)

- [ ] Create plugin directory structure at `~/.claude/plugins/cowerk/`
- [ ] Create `plugin.json` manifest
- [ ] Migrate existing cowerk skill files from `~/.claude/skills/cowerk/` to `lib/`
- [ ] Update import paths for plugin structure
- [ ] Create basic commands: `/cowerk`, `/cowerk-status`, `/cowerk-cancel`
- [ ] Test that existing orchestration functionality works

### Phase 2: Execution Engine (Ralph-Style Loop)

- [ ] Implement `lib/engine.py` with state machine (idle → running → paused → stopping)
- [ ] Five-step execution loop: select → build prompt → execute → detect → iterate
- [ ] Implement `lib/session_manager.py` for persistence
  - Session state JSON serialization
  - Checkpointing after each iteration
  - Lock management with PID enforcement
  - Stale lock detection and cleanup
  - Pause/resume mechanics
- [ ] Create Stop hook (`hooks/stop-hook.sh`) for loop control
- [ ] Implement `/cowerk-loop` command with multi-model support

### Phase 3: Rate Limit & Error Handling

- [ ] Implement `lib/rate_limiter.py`
  - Exponential backoff (base × 3^attempt)
  - Fallback agent switching when primary exhausted
  - Primary agent recovery between iterations
- [ ] Add error handling strategies: retry, skip, abort
- [ ] Track per-task retry counts
- [ ] Agent switching with timestamps and reasons

### Phase 4: Template System

- [ ] Implement `lib/template_engine.py` (Handlebars-style)
- [ ] Create template types: default, multi-model, iteration, task-queue
- [ ] Template variable injection from context
- [ ] Multi-path template resolution (project, global, custom)
- [ ] Create `templates/` directory with `.hbs` files

### Phase 5: PRD Task Management

- [ ] Implement `lib/task_manager.py`
- [ ] PRD JSON format: id, title, description, priority, dependencies, pattern, completion_criteria
- [ ] Task selection respecting dependencies
- [ ] `/cowerk-tasks` command: create, list, update, load, export
- [ ] Integration with loop engine for task queue processing

### Phase 6: Enhanced TUI

- [ ] Upgrade `lib/tui.py` with Ralph-style features
- [ ] Multi-panel layout (left panel, right panel, dashboard)
- [ ] Task status styling (7 states with color-symbol pairs)
- [ ] Keyboard navigation (vim bindings, numeric tabs, single-key triggers)
- [ ] Real-time progress display and status bar
- [ ] Live iteration output streaming
- [ ] Implement `lib/output_parser.py` for JSONL streaming

### Phase 7: Commands & Agents

- [ ] Create all command files in `commands/`
- [ ] Create agent definitions in `agents/`
- [ ] Convert SKILL.md to skills in `skills/`
- [ ] Hook configuration in `hooks/hooks.json`
- [ ] Script wrappers in `scripts/`

### Phase 8: Testing & Documentation

- [ ] Test each command works correctly
- [ ] Test loop execution with completion promises
- [ ] Test multi-model orchestration within loops
- [ ] Test session persistence and recovery
- [ ] Test rate limit handling
- [ ] Update README.md with full documentation

---

## Key New Components

### 1. Execution Engine (`lib/engine.py`)

```python
class ExecutionEngine:
    """
    Ralph-style execution engine with state machine and multi-model support.
    """

    # State machine
    status: EngineStatus  # idle, running, pausing, paused, stopping

    # Main loop methods
    async def start(self, task: str, config: EngineConfig) -> None
    async def pause(self) -> None
    async def resume(self) -> None
    async def stop(self) -> None

    # Five-step iteration
    async def _execute_iteration(self) -> IterationResult:
        task = await self._select_task()           # 1. Select
        prompt = await self._build_prompt(task)    # 2. Build prompt
        result = await self._execute_agents()      # 3. Execute (with multi-model)
        complete = await self._detect_completion() # 4. Detect
        await self._handle_iteration_end()         # 5. Iterate/stop

    # Event emission
    def emit(self, event: str, data: dict) -> None
```

### 2. Session Manager (`lib/session_manager.py`)

```python
@dataclass
class CoworkSession:
    session_id: str
    status: SessionStatus
    pattern: CollaborationPattern
    task: str
    iteration: int
    max_iterations: int
    completion_promise: Optional[str]
    created_at: datetime
    updated_at: datetime

    # Loop-specific
    loop_enabled: bool
    multi_model_per_iteration: bool
    fallback_agents: list[str]

    # Rate limit tracking
    rate_limited_agents: dict[str, datetime]
    current_agent: str
    agent_switch_history: list[AgentSwitch]

class SessionManager:
    def create_session(self, config: SessionConfig) -> CoworkSession
    def load_session(self, session_id: str) -> Optional[CoworkSession]
    def save_checkpoint(self, session: CoworkSession) -> None
    def acquire_lock(self, session_id: str) -> bool
    def release_lock(self, session_id: str) -> None
    def detect_stale_lock(self, session_id: str) -> bool
    def recover_session(self, session_id: str) -> CoworkSession
```

### 3. Rate Limiter (`lib/rate_limiter.py`)

```python
class RateLimiter:
    """Handles rate limits with exponential backoff and fallback agents."""

    def detect_rate_limit(self, output: str) -> bool
    def get_backoff_delay(self, attempt: int) -> float  # base × 3^attempt
    def switch_to_fallback(self, current: str, fallbacks: list[str]) -> Optional[str]
    async def attempt_primary_recovery(self, primary: str) -> bool
```

### 4. Configuration Schema

```python
@dataclass
class CoworkConfig:
    # Agent settings
    default_agent: str = "claude"
    fallback_agents: list[str] = field(default_factory=lambda: ["gemini", "codex"])

    # Loop settings
    max_iterations: int = 50
    iteration_delay_ms: int = 0
    completion_promise: Optional[str] = None

    # Multi-model settings
    default_pattern: CollaborationPattern = CollaborationPattern.SOLO_QUERY
    multi_model_per_iteration: bool = False

    # Error handling
    error_strategy: str = "retry"  # retry, skip, abort
    max_retries: int = 3
    retry_delay_ms: int = 1000

    # Rate limit handling
    rate_limit_enabled: bool = True
    rate_limit_max_retries: int = 5
    rate_limit_base_backoff_ms: int = 5000
    recover_primary_between_iterations: bool = True

    # Subagent tracing
    subagent_tracing_level: str = "moderate"  # off, minimal, moderate, full
```

---

## Collaboration Patterns (10 Total)

**Core Patterns:**

1. **Solo Query** - Single model, simple Q&A
2. **Debate (2v1)** - Two agents debate, one reviews
3. **Team Collab (3)** - Three agents collaborate with voting
4. **Chain Review** - Sequential processing with review gates

**Advanced Patterns:** 5. **Devil's Advocate** - Proposer → Critic → Synthesizer flow 6. **Expert Panel** - Specialists weigh in, consolidator merges 7. **Iterative Refinement** - Draft → Improve → Loop N times 8. **Red Team / Blue Team** - Builder vs Attacker, Arbiter decides 9. **Consensus Building** - Iterate until models converge 10. **Hierarchical Decomposition** - Manager → Specialists → Assembler

---

## Collaboration Flow Example

```
User invokes /cowork
         │
         ▼
┌─────────────────────┐
│  Context Extraction │ ◄── Summarize conversation + last N prompts
│  + File Tree Gen    │     + codebase structure
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Select Hierarchy   │ ◄── TUI with ASCII previews
│  (Team Collab 3)    │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Configure Params    │ ◄── Max iterations, completion promise
│ per step            │     review model selection
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Add Steps?          │ ◄── +thinking, +review, +planning, done
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│   Execute Flow      │
│                     │
│  ┌───┐ ┌───┐ ┌───┐ │
│  │ G │ │ G │ │ C │ │  ◄── Gemini debate, Codex review
│  └─┬─┘ └─┬─┘ └─┬─┘ │
│    └──┬──┘     │   │
│       ▼        │   │
│   ┌───────┐    │   │
│   │Review │◄───┘   │
│   └───┬───┘        │
│       ▼            │
│  ┌─────────┐       │
│  │ Voting  │       │  ◄── Disagreement triggers vote
│  │ (GPT×3) │       │
│  └────┬────┘       │
│       ▼            │
│  ┌─────────┐       │
│  │ Final   │       │  ◄── Gemini Flash consolidates
│  │ Consol. │       │
│  └─────────┘       │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Return to Spawning  │ ◄── Final answer back to Claude Code
│ Claude Code         │
└─────────────────────┘
```

---

## Verification Plan

1. **Unit Tests**: Each adapter can connect and query its provider
2. **Integration Test**: Full flow with mock providers
3. **Manual Test**: Run `/cowork` and execute a simple debate pattern
4. **Edge Cases**: Handle provider failures, timeouts, disagreements

---

## Critical Files to Create (Phase 1)

| File                         | Purpose                                               |
| ---------------------------- | ----------------------------------------------------- |
| `.claude-plugin/plugin.json` | Plugin manifest with commands, agents, hooks          |
| `commands/cowerk.md`         | Main `/cowerk` command                                |
| `commands/cowerk-loop.md`    | `/cowerk-loop` autonomous execution command           |
| `commands/cowerk-status.md`  | `/cowerk-status` session view                         |
| `commands/cowerk-cancel.md`  | `/cowerk-cancel` stop execution                       |
| `lib/orchestrator.py`        | Multi-model orchestration engine (migrate from skill) |
| `lib/engine.py`              | Ralph-style execution engine (NEW)                    |
| `lib/session_manager.py`     | Session persistence (NEW)                             |
| `lib/rate_limiter.py`        | Rate limit handling (NEW)                             |
| `hooks/stop-hook.sh`         | Stop hook for loop control                            |

## Plugin Location

The plugin will be created at: `~/.claude/plugins/cowerk/`

Existing skill files at `~/.claude/skills/cowerk/` will be migrated to the plugin's `lib/` directory.
