import { WorkflowNode, WorkflowEdge } from './types';

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    {
        id: 'cot-reasoning',
        name: 'Chain of Thought',
        description: 'Breaks down a problem into reasoning steps before concluding.',
        nodes: [
            { id: '1', type: 'input', label: 'User Problem', data: { label: 'User Problem', output: 'How do planes fly?' }, position: { x: 100, y: 100 } },
            { id: '2', type: 'llm', label: 'Reasoning Step', data: { label: 'Reasoning Step', prompt: 'Analyze the following problem step-by-step. Do not give the answer yet, just list the physics principles involved.', modelId: 'gpt-4o' }, position: { x: 400, y: 100 } },
            { id: '3', type: 'llm', label: 'Conclusion', data: { label: 'Conclusion', prompt: 'Based on the reasoning above, provide a concise explanation for a 5-year old.', modelId: 'gpt-4o' }, position: { x: 700, y: 100 } },
            { id: '4', type: 'output', label: 'Final Answer', data: { label: 'Final Answer' }, position: { x: 1000, y: 100 } },
        ] as any,
        edges: [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' },
            { id: 'e3-4', source: '3', target: '4' },
        ]
    },
    {
        id: 'debate-club',
        name: 'Debate Club',
        description: 'Two agents debate a topic, then a judge decides.',
        nodes: [
            { id: '1', type: 'input', label: 'Debate Topic', data: { label: 'Debate Topic', output: 'Is AI good for humanity?' }, position: { x: 100, y: 200 } },
            { id: '2', type: 'llm', label: 'Proponent', data: { label: 'Proponent', prompt: 'Argue IN FAVOR of the following topic. Be passionate.', modelId: 'claude-3-opus' }, position: { x: 400, y: 100 } },
            { id: '3', type: 'llm', label: 'Opponent', data: { label: 'Opponent', prompt: 'Argue AGAINST the following topic. Be skeptical.', modelId: 'gpt-4-turbo' }, position: { x: 400, y: 300 } },
            { id: '4', type: 'llm', label: 'Judge', data: { label: 'Judge', prompt: 'Review the arguments from both sides (Proponent and Opponent). Decide who won and explain why.', modelId: 'gpt-4o' }, position: { x: 700, y: 200 } },
            { id: '5', type: 'output', label: 'Verdict', data: { label: 'Verdict' }, position: { x: 1000, y: 200 } },
        ] as any,
        edges: [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e1-3', source: '1', target: '3' },
            { id: 'e2-4', source: '2', target: '4' },
            { id: 'e3-4', source: '3', target: '4' },
            { id: 'e4-5', source: '4', target: '5' },
        ]
    }
];
