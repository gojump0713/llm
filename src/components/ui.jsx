import React, { useEffect, useRef, useState } from 'react';
import { formatKRW } from '../lib/format.js';

// =========================================================================
// 공통 UI 프리미티브 & 차트 팔레트
// =========================================================================

// 차트 팔레트: 시안 → 블루 → 퍼플 그라데이션 8색
export const PALETTE = [
  '#22d3ee',
  '#38bdf8',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#c084fc',
  '#e879f9',
];

export const ACCENT = '#22d3ee';
export const ACCENT_2 = '#f5b301';

/** 섹션 카드 컨테이너 */
export function Card({ title, subtitle, action, children, className = '', hover = true }) {
  return (
    <section className={`card ${hover ? 'card-hover' : ''} p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-text">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/** 세그먼트 토글 (예: 금액 ↔ 건수) */
export function SegToggle({ options, value, onChange, size = 'sm' }) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <div className="inline-flex rounded-lg border border-border bg-bg p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className={`${pad} rounded-md font-medium transition-colors duration-200 ${
              active ? 'bg-accent text-[#06121b]' : 'text-muted hover:text-text'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** 숫자 count-up 애니메이션 훅 */
export function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const cur = from + (target - from) * eased;
      setVal(cur);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return val;
}

/** 금액용 count-up 표시 */
export function CountUpKRW({ value }) {
  const v = useCountUp(value);
  return <span className="tnum">{formatKRW(v)}</span>;
}

/** 정수 count-up 표시 */
export function CountUpInt({ value, suffix = '' }) {
  const v = useCountUp(value);
  return (
    <span className="tnum">
      {Math.round(v).toLocaleString('ko-KR')}
      {suffix}
    </span>
  );
}

/** 커스텀 차트 툴팁 */
export function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs shadow-lg">
      {label != null && <div className="mb-1 font-semibold text-text">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-muted">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color || p.fill || ACCENT }}
          />
          <span>{p.name}</span>
          <span className="ml-auto font-medium text-text tnum">
            {formatter ? formatter(p.value, p) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/** 빈 상태 */
export function Empty({ children = '표시할 데이터가 없습니다.' }) {
  return (
    <div className="flex h-full min-h-[160px] items-center justify-center text-sm text-muted">
      {children}
    </div>
  );
}
