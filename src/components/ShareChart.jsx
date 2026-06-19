import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useDashboard } from '../state/store.jsx';
import { shareByDimension } from '../lib/aggregate.js';
import { Card, SegToggle, ChartTooltip, Empty, PALETTE } from './ui.jsx';
import { formatKRW } from '../lib/format.js';

// 품목/서비스별 비중 — 도넛. 축: 소관구분/기업구분/계약방법 토글. 조각 클릭 → 필터
const DIMENSIONS = [
  { value: 'gov', label: '소관구분', filterKey: 'gov' },
  { value: 'ctype', label: '기업구분', filterKey: 'ctype' },
  { value: 'method', label: '계약방법', filterKey: 'method' },
];

export default function ShareChart() {
  const { filtered, toggleFilter, filters } = useDashboard();
  const [dim, setDim] = useState('gov');

  const conf = DIMENSIONS.find((d) => d.value === dim);
  const data = useMemo(() => shareByDimension(filtered, dim, 'amount'), [filtered, dim]);
  const total = data.reduce((s, d) => s + d.amount, 0);
  const activeVal = filters[conf.filterKey];

  return (
    <Card
      title="품목/서비스별 비중"
      subtitle="금액 기준 · 조각 클릭 → 필터"
      action={<SegToggle value={dim} onChange={setDim} options={DIMENSIONS} />}
    >
      {data.length === 0 ? (
        <Empty />
      ) : (
        <div className="mount-anim relative" style={{ minHeight: 300 }}>
          {/* 중앙 합계 라벨 (도넛 구멍 위에 절대배치) */}
          <div className="pointer-events-none absolute left-1/2 top-[130px] z-10 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-[11px] text-muted">총 금액</div>
            <div className="text-lg font-extrabold text-text tnum">{formatKRW(total)}</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={100}
                paddingAngle={1.5}
                cursor="pointer"
                onClick={(d) => toggleFilter(conf.filterKey, d.name)}
                animationDuration={600}
              >
                {data.map((d, i) => (
                  <Cell
                    key={i}
                    fill={PALETTE[i % PALETTE.length]}
                    opacity={activeVal && activeVal !== d.name ? 0.35 : 1}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(v) => `${formatKRW(v)} (${((v / total) * 100).toFixed(1)}%)`}
                  />
                }
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: 11, color: 'var(--muted)' }}
                formatter={(value) => <span style={{ color: 'var(--muted)' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
