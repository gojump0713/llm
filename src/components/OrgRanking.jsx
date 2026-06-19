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
import { rankOrgs, orgDrilldown } from '../lib/aggregate.js';
import { Card, ChartTooltip, Empty, PALETTE, ACCENT_2 } from './ui.jsx';
import { formatKRW, formatDate } from '../lib/format.js';

// 수요기관 TOP 10(금액 기준) — 행 클릭 시 드릴다운 패널(계약명·공급기업)
export default function OrgRanking() {
  const { filtered, countByContract, setFilter, filters } = useDashboard();
  const [drill, setDrill] = useState(null); // 선택한 기관명

  const data = useMemo(
    () => rankOrgs(filtered, 'amount', 10, countByContract),
    [filtered, countByContract]
  );
  const drillRows = useMemo(
    () => (drill ? orgDrilldown(filtered, drill).slice(0, 12) : []),
    [filtered, drill]
  );

  return (
    <Card
      title="수요기관 TOP 10"
      subtitle="금액 기준 · 막대 클릭 → 드릴다운"
      action={
        drill && (
          <button
            className="text-xs text-muted hover:text-accent"
            onClick={() => setDrill(null)}
          >
            ← 목록
          </button>
        )
      }
    >
      {data.length === 0 ? (
        <Empty />
      ) : drill ? (
        <Drilldown org={drill} rows={drillRows} onFilter={() => setFilter('org', drill)} />
      ) : (
        <div className="mount-anim" style={{ height: Math.max(260, data.length * 30) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 64, bottom: 4, left: 8 }}
              barCategoryGap={6}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v.length > 10 ? v.slice(0, 10) + '…' : v)}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                content={<ChartTooltip formatter={(v) => formatKRW(v)} />}
              />
              <Bar
                dataKey="amount"
                name="계약금액"
                radius={[0, 5, 5, 0]}
                cursor="pointer"
                onClick={(d) => setDrill(d.name)}
                animationDuration={600}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={filters.org === d.name ? ACCENT_2 : PALETTE[i % PALETTE.length]} />
                ))}
                <LabelList
                  dataKey="amount"
                  position="right"
                  formatter={(v) => formatKRW(v)}
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

function Drilldown({ org, rows, onFilter }) {
  return (
    <div className="mount-anim">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="truncate text-sm font-semibold text-accent">{org}</h4>
        <button
          onClick={onFilter}
          className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-accent hover:text-accent"
        >
          이 기관으로 필터
        </button>
      </div>
      <div className="max-h-[300px] overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-surface text-muted">
            <tr className="border-b border-border">
              <th className="py-1.5 pr-2 font-medium">계약명</th>
              <th className="py-1.5 pr-2 font-medium">공급기업</th>
              <th className="py-1.5 pr-2 text-right font-medium">금액</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="max-w-[180px] truncate py-1.5 pr-2 text-text" title={r.contractName}>
                  {r.contractName}
                </td>
                <td className="max-w-[110px] truncate py-1.5 pr-2 text-muted" title={r.company}>
                  {r.company}
                </td>
                <td className="py-1.5 pr-2 text-right tnum text-text">{formatKRW(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
