import { useMemo } from "react";
import type { Relation } from "@/hooks/useRelations";

interface DocNode {
  id: string;
  title: string;
}

interface Props {
  documents: DocNode[];
  relations: Relation[];
}

export function RelationshipGraph({ documents, relations }: Props) {
  const nodes = useMemo(() => {
    if (documents.length === 0) return [] as Array<DocNode & { x: number; y: number }>;
    const radius = 180;
    const centerX = 220;
    const centerY = 200;
    return documents.map((doc, index) => {
      const angle = (index / documents.length) * Math.PI * 2;
      return {
        ...doc,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
  }, [documents]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; title: string }>();
    nodes.forEach((n) => map.set(n.id, { x: n.x, y: n.y, title: n.title }));
    return map;
  }, [nodes]);

  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents to visualize.</p>;
  }

  return (
    <div className="border rounded-lg p-4 overflow-auto">
      <svg viewBox="0 0 440 400" className="w-full h-[400px]">
        {relations.map((rel) => {
          const source = nodeMap.get(rel.sourceDocId);
          const target = nodeMap.get(rel.targetDocId);
          if (!source || !target) return null;
          return (
            <line
              key={rel.id}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="hsl(var(--border))"
              strokeWidth={1.5}
            />
          );
        })}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={16}
              fill="hsl(var(--primary))"
              stroke="white"
              strokeWidth={2}
            />
            <text
              x={node.x}
              y={node.y + 28}
              textAnchor="middle"
              fontSize={10}
              fill="hsl(var(--foreground))"
            >
              {node.title.length > 14 ? node.title.slice(0, 14) + "…" : node.title}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
