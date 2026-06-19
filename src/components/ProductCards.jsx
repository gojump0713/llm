import React, { useMemo, useState } from 'react';
import { useDashboard } from '../state/store.jsx';
import { productCards } from '../lib/aggregate.js';
import { Card, SegToggle, Empty } from './ui.jsx';
import { formatKRW, formatInt } from '../lib/format.js';

// AI 소프트웨어 소개 카드 그리드 — 제품명/업체명/한줄설명/대표수요기관/누적 금액·건수
export default function ProductCards() {
  const { filtered, countByContract, toggleFilter } = useDashboard();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('amount');
  const [limit, setLimit] = useState(12);

  const all = useMemo(() => productCards(filtered, countByContract), [filtered, countByContract]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let arr = all;
    if (needle) {
      arr = arr.filter((c) =>
        `${c.company} ${c.product} ${c.desc} ${c.topOrg}`.toLowerCase().includes(needle)
      );
    }
    arr = [...arr].sort((a, b) =>
      sort === 'amount' ? b.amount - a.amount : sort === 'count' ? b.count - a.count : a.product.localeCompare(b.product)
    );
    return arr;
  }, [all, q, sort]);

  const shown = list.slice(0, limit);

  return (
    <Card
      title="AI 소프트웨어 소개"
      subtitle={`업체·제품 ${all.length}종 · 카드 클릭 → 해당 기업으로 필터`}
      hover={false}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(12);
            }}
            placeholder="제품·업체 검색"
            className="rounded-lg border border-border bg-bg px-2.5 py-1 text-xs text-text outline-none focus:border-accent"
          />
          <SegToggle
            value={sort}
            onChange={setSort}
            options={[
              { value: 'amount', label: '금액순' },
              { value: 'count', label: '건수순' },
              { value: 'name', label: '이름순' },
            ]}
          />
        </div>
      }
    >
      {shown.length === 0 ? (
        <Empty />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((c) => (
              <button
                key={c.key}
                onClick={() => toggleFilter('company', c.company)}
                className="card card-hover group flex flex-col p-4 text-left"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">
                    {c.ctype}
                  </span>
                  <span className="text-[10px] text-muted">{c.region}</span>
                </div>
                <h4 className="line-clamp-2 text-sm font-semibold text-text group-hover:text-accent">
                  {c.product}
                </h4>
                <p className="mt-0.5 text-xs font-medium text-accent">{c.company}</p>
                <p className="mt-1.5 line-clamp-2 min-h-[32px] text-[11px] leading-snug text-muted">
                  {c.desc || '—'}
                </p>
                <div className="mt-3 flex items-end justify-between border-t border-border pt-2.5">
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted">대표 수요기관</div>
                    <div className="truncate text-[11px] text-text" title={c.topOrg}>
                      {c.topOrg || '—'}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-extrabold text-text tnum">{formatKRW(c.amount)}</div>
                    <div className="text-[10px] text-muted tnum">{formatInt(c.count)}건</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {limit < list.length && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setLimit((l) => l + 12)}
                className="rounded-lg border border-border px-4 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
              >
                더 보기 ({list.length - limit}종)
              </button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
