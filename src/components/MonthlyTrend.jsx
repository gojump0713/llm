import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
  Cell,
} from 'recharts';
import { useDashboard } from '../state/store.jsx';
import { monthlyTrend } from '../lib/aggregate.js';
import { Card, ChartTooltip, Empty, ACCENT, ACCENT_2 } from './ui.jsx';
import { formatKRW, formatInt, monthLabel } from '../lib/format.js';

// 월별 조달 추이 — 막대(금액) + 라인(건수, 보조축), 브러시로 기간 선택
export default function MonthlyTrend() {
  const { filtered, countByContract, setFilter } = useDashboard();
  const data = useMemo(() => monthlyTrend(filtered, countByContract), [filtered, countByContract]);

  // 브러시로 선택한 구간을 전역 기간 필터로 반영
  function onBrush(range) {
    if (!range || range.startIndex == null) return;
    const s = data[range.startIndex];
    const e = data[range.endIndex];
    if (!s || !e) return;
    setFilter('dateFrom', s.month.replace('-', '') + '01');
    setFilter('dateTo', e.month.replace('-', '') + '31');
  }

  return (
    <Card title="월별 조달 추이" subtitle="막대=계약금액 · 라인=건수 · 하단 브러시로 기간 선택">
      {data.length === 0 ? (
        <Empty />
      ) : (
        <div className="mount-anim" style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
              <CartesianGrid stroke="var(--grid)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={monthLabel}
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                yAxisId="amt"
                tickFormatter={(v) => formatKRW(v)}
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <YAxis
                yAxisId="cnt"
                orientation="right"
                tickFormatter={(v) => formatInt(v)}
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                labelFormatter={monthLabel}
                content={
                  <ChartTooltip
                    formatter={(v, p) =>
                      p.dataKey === 'amount' ? formatKRW(v) : formatInt(v) + '건'
                    }
                  />
                }
              />
              <Bar yAxisId="amt" dataKey="amount" name="계약금액" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {data.map((_, i) => (
                  <Cell key={i} fill={ACCENT} fillOpacity={0.85} />
                ))}
              </Bar>
              <Line
                yAxisId="cnt"
                type="monotone"
                dataKey="count"
                name="건수"
                stroke={ACCENT_2}
                strokeWidth={2.5}
                dot={{ r: 3, fill: ACCENT_2 }}
                activeDot={{ r: 5 }}
                animationDuration={700}
              />
              <Brush
                dataKey="month"
                height={22}
                travellerWidth={8}
                stroke="var(--border)"
                fill="var(--surface-2)"
                tickFormatter={monthLabel}
                onChange={onBrush}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
