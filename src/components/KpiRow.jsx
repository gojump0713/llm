import React, { useMemo } from 'react';
import { useDashboard } from '../state/store.jsx';
import { computeKpis, computePrevKpis } from '../lib/aggregate.js';
import { CountUpKRW, CountUpInt } from './ui.jsx';
import { deltaInfo } from '../lib/format.js';

// KPI 4종: 공급기업 수 · 총 계약금액 · 총 계약 건수 · 평균 계약 단가
export default function KpiRow() {
  const { filtered, records, filters, countByContract } = useDashboard();

  const kpis = useMemo(() => computeKpis(filtered, countByContract), [filtered, countByContract]);
  const prev = useMemo(
    () => computePrevKpis(records, filters, countByContract),
    [records, filters, countByContract]
  );

  const cards = [
    {
      label: '공급기업 수',
      node: <CountUpInt value={kpis.companyCount} suffix="개사" />,
      curr: kpis.companyCount,
      prev: prev?.companyCount,
      accent: false,
    },
    {
      label: '총 계약금액',
      node: <CountUpKRW value={kpis.totalAmount} />,
      curr: kpis.totalAmount,
      prev: prev?.totalAmount,
      accent: true,
    },
    {
      label: countByContract ? '총 계약 건수' : '총 라인 건수',
      node: <CountUpInt value={kpis.contractCount} suffix="건" />,
      curr: kpis.contractCount,
      prev: prev?.contractCount,
      accent: false,
    },
    {
      label: '평균 계약 단가',
      node: <CountUpKRW value={kpis.avgUnitPrice} />,
      curr: kpis.avgUnitPrice,
      prev: prev?.avgUnitPrice,
      accent: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <KpiCard key={c.label} {...c} />
      ))}
    </div>
  );
}

function KpiCard({ label, node, curr, prev, accent }) {
  const d = prev != null ? deltaInfo(curr, prev) : null;
  const color = d?.dir === 'up' ? 'text-pos' : d?.dir === 'down' ? 'text-neg' : 'text-muted';
  return (
    <div className="card card-hover relative overflow-hidden p-5">
      {accent && (
        <span
          className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-30 blur-2xl"
          style={{ background: 'var(--accent)' }}
        />
      )}
      <p className="text-xs font-medium text-muted">{label}</p>
      <div
        className={`mt-2 text-[26px] font-extrabold leading-none sm:text-[30px] ${
          accent ? 'text-accent' : 'text-text'
        }`}
      >
        {node}
      </div>
      {d && (
        <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${color}`}>
          <span className="tnum">{d.text}</span>
          <span className="text-muted">직전 동기간 대비</span>
        </div>
      )}
    </div>
  );
}
