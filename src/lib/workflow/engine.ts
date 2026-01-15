import { WorkflowNode, WorkflowEdge } from './types';

export class WorkflowEngine {
   private nodes: Map<string, WorkflowNode>;
   private edges: WorkflowEdge[];
   private executionState: Map<string, any> = new Map(); // Node outputs

   constructor(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
      this.nodes = new Map(nodes.map(n => [n.id, n]));
      this.edges = edges;
   }

   async runNode(nodeId: string, runLLM: (prompt: string, modelId: string) => Promise<string>) {
      const node = this.nodes.get(nodeId);
      if (!node) throw new Error(`Node ${nodeId} not found`);

      // 1. Resolve inputs
      const inputEdges = this.edges.filter(e => e.target === nodeId);
      let resolvedPrompt = node.data.prompt as string || '';

      // Simple variable substitution: {{sourceNodeId}}
      // In a real engine, we'd have dynamic inputs. flow-based programming.
      // For this MVP, we append the outputs of previous nodes to the prompt? 
      // Or we replace {{variable}}.

      for (const edge of inputEdges) {
         const sourceOutput = this.executionState.get(edge.source);
         if (sourceOutput) {
            // If prompt contains placeholders, replace them? 
            // Or just append context?
            // Let's strict append for now:
            resolvedPrompt = `${resolvedPrompt}\n\nInput Context:\n${sourceOutput}`;
         }
      }

      // 2. Execute Logic
      let output = '';
      if (node.type === 'llm') {
         if (!resolvedPrompt) throw new Error("Empty prompt");
         output = await runLLM(resolvedPrompt, (node.data.modelId as string) || 'gpt-4o');
      } else if (node.type === 'input') {
         output = (node.data.output as string) || ''; // Pre-filled or user input
      } else if (node.type === 'output') {
         output = resolvedPrompt; // Pass through
      }

      // 3. Save Output
      this.executionState.set(nodeId, output);
      return output;
   }

   getExecutionOrder(): string[] {
      // Topological sort (simple version)
      // Find nodes with 0 inputs
      const visited = new Set<string>();
      const order: string[] = [];

      // In a real graph, we'd detect cycles or use a proper library.
      // Hacky topo sort:
      // ...
      // Let's assume linear graph for simplicity of this snippet, or BFS.

      const queue: string[] = [];
      // Start nodes
      this.nodes.forEach(node => {
         const isTarget = this.edges.some(e => e.target === node.id);
         if (!isTarget) queue.push(node.id);
      });

      while (queue.length > 0) {
         const current = queue.shift()!;
         if (visited.has(current)) continue;

         visited.add(current);
         order.push(current);

         // Add neighbors if their dependencies are met
         const neighbors = this.edges.filter(e => e.source === current).map(e => e.target);
         neighbors.forEach(n => {
            // Check if all inputs for n are visited
            const inputs = this.edges.filter(e => e.target === n).map(e => e.source);
            if (inputs.every(i => visited.has(i))) {
               queue.push(n);
            }
         });
      }

      return order;
   }
}
