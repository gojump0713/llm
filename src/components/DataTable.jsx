import React, { useMemo, useState } from 'react';
import { useDashboard } from '../state/store.jsx';
import { Card, Empty } from './ui.jsx';
import { formatWonFull, formatDate, formatInt } from '../lib/format.js';

// 원본 데이터 테이블 — 정렬 / 검색 / 페이지네이션 / CSV 내보내기
const COLUMNS = [
  { key: 'date', label: '계약일자', render: (r) => formatDate(r.date), w: 'w-[96px]' },
  { key: 'org', label: '수요기관' },
  { key: 'gov', label: '소관구분', w: 'w-[110px]' },
  { key: 'company', label: '공급기업' },
  { key: 'productName', label: '제품명' },
  { key: 'contractName', label: '계약명' },
  { key: 'method', label: '계약방법', w: 'w-[88px]' },
  { key: 'amount', label: '공급금액', align: 'right', render: (r) => formatWonFull(r.amount), w: 'w-[130px]' },
];

const PAGE_SIZE = 12;

export default function DataTable() {
  const { filtered } = useDashboard();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ key: 'amount', dir: 'desc' });
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let arr = filtered;
    if (needle) {
      arr = arr.filter((r) =>
        `${r.org} ${r.company} ${r.productName} ${r.contractName} ${r.method} ${r.gov}`
          .toLowerCase()
          .includes(needle)
      );
    }
    arr = [...arr].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'ko');
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, q, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
    setPage(0);
  }

  function exportCsv() {
    const header = COLUMNS.map((c) => c.label);
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push(
        [
          formatDate(r.date),
          r.org,
          r.gov,
          r.company,
          r.productName,
          r.contractName,
          r.method,
          r.amount,
        ]
          .map(csvCell)
          .join(',')
      );
    }
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai_procurement_filtered.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card
      title="원본 데이터"
      subtitle={`현재 필터 ${formatInt(rows.length)}건`}
      hover={false}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="테이블 검색"
            className="rounded-lg border border-border bg-bg px-2.5 py-1 text-xs text-text outline-none focus:border-accent"
          />
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1 text-xs font-medium text-text transition-colors hover:border-accent"
          >
            CSV 내보내기
          </button>
        </div>
      }
    >
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted">
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      onClick={() => toggleSort(c.key)}
                      className={`cursor-pointer select-none py-2 pr-3 font-medium hover:text-text ${
                        c.align === 'right' ? 'text-right' : ''
                      } ${c.w || ''}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        {sort.key === c.key && <span className="text-accent">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 transition-colors hover:bg-surface-2">
                    {COLUMNS.map((c) => (
                      <td
                        key={c.key}
                        className={`py-2 pr-3 ${c.align === 'right' ? 'text-right tnum text-text' : 'text-muted'} ${
                          c.key === 'amount' ? 'font-medium' : ''
                        }`}
                      >
                        <span className={c.key !== 'amount' ? 'line-clamp-1 max-w-[220px]' : ''} title={String(r[c.key] ?? '')}>
                          {c.render ? c.render(r) : r[c.key] || '—'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
            <span className="tnum">
              {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, rows.length)} / {formatInt(rows.length)}
            </span>
            <div className="flex items-center gap-1">
              <PageBtn disabled={safePage === 0} onClick={() => setPage(0)}>«</PageBtn>
              <PageBtn disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>‹</PageBtn>
              <span className="px-2 tnum">
                {safePage + 1} / {pageCount}
              </span>
              <PageBtn disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>›</PageBtn>
              <PageBtn disabled={safePage >= pageCount - 1} onClick={() => setPage(pageCount - 1)}>»</PageBtn>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

function PageBtn({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="h-7 w-7 rounded-md border border-border text-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}
