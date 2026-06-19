import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  Tooltip,
} from 'recharts';
import { useDashboard } from '../state/store.jsx';
import { rankCompanies } from '../lib/aggregate.js';
import { Card, SegToggle, ChartTooltip, Empty, ACCENT, ACCENT_2, PALETTE } from './ui.jsx';
import { formatKRW, formatInt } from '../lib/format.js';

// 공급기업 랭킹 — 가로 막대, 금액/건수 토글, TOP15, 막대 클릭 시 전역 필터
export default function CompanyRanking() {
  const { filtered, filters, toggleFilter, countByContract } = useDashboard();
  const [by, setBy] = useState('amount');

  const data = useMemo(
    () => rankCompanies(filtered, by, 15, countByContract),
    [filtered, by, countByContract]
  );

  return (
    <Card
      title="공급기업 랭킹 TOP 15"
      subtitle="막대 클릭 → 해당 기업으로 필터"
      action={
        <SegToggle
          value={by}
          onChange={setBy}
          options={[
            { value: 'amount', label: '금액' },
            { value: 'count', label: '건수' },
          ]}
        />
      }
    >
      {data.length === 0 ? (
        <Empty />
      ) : (
        <div className="mount-anim" style={{ height: Math.max(280, data.length * 26) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 56, bottom: 4, left: 8 }}
              barCategoryGap={5}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v.length > 9 ? v.slice(0, 9) + '…' : v)}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                content={
                  <ChartTooltip
                    formatter={(v) => (by === 'amount' ? formatKRW(v) : formatInt(v) + '건')}
                  />
                }
              />
              <Bar
                dataKey={by}
                radius={[0, 5, 5, 0]}
                cursor="pointer"
                onClick={(d) => toggleFilter('company', d.name)}
                isAnimationActive
                animationDuration={600}
                name={by === 'amount' ? '계약금액' : '건수'}
              >
                {data.map((d, i) => (
                  <Cell
                    key={i}
                    fill={
                      filters.company === d.name
                        ? ACCENT_2
                        : PALETTE[i % PALETTE.length]
                    }
                    opacity={filters.company && filters.company !== d.name ? 0.35 : 1}
                  />
                ))}
                <LabelList
                  dataKey={by}
                  position="right"
                  formatter={(v) => (by === 'amount' ? formatKRW(v) : formatInt(v))}
                  style={{ fill: 'var(--muted)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
