import React, { useRef } from 'react';
import { useDashboard } from '../state/store.jsx';
import { parseWorkbook } from '../lib/parse.js';
import { formatDate } from '../lib/format.js';
import { SegToggle } from './ui.jsx';

// 상단 헤더 — 타이틀 / 기준기간 / 업로드 / 건수기준 토글 / 테마 토글
export default function Header() {
  const { meta, dispatch, countByContract, theme } = useDashboard();
  const fileRef = useRef(null);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    dispatch({ type: 'LOADING' });
    try {
      const buf = await file.arrayBuffer();
      const { records, meta: m } = parseWorkbook(new Uint8Array(buf));
      dispatch({ type: 'SET_DATA', records, meta: { ...m, fileName: file.name } });
    } catch (err) {
      dispatch({ type: 'ERROR', error: err.message || '파싱 실패' });
    } finally {
      e.target.value = '';
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black"
            style={{
              background: 'linear-gradient(135deg,#22d3ee,#6366f1)',
              color: '#06121b',
              boxShadow: '0 0 22px -6px var(--glow)',
            }}
          >
            AI
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight sm:text-lg">
              AI 소프트웨어 공공조달 마켓 인텔리전스
            </h1>
            <p className="text-xs text-muted">
              나라장터 특정품목 조달내역 · 인공지능(AI)소프트웨어
              {meta && (
                <span className="ml-1 text-muted">
                  · 기준기간 {formatDate(meta.from)} ~ {formatDate(meta.to)}
                  {meta.fileName ? ` · ${meta.fileName}` : ''}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted">건수기준</span>
            <SegToggle
              value={countByContract}
              onChange={(v) => dispatch({ type: 'SET_COUNT_MODE', value: v })}
              options={[
                { value: true, label: '계약' },
                { value: false, label: '라인' },
              ]}
            />
          </div>

          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-accent"
          >
            <UploadIcon /> 엑셀 업로드
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={onFile}
          />

          <button
            onClick={() =>
              dispatch({ type: 'SET_THEME', value: theme === 'dark' ? 'light' : 'dark' })
            }
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-text transition-colors hover:border-accent"
            title="다크/라이트 전환"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
