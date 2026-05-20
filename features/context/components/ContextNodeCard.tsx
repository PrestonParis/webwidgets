'use client';

import type { ContextNode } from '@/features/context/types/context';
import { NODE_COLORS, NODE_SIZES } from '@/features/context/lib/graphBuilder';

const TYPE_EMOJI: Record<string, string> = {
    profile: '👤',
    goal: '🎯',
    widget: '🧩',
    integration: '🔗',
    query_gist: '💬',
    insight: '💡',
};

interface Props {
    node: ContextNode;
    selected: boolean;
    onClick: (entityId: string) => void;
}

export function ContextNodeCard({ node, selected, onClick }: Props) {
    const size = NODE_SIZES[node.entryType] ?? 40;
    const color = NODE_COLORS[node.entryType] ?? '#6b7280';
    const emoji = TYPE_EMOJI[node.entryType] ?? '●';

    return (
        <button
            type="button"
            onClick={() => onClick(node.entityId)}
            style={{
                position: 'absolute',
                left: node.x - size / 2,
                top: node.y - size / 2,
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: selected ? color : `${color}22`,
                border: `2px solid ${color}`,
                boxShadow: selected ? `0 0 0 3px ${color}44` : undefined,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                zIndex: selected ? 10 : 1,
                padding: 0,
            }}
            title={node.label}
            aria-label={`${node.entryType}: ${node.label}`}
        >
            <span style={{ fontSize: size > 42 ? 18 : 14 }}>{emoji}</span>
            <span
                style={{
                    position: 'absolute',
                    top: size + 4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    fontSize: 11,
                    fontWeight: selected ? 600 : 400,
                    color: selected ? color : '#6b7280',
                    pointerEvents: 'none',
                    maxWidth: 100,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                {node.label}
            </span>
        </button>
    );
}
