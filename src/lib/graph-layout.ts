import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';
import { UIMessage } from 'ai';

const NODE_WIDTH = 250;
const NODE_HEIGHT = 80;

export const getLayoutedElements = (
    messages: UIMessage[],
    direction = 'TB'
): { nodes: Node[]; edges: Edge[] } => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: direction });

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Simple linear chain for now, but prepared for branching data structure later
    messages.forEach((msg, index) => {
        const node: Node = {
            id: msg.id,
            position: { x: 0, y: 0 },
            data: { label: msg },
            type: 'messageNode' // Custom node type
        };
        nodes.push(node);
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });

        // Link to previous message if exists
        if (index > 0) {
            const prevMsg = messages[index - 1];
            const edge: Edge = {
                id: `e${prevMsg.id}-${msg.id}`,
                source: prevMsg.id,
                target: msg.id,
                animated: true,
                style: { stroke: '#64748b' }
            };
            edges.push(edge);
            dagreGraph.setEdge(edge.source, edge.target);
        }
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - NODE_WIDTH / 2,
                y: nodeWithPosition.y - NODE_HEIGHT / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};
