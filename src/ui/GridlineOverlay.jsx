import React from 'react';
import { tokens } from './designTokens.js';

const ACCENT = tokens.accent || '#3B82F6';
const RAIL_COLOR = ACCENT;
const FAINT_RAIL = 'rgba(59,130,246,0.25)';
const CONNECTOR_COLOR = 'rgba(59,130,246,0.5)';
const LABEL_BG = 'rgba(59,130,246,0.1)';

/**
 * SVG overlay that visualises anchor chains within a section.
 *
 * For each element with an anchorId:
 *   - Dashed rail at element top (strong)
 *   - Faint dashed rail at anchor bottom (source)
 *   - Vertical connector arrow
 *   - Gap label
 *
 * For elements without an anchor: single rail at their top.
 */
export function GridlineOverlay({ positions, sectionHeight, sectionWidth, elements }) {
  if (!positions || positions.length === 0) return null;

  const byId = new Map(positions.map(p => [p.id, p]));
  const elMap = new Map((elements || []).map(el => [el.id, el]));

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: sectionWidth,
        height: sectionHeight,
        pointerEvents: 'none',
        zIndex: 50,
        overflow: 'visible',
      }}
    >
      <defs>
        <marker
          id="grid-arrow"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill={CONNECTOR_COLOR} />
        </marker>
      </defs>

      {positions.map((pos) => {
        const hasAnchor = pos.anchorId && byId.has(pos.anchorId);
        const el = elMap.get(pos.id);
        const elLabel = el?.name || pos.id;

        if (hasAnchor) {
          const anchor = byId.get(pos.anchorId);
          const anchorEl = elMap.get(pos.anchorId);
          const anchorLabel = anchorEl?.name || pos.anchorId;
          const anchorBottom = anchor.y + anchor.h;
          const gap = Math.round(pos.y - anchorBottom);
          const midX = Math.min(pos.x, anchor.x) + Math.abs(pos.x - anchor.x) / 2 + Math.min(pos.w, anchor.w) / 2;
          const connX = Math.max(8, Math.min(sectionWidth - 8, midX));

          return (
            <g key={pos.id}>
              {/* Rail at element top */}
              <line
                x1={pos.x}
                y1={pos.y}
                x2={pos.x + pos.w}
                y2={pos.y}
                stroke={RAIL_COLOR}
                strokeWidth={1}
                strokeDasharray="4 3"
                opacity={0.6}
              />
              {/* Faint rail at anchor bottom */}
              <line
                x1={anchor.x}
                y1={anchorBottom}
                x2={anchor.x + anchor.w}
                y2={anchorBottom}
                stroke={FAINT_RAIL}
                strokeWidth={1}
                strokeDasharray="3 4"
                opacity={0.4}
              />
              {/* Vertical connector */}
              <line
                x1={connX}
                y1={anchorBottom + 2}
                x2={connX}
                y2={pos.y - 2}
                stroke={CONNECTOR_COLOR}
                strokeWidth={1}
                markerEnd="url(#grid-arrow)"
              />
              {/* Gap label */}
              {gap > 12 && (
                <g>
                  <rect
                    x={connX + 4}
                    y={(anchorBottom + pos.y) / 2 - 8}
                    width={Math.max(36, `${elLabel} ↑ ${anchorLabel} · ${gap}px`.length * 4.5)}
                    height={16}
                    rx={3}
                    fill={LABEL_BG}
                  />
                  <text
                    x={connX + 8}
                    y={(anchorBottom + pos.y) / 2 + 3}
                    fontSize={9}
                    fontFamily="monospace"
                    fill={ACCENT}
                    opacity={0.85}
                  >
                    {`${elLabel} ↑ ${anchorLabel} · ${gap}px`}
                  </text>
                </g>
              )}
            </g>
          );
        }

        return (
          <g key={pos.id}>
            <line
              x1={pos.x}
              y1={pos.y}
              x2={pos.x + pos.w}
              y2={pos.y}
              stroke={FAINT_RAIL}
              strokeWidth={1}
              strokeDasharray="6 4"
              opacity={0.35}
            />
            <text
              x={pos.x + pos.w + 4}
              y={pos.y + 3}
              fontSize={8}
              fontFamily="monospace"
              fill={ACCENT}
              opacity={0.5}
            >
              {Math.round(pos.y)}px
            </text>
          </g>
        );
      })}
    </svg>
  );
}
