import React, { useMemo } from 'react';
import { useDashboard } from '../state/store.jsx';
import { distinctValues } from '../lib/aggregate.js';
import { formatDate } from '../lib/format.js';

// 전역 필터바 — 기간 / 소관구분 / 기업구분 / 계약방법 / 검색 + 활성 필터 칩
export default function FilterBar() {
  const { records, filters, setFilter, clearFilter, resetFilters, meta } = useDashboard();

  const govs = useMemo(() => distinctValues(records, 'gov'), [records]);
  const ctypes = useMemo(() => distinctValues(records, 'ctype'), [records]);
  const methods = useMemo(() => distinctValues(records, 'method'), [records]);

  // 활성 필터 칩 목록
  const chips = [];
  const isDefaultRange = filters.dateFrom === meta?.from && filters.dateTo === meta?.to;
  if (!isDefaultRange && (filters.dateFrom || filters.dateTo)) {
    chips.push({
      key: 'date',
      label: `기간 ${formatDate(filters.dateFrom)}~${formatDate(filters.dateTo)}`,
      onClear: () => {
        setFilter('dateFrom', meta?.from || null);
        setFilter('dateTo', meta?.to || null);
      },
    });
  }
  for (const k of ['gov', 'ctype', 'method', 'company', 'org']) {
    if (filters[k]) chips.push({ key: k, label: `${labelOf(k)}: ${filters[k]}`, onClear: () => clearFilter(k) });
  }
  if (filters.search) chips.push({ key: 'search', label: `검색: ${filters.search}`, onClear: () => clearFilter('search') });

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6">
      <div className="card p-3 sm:p-4" >
        <div className="flex flex-wrap items-end gap-3">
          <Field label="기간 시작">
            <input
              type="date"
              value={toInputDate(filters.dateFrom)}
              min={toInputDate(meta?.from)}
              max={toInputDate(meta?.to)}
              onChange={(e) => setFilter('dateFrom', fromInputDate(e.target.value))}
              className="filter-input"
            />
          </Field>
          <Field label="기간 종료">
            <input
              type="date"
              value={toInputDate(filters.dateTo)}
              min={toInputDate(meta?.from)}
              max={toInputDate(meta?.to)}
              onChange={(e) => setFilter('dateTo', fromInputDate(e.target.value))}
              className="filter-input"
            />
          </Field>
          <Field label="소관구분">
            <Select value={filters.gov} onChange={(v) => setFilter('gov', v)} options={govs} />
          </Field>
          <Field label="기업구분">
            <Select value={filters.ctype} onChange={(v) => setFilter('ctype', v)} options={ctypes} />
          </Field>
          <Field label="계약방법">
            <Select value={filters.method} onChange={(v) => setFilter('method', v)} options={methods} />
          </Field>
          <Field label="검색" grow>
            <input
              type="text"
              placeholder="기업·기관·사업명·제품 검색…"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              className="filter-input w-full"
            />
          </Field>
        </div>

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="text-xs text-muted">활성 필터</span>
            {chips.map((c) => (
              <button key={c.key} className="chip" onClick={c.onClear}>
                {c.label}
                <span className="text-[10px] opacity-70">✕</span>
              </button>
            ))}
            <button
              onClick={resetFilters}
              className="ml-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent-2 hover:text-accent-2"
            >
              초기화
            </button>
          </div>
        )}
      </div>

      <style>{`
        .filter-input{
          background: var(--bg);
          border:1px solid var(--border);
          color: var(--text);
          border-radius:8px;
          padding:6px 10px;
          font-size:13px;
          outline:none;
          transition:border-color .2s ease;
          color-scheme: dark;
        }
        :root[data-theme='light'] .filter-input{ color-scheme: light; }
        .filter-input:focus{ border-color: var(--accent); }
      `}</style>
    </div>
  );
}

function Field({ label, children, grow }) {
  return (
    <label className={`flex flex-col gap-1 ${grow ? 'min-w-[180px] flex-1' : ''}`}>
      <span className="text-[11px] font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="filter-input min-w-[130px]"
    >
      <option value="">전체</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function labelOf(k) {
  return { gov: '소관구분', ctype: '기업구분', method: '계약방법', company: '공급기업', org: '수요기관' }[k] || k;
}

// 'YYYYMMDD' <-> 'YYYY-MM-DD'(input[type=date])
function toInputDate(ymd) {
  if (!ymd || String(ymd).length !== 8) return '';
  const s = String(ymd);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}
function fromInputDate(s) {
  if (!s) return null;
  return s.replaceAll('-', '');
}
