/**
 * Share game summary as a PNG.
 *
 * Two entry points:
 *   shareGameImage(state)       — full pipeline: render → Web Share / download
 *   renderGameSummaryPNG(state) — render only, returns a PNG Blob
 *
 * Ported from vanilla `js/share.js` per PORT_FROM_VANILLA.md item 6.
 * Self-contained: derives totals + winner + standings rows from `state` so
 * it works from the winner screen and mid-game (mid-game suppresses the
 * Sebeeta score subtitle on purpose).
 *
 * Layout is 1080×1350 portrait (4:5, Instagram/WhatsApp-friendly).
 */

import { checkWinner, teamTotalsFromPlayers, totals as computeTotals } from './engine/scoring';
import { STRINGS, type StringKey } from './i18n/strings';
import type { PersistedState } from './state/persistedState';

// Tiny per-state helpers
function tStr(state: PersistedState, key: StringKey): string {
  const v = STRINGS[state.lang][key];
  return typeof v === 'string' ? v : '';
}

function teamName(state: PersistedState, i: 0 | 1): string {
  const custom = state.teamNames?.[i]?.trim();
  if (custom) return custom;
  return i === 0 ? tStr(state, 'teamAFull') : tStr(state, 'teamBFull');
}

// Apply an alpha to a CSS color. Handles both `rgba(...)` and `#hex` —
// covers everything the palette below uses.
function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('rgba(')) {
    return color.replace(/[\d.]+\)$/, `${alpha})`);
  }
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const full = hex.length === 3
      ? hex.split('').map((c) => c + c).join('')
      : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

type StandingsRow = {
  name: string;
  score: number;
  isTeam: boolean;
  idx: number;
  showHeaderScore: boolean;
  players: Array<{ name: string; score: number | null }>;
};

// ---------- Public API ----------

export async function shareGameImage(state: PersistedState): Promise<void> {
  try {
    const blob = await renderGameSummaryPNG(state);
    if (!blob) throw new Error('no blob');
    const filename = `qaid-${new Date().toISOString().slice(0, 10)}.png`;
    const file = new File([blob], filename, { type: 'image/png' });

    // Prefer the native share sheet (WhatsApp / iMessage / etc.).
    const nav = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean;
      share?: (data?: ShareData) => Promise<void>;
    };
    if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
      try {
        await nav.share({ files: [file], title: tStr(state, 'shareTitle') });
        return;
      } catch (e) {
        // User cancelled — abort silently. Any other error → fall through to download.
        if (e && (e as { name?: string }).name === 'AbortError') return;
      }
    }

    // Desktop / unsupported: download.
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    console.error('shareGameImage failed:', e);
    alert(tStr(state, 'shareError'));
  }
}

// ---------- Text summary ----------

// Build a plain-text result summary (winner + ranked standings + rounds).
// Localised to state.lang; safe to call mid-game or at game end.
export function buildShareText(state: PersistedState): string {
  const totalsArr = computeTotals(state);
  const winner = checkWinner(state, totalsArr);
  const hasTeams =
    state.playerTeam.length === state.players.length && state.players.length > 0;

  let rows: Array<{ name: string; score: number }>;
  if (state.gameMode === 'kout') {
    rows = [
      { name: teamName(state, 0), score: totalsArr[0] ?? 0 },
      { name: teamName(state, 1), score: totalsArr[1] ?? 0 },
    ];
  } else if (
    state.gameMode === 'sebeeta' ||
    (state.gameMode === 'custom' && hasTeams) ||
    (state.gameMode === 'trix' && state.trixMatch?.partnership && hasTeams)
  ) {
    const tt = teamTotalsFromPlayers(totalsArr, state.playerTeam);
    rows = [
      { name: teamName(state, 0), score: tt[0] },
      { name: teamName(state, 1), score: tt[1] },
    ];
  } else {
    rows = state.players.map((n, i) => ({ name: n, score: totalsArr[i] ?? 0 }));
  }
  rows = rows
    .slice()
    .sort((a, b) =>
      state.winRule === 'highest' ? b.score - a.score : a.score - b.score,
    );

  // Winner line. Sebeeta hides the numeric subtitle (team game, individual board).
  let winnerName = rows[0]?.name ?? '—';
  let winnerScore = '';
  if (winner && winner.type === 'team' && state.gameMode === 'kout') {
    winnerName = teamName(state, winner.idx);
    winnerScore = `${totalsArr[winner.idx]}–${totalsArr[1 - winner.idx]}`;
  } else if (winner && winner.type === 'team' && state.gameMode === 'sebeeta') {
    winnerName = teamName(state, winner.idx);
  } else if (winner && winner.type === 'team') {
    winnerName = teamName(state, winner.idx);
    winnerScore = String((rows.find((r) => r.name === winnerName) ?? rows[0]).score);
  } else if (winner && winner.type === 'player') {
    winnerName = state.players[winner.idx] ?? '—';
    winnerScore = String(totalsArr[winner.idx]);
  }

  const modeKey: StringKey =
    state.gameMode === 'kout'
      ? 'gameKout'
      : state.gameMode === 'sebeeta'
        ? 'gameSebeeta'
        : state.gameMode === 'trix'
          ? 'gameTrix'
          : 'gameCustom';
  const brand = state.lang === 'ar' ? 'قيد' : 'Qaid';

  const lines: string[] = [];
  lines.push(`${tStr(state, modeKey)} · ${brand}`);
  lines.push(`🏆 ${winnerName}${winnerScore ? ` — ${winnerScore}` : ''}`);
  lines.push('');
  lines.push(`${tStr(state, 'finalStandings')}:`);
  rows.forEach((r, i) => lines.push(`${i + 1}. ${r.name} — ${r.score}`));

  const roundsFn = STRINGS[state.lang].roundsPlayed;
  lines.push('');
  lines.push(
    typeof roundsFn === 'function'
      ? roundsFn(state.scores.length)
      : `${state.scores.length} rounds`,
  );

  return lines.join('\n');
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// Copy the text summary to the clipboard. Resolves true on success.
export function copyShareText(state: PersistedState): Promise<boolean> {
  return copyText(buildShareText(state));
}

// Share the text summary via the native share sheet, falling back to clipboard
// when Web Share isn't available. Resolves true if the user shared or copied
// (a user-cancel also counts as "handled").
export async function shareGameText(state: PersistedState): Promise<boolean> {
  const text = buildShareText(state);
  const nav = navigator as Navigator & {
    share?: (data?: ShareData) => Promise<void>;
  };
  if (nav.share) {
    try {
      await nav.share({ title: tStr(state, 'shareTitle'), text });
      return true;
    } catch (e) {
      if (e && (e as { name?: string }).name === 'AbortError') return true;
      // Other errors → fall back to clipboard.
    }
  }
  return copyText(text);
}

export async function renderGameSummaryPNG(
  state: PersistedState,
): Promise<Blob | null> {
  // Wait for web fonts so the canvas measures + renders the brand text in
  // the right faces. Best-effort — falls through to system fonts if denied.
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* noop */
    }
  }

  const W = 1080;
  const H = 1350;
  const isDark = state.theme === 'dark';
  const rtl = state.lang === 'ar';

  const C = isDark
    ? {
        bgTop: '#1a233e', bgBottom: '#0a0a0c',
        surface: 'rgba(36,36,40,0.85)',
        line: 'rgba(255,255,255,0.14)',
        ink: '#f5f5f7',
        inkSoft: '#d6d6d8',
        muted: '#9b9b9f',
        gold: '#ffd60a',
        onGold: '#1a1100',
        glow1: 'rgba(110,80,40,0.55)',
        glow2: 'rgba(40,80,140,0.5)',
      }
    : {
        bgTop: '#fff3d6', bgBottom: '#f0eee9',
        surface: 'rgba(255,255,255,0.92)',
        line: 'rgba(0,0,0,0.10)',
        ink: '#0a0a0a',
        inkSoft: '#2a2a2a',
        muted: '#6e6e72',
        gold: '#f5b800',
        onGold: '#1a1100',
        glow1: 'rgba(255,210,170,0.7)',
        glow2: 'rgba(150,200,255,0.55)',
      };

  // Render at the device pixel ratio so the exported PNG is crisp on Retina /
  // high-DPI phones (the main audience for sharing). Cap at 3× to bound canvas
  // memory on extreme displays. All drawing below stays in logical W×H units.
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(dpr, dpr);

  // --- Background gradient + soft glow blobs ---
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, C.bgTop);
  grad.addColorStop(1, C.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  softBlob(ctx, W * 0.82, 120, 420, C.glow1);
  softBlob(ctx, W * 0.12, 260, 360, C.glow2);
  softBlob(ctx, W * 0.5, H - 140, 380, C.glow1);

  // Font helpers — fall back to system if web fonts haven't loaded yet.
  const fbody = (size: number, weight = 600) =>
    `${weight} ${size}px Geist, "IBM Plex Sans Arabic", system-ui, -apple-system, sans-serif`;
  const fmono = (size: number, weight = 600) =>
    `${weight} ${size}px "Geist Mono", ui-monospace, monospace`;

  const PAD = 72;
  ctx.textBaseline = 'top';
  ctx.direction = rtl ? 'rtl' : 'ltr';

  // --- Header: brand eyebrow + mode title + date ---
  ctx.textAlign = rtl ? 'right' : 'left';
  const headX = rtl ? W - PAD : PAD;

  ctx.fillStyle = C.muted;
  ctx.font = fbody(28, 600);
  const brand = rtl ? 'قيد بلوك ٣' : 'QAID · BLOCK 3';
  ctx.fillText(brand, headX, PAD);

  const modeKey: StringKey =
    state.gameMode === 'kout'
      ? 'gameKout'
      : state.gameMode === 'sebeeta'
        ? 'gameSebeeta'
        : state.gameMode === 'trix'
          ? 'gameTrix'
          : 'gameCustom';
  ctx.fillStyle = C.ink;
  ctx.font = fbody(72, 700);
  ctx.fillText(tStr(state, modeKey), headX, PAD + 44);

  const date = new Date().toLocaleDateString(rtl ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  ctx.textAlign = rtl ? 'left' : 'right';
  ctx.fillStyle = C.muted;
  ctx.font = fbody(24, 500);
  ctx.fillText(date, rtl ? PAD : W - PAD, PAD + 12);

  // --- Compute winner + standings ---
  const totalsArr = computeTotals(state);
  const winner = checkWinner(state, totalsArr);

  // Build {name, score|null} entries for the players on a team. Pass
  // playerTotals=null when per-player scores aren't meaningful (Kout).
  const teamPlayersWithScores = (
    teamIdx: number,
    playerTotals: number[] | null,
  ): Array<{ name: string; score: number | null }> => {
    const out: Array<{ name: string; score: number | null }> = [];
    state.playerTeam.forEach((tIdx, pIdx) => {
      if (tIdx === teamIdx && state.players[pIdx]) {
        out.push({
          name: state.players[pIdx],
          score: playerTotals ? playerTotals[pIdx] ?? 0 : null,
        });
      }
    });
    return out;
  };

  let rows: StandingsRow[] = [];
  if (state.gameMode === 'kout') {
    rows = [
      {
        name: teamName(state, 0),
        score: totalsArr[0] ?? 0,
        isTeam: true,
        idx: 0,
        showHeaderScore: true,
        players: teamPlayersWithScores(0, null),
      },
      {
        name: teamName(state, 1),
        score: totalsArr[1] ?? 0,
        isTeam: true,
        idx: 1,
        showHeaderScore: true,
        players: teamPlayersWithScores(1, null),
      },
    ];
  } else if (
    state.gameMode === 'sebeeta' ||
    (state.gameMode === 'trix' && state.trixMatch?.partnership)
  ) {
    const tT = teamTotalsFromPlayers(totalsArr, state.playerTeam);
    // Sebeeta hides the team header score (shown as an individual board);
    // Trix 2v2 shows it (team total is the score that wins).
    const showTeamScore = state.gameMode === 'trix';
    rows = [
      {
        name: teamName(state, 0),
        score: tT[0],
        isTeam: true,
        idx: 0,
        showHeaderScore: showTeamScore,
        players: teamPlayersWithScores(0, totalsArr),
      },
      {
        name: teamName(state, 1),
        score: tT[1],
        isTeam: true,
        idx: 1,
        showHeaderScore: showTeamScore,
        players: teamPlayersWithScores(1, totalsArr),
      },
    ];
  } else {
    rows = state.players.map((nm, i) => ({
      name: nm,
      score: totalsArr[i] ?? 0,
      isTeam: false,
      idx: i,
      showHeaderScore: true,
      players: [],
    }));
  }

  rows = rows
    .slice()
    .sort((a, b) =>
      state.winRule === 'highest' ? b.score - a.score : a.score - b.score,
    );

  // Resolve the winner card text. Sebeeta hides the numeric subtitle.
  let winnerName: string;
  let winnerScoreText: string;
  if (winner && winner.type === 'team' && state.gameMode === 'kout') {
    winnerName = teamName(state, winner.idx);
    winnerScoreText = `${totalsArr[winner.idx]}–${totalsArr[1 - winner.idx]}`;
  } else if (winner && winner.type === 'team' && state.gameMode === 'sebeeta') {
    winnerName = teamName(state, winner.idx);
    winnerScoreText = '';
  } else if (winner && winner.type === 'team') {
    winnerName = teamName(state, winner.idx);
    winnerScoreText = String(
      (rows.find((r) => r.idx === winner.idx) ?? rows[0]).score,
    );
  } else if (winner && winner.type === 'player') {
    winnerName = state.players[winner.idx] ?? '—';
    winnerScoreText = String(totalsArr[winner.idx]);
  } else {
    // Mid-game: leader from rows. Sebeeta still suppresses the score subtitle.
    winnerName = rows[0]?.name || '—';
    winnerScoreText =
      state.gameMode === 'sebeeta' ? '' : String(rows[0]?.score ?? 0);
  }

  // --- Winner card ---
  const cardX = PAD;
  const cardY = PAD + 160;
  const cardW = W - PAD * 2;
  const cardH = 360;
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.fillStyle = C.surface;
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = '140px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  ctx.fillStyle = C.gold;
  ctx.fillText('🏆', W / 2, cardY + 32);

  ctx.fillStyle = C.ink;
  ctx.font = fbody(72, 700);
  ctx.fillText(winnerName, W / 2, cardY + 190);

  ctx.fillStyle = C.muted;
  ctx.font = fmono(40, 600);
  ctx.fillText(winnerScoreText, W / 2, cardY + 282);

  // --- Standings ---
  let listY = cardY + cardH + 60;
  ctx.textAlign = rtl ? 'right' : 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = C.muted;
  ctx.font = fbody(22, 600);
  const eyebrow = tStr(state, 'finalStandings').toUpperCase();
  ctx.fillText(eyebrow, headX, listY);
  listY += 38;

  // Row metrics — height adapts to player count.
  const HEADER_LINE = 50;
  const PLAYER_LINE = 32;
  const ROW_PAD_TOP = 22;
  const ROW_PAD_BOT = 22;
  const SOLO_ROW_H = 88;

  const rowHeight = (r: StandingsRow): number => {
    if (!r.isTeam) return SOLO_ROW_H;
    const n = r.players.length;
    return ROW_PAD_TOP + HEADER_LINE + (n > 0 ? n * PLAYER_LINE : 0) + ROW_PAD_BOT;
  };

  const rowGap = 14;
  let cursorY = listY;
  rows.forEach((r, i) => {
    const rh = rowHeight(r);
    const ry = cursorY;
    cursorY += rh + rowGap;

    drawRoundRect(ctx, PAD, ry, W - PAD * 2, rh, 26);
    ctx.fillStyle = i === 0 ? withAlpha(C.gold, 0.18) : C.surface;
    ctx.fill();
    ctx.strokeStyle = i === 0 ? withAlpha(C.gold, 0.45) : C.line;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rank chip — anchored to the header line so it doesn't drift on tall rows.
    const chipR = 22;
    const chipCX = rtl ? W - PAD - 40 : PAD + 40;
    const chipCY = r.isTeam
      ? ry + ROW_PAD_TOP + HEADER_LINE / 2
      : ry + rh / 2;
    ctx.beginPath();
    ctx.arc(chipCX, chipCY, chipR, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? C.gold : withAlpha(C.ink, 0.1);
    ctx.fill();
    ctx.fillStyle = i === 0 ? C.onGold : C.ink;
    ctx.font = fbody(22, 700);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), chipCX, chipCY + 1);

    ctx.textAlign = rtl ? 'right' : 'left';
    const nameX = rtl ? W - PAD - 80 : PAD + 80;
    const scoreEdge = rtl ? PAD + 28 : W - PAD - 28;

    if (r.isTeam) {
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.ink;
      ctx.font = fbody(34, 700);
      ctx.fillText(r.name || '—', nameX, chipCY);

      if (r.showHeaderScore) {
        ctx.textAlign = rtl ? 'left' : 'right';
        ctx.fillStyle = C.inkSoft;
        ctx.font = fmono(36, 600);
        ctx.fillText(String(r.score), scoreEdge, chipCY);
      }

      if (r.players.length > 0) {
        // Faint divider between team header and player list.
        ctx.beginPath();
        const divY = ry + ROW_PAD_TOP + HEADER_LINE;
        ctx.moveTo(PAD + 28, divY);
        ctx.lineTo(W - PAD - 28, divY);
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 1;
        ctx.stroke();

        r.players.forEach((p, pi) => {
          const py =
            ry + ROW_PAD_TOP + HEADER_LINE + (pi + 0.5) * PLAYER_LINE;
          ctx.textAlign = rtl ? 'right' : 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = C.inkSoft;
          ctx.font = fbody(22, 500);
          ctx.fillText(p.name || '—', nameX, py);
          if (p.score !== null) {
            ctx.textAlign = rtl ? 'left' : 'right';
            ctx.fillStyle = C.muted;
            ctx.font = fmono(22, 600);
            ctx.fillText(String(p.score), scoreEdge, py);
          }
        });
      }
    } else {
      // Solo row (Custom): single line, name + score.
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.ink;
      ctx.font = fbody(34, 600);
      ctx.fillText(r.name || '—', nameX, ry + rh / 2);
      ctx.textAlign = rtl ? 'left' : 'right';
      ctx.fillStyle = C.inkSoft;
      ctx.font = fmono(36, 600);
      ctx.fillText(String(r.score), scoreEdge, ry + rh / 2);
    }
  });

  // --- Footer: rounds played ---
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = C.muted;
  ctx.font = fbody(24, 500);
  const roundsFn = STRINGS[state.lang].roundsPlayed;
  const footer =
    typeof roundsFn === 'function'
      ? roundsFn(state.scores.length)
      : `${state.scores.length} rounds`;
  ctx.fillText(footer, W / 2, H - PAD);

  // Guard against toBlob never invoking its callback (some engines under
  // memory pressure): resolve null after a timeout so the share flow falls back
  // to text instead of hanging forever.
  return new Promise<Blob | null>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(null);
    }, 5000);
    canvas.toBlob(
      (b) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(b);
      },
      'image/png',
      0.95,
    );
  });
}

// ---------- Canvas primitives ----------

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function softBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
): void {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
}
