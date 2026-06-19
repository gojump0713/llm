// =========================================================================
// OG 공유 이미지 / 파비콘 생성기
//   - 다크그린 배경 + 깔끔한 그래픽(닷 그리드 + 막대 그래픽)
//   - 한글 텍스트는 Malgun Gothic 으로 SVG -> PNG 래스터화(@resvg/resvg-js)
// 실행: npm run gen:images
// =========================================================================
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const OUT = path.join(__dirname, '..', 'public');
fs.mkdirSync(OUT, { recursive: true });

const FONT_REG = 'C:/Windows/Fonts/malgun.ttf';
const FONT_BOLD = 'C:/Windows/Fonts/malgunbd.ttf';

// 팔레트 (다크그린)
const BG0 = '#06170F';
const BG1 = '#0B2A1B';
const GREEN = '#34D399'; // emerald accent
const MINT = '#6EE7B7';
const TEAL = '#2DD4BF';
const TEXT = '#ECFDF5';
const SUB = '#9DC9B4';

function render(svg, width, height, file) {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles: [FONT_REG, FONT_BOLD], loadSystemFonts: false, defaultFontFamily: 'Malgun Gothic' },
    background: 'rgba(0,0,0,0)',
  });
  const png = r.render().asPng();
  fs.writeFileSync(path.join(OUT, file), png);
  console.log('✓', file, `(${width}x${height}, ${(png.length / 1024).toFixed(0)}KB)`);
}

// ---- 닷 그리드 패턴 좌표 ----
function dotGrid(w, h, gap, r, color, opacity) {
  let s = '';
  for (let y = gap; y < h; y += gap)
    for (let x = gap; x < w; x += gap)
      s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${opacity}"/>`;
  return s;
}

// ---- 막대 그래픽(우하단 장식) ----
function bars(x, baseY, heights, bw, gap, color) {
  let s = '';
  heights.forEach((hh, i) => {
    const bx = x + i * (bw + gap);
    s += `<rect x="${bx}" y="${baseY - hh}" width="${bw}" height="${hh}" rx="4" fill="${color}" opacity="${0.35 + 0.13 * i}"/>`;
  });
  return s;
}

// =========================================================================
// 1) OG 이미지 (1200 x 630)
// =========================================================================
function ogImage() {
  const W = 1200, H = 630;
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BG1}"/>
      <stop offset="1" stop-color="${BG0}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${TEAL}"/>
      <stop offset="1" stop-color="${MINT}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.8" cy="0.15" r="0.6">
      <stop offset="0" stop-color="${GREEN}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${GREEN}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${dotGrid(W, H, 40, 1.6, GREEN, 0.06)}

  <!-- 좌측 강조 바 -->
  <rect x="80" y="150" width="6" height="330" rx="3" fill="url(#accent)"/>

  <!-- 우상단 배지 -->
  <g transform="translate(${W - 200}, 78)">
    <rect x="0" y="0" width="120" height="120" rx="28" fill="url(#accent)"/>
    <text x="60" y="80" font-family="Malgun Gothic" font-weight="700" font-size="56" fill="${BG0}" text-anchor="middle">AI</text>
  </g>

  <!-- 우하단 막대 그래픽 -->
  <g transform="translate(${W - 470}, 440)">
    ${bars(0, 120, [44, 70, 52, 96, 120], 56, 18, GREEN)}
  </g>

  <!-- 카테고리 -->
  <text x="110" y="186" font-family="Malgun Gothic" font-weight="700" font-size="26" letter-spacing="2" fill="${TEAL}">나라장터 조달 인텔리전스</text>

  <!-- 메인 타이틀 (2줄) -->
  <text x="108" y="286" font-family="Malgun Gothic" font-weight="700" font-size="74" fill="${TEXT}">AI소프트웨어 공공조달</text>
  <text x="108" y="384" font-family="Malgun Gothic" font-weight="700" font-size="74" fill="${TEXT}">판매현황<tspan fill="${MINT}"> (1년)</tspan></text>

  <!-- 핵심 지표 칩 -->
  <g font-family="Malgun Gothic" font-weight="700">
    <g transform="translate(108, 452)">
      <text font-size="40" fill="${MINT}">140억</text>
      <text y="34" font-size="22" font-weight="400" fill="${SUB}">총 계약금액</text>
    </g>
    <g transform="translate(320, 452)">
      <text font-size="40" fill="${MINT}">109<tspan font-size="26">개사</tspan></text>
      <text y="34" font-size="22" font-weight="400" fill="${SUB}">공급기업</text>
    </g>
    <g transform="translate(520, 452)">
      <text font-size="40" fill="${MINT}">147<tspan font-size="26">건</tspan></text>
      <text y="34" font-size="22" font-weight="400" fill="${SUB}">계약 건수</text>
    </g>
  </g>

  <!-- 하단 출처 -->
  <text x="108" y="560" font-family="Malgun Gothic" font-size="22" fill="${SUB}">2025.06 ~ 2026.06 · 인공지능(AI)소프트웨어 조달내역</text>
</svg>`;
  render(svg, W, H, 'og-image.png');
}

// =========================================================================
// 2) 파비콘 (SVG + PNG 32 / 180)
// =========================================================================
function faviconSvg() {
  const svg = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${TEAL}"/>
      <stop offset="1" stop-color="${GREEN}"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="${BG0}"/>
  <rect x="3" y="3" width="58" height="58" rx="14" fill="none" stroke="url(#g)" stroke-width="2" opacity="0.5"/>
  <!-- 미니 막대 차트 -->
  <rect x="15" y="34" width="8" height="15" rx="2" fill="${GREEN}" opacity="0.7"/>
  <rect x="28" y="26" width="8" height="23" rx="2" fill="${MINT}"/>
  <rect x="41" y="18" width="8" height="31" rx="2" fill="${TEAL}"/>
</svg>`;
  fs.writeFileSync(path.join(OUT, 'favicon.svg'), svg);
  console.log('✓ favicon.svg');
  render(svg, 32, 32, 'favicon-32.png');
  render(svg, 180, 180, 'apple-touch-icon.png');
}

ogImage();
faviconSvg();
console.log('\n완료: public/ 에 이미지 생성됨');
