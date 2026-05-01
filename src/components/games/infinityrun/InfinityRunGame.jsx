import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Leaderboard from '../../ui/Leaderboard';
import isMobile from '../../../utils/isMobile';

// ── Constants ─────────────────────────────────────────────────────────────
const LW = 800, LH = 270;
const GROUND_Y = 226;
const GRAVITY = 0.58;
const JUMP_VY = -13.8;
const DJUMP_VY = -11.5;
const MONKEY_W = 36, MONKEY_H = 52;
const MONKEY_DW = 52, MONKEY_DH = 28;
const MONKEY_X = 90;
const INIT_SPEED = 5;
const MAX_SPEED = 22;
const SPEED_RAMP = 0.0018;

// { w, h, yOff } — yOff = px above ground (bottom of obstacle)
const OBS = {
  cactus_tall:  { w: 22, h: 78, yOff: 0 },
  cactus_short: { w: 42, h: 44, yOff: 0 },
  cactus_pair:  { w: 58, h: 68, yOff: 0 },
  bird:         { w: 46, h: 30, yOff: 32 },
};
const OBS_KEYS = Object.keys(OBS);

// ── Drawing helpers (module-level so they don't recreate each render) ─────
function rrPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function InfinityRunGame() {
  const canvasRef      = useRef(null);
  const stateRef       = useRef(null);
  const animRef        = useRef(null);
  const lastTRef       = useRef(0);
  const inputRef       = useRef({ jumpQ: 0, duckHeld: false });
  const sessionTokenRef = useRef(null);
  const lbVisibleRef   = useRef(false);

  const [ui, setUi]               = useState({ score: 0, speed: INIT_SPEED, status: 'playing' });
  const [lbVisible, setLbVisible] = useState(false);

  const scale = isMobile ? Math.min((window.innerWidth * 0.96) / LW, (window.innerHeight * 0.58) / LH) : 1;
  const DW = Math.round(LW * scale);
  const DH = Math.round(LH * scale);

  // ── Session ──────────────────────────────────────────────────────────────
  const requestSession = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_SERVER_URL}/leaderboard/infinity-run/session`, { method: 'POST' });
      const json = await res.json();
      sessionTokenRef.current = json.sessionToken || null;
    } catch {
      sessionTokenRef.current = null;
    }
  }, []);

  // ── State factory ────────────────────────────────────────────────────────
  const makeState = () => ({
    monkey: { y: GROUND_Y - MONKEY_H, vy: 0, onGround: true, ducking: false, jumpsLeft: 2, animTick: 0 },
    obstacles: [],
    score: 0,
    speed: INIT_SPEED,
    dist: 0,
    nextObs: 500,
    status: 'playing',
    tick: 0,
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────
  useEffect(() => {
    stateRef.current = makeState();
    setUi({ score: 0, speed: INIT_SPEED, status: 'playing' });
    requestSession();
  }, [requestSession]);

  const restart = useCallback(() => {
    stateRef.current = makeState();
    lbVisibleRef.current = false;
    setLbVisible(false);
    setUi({ score: 0, speed: INIT_SPEED, status: 'playing' });
    requestSession();
  }, [requestSession]);

  const handlePlayAgain = () => restart();

  useEffect(() => {
    if (ui.status === 'dead') {
      lbVisibleRef.current = true;
      setLbVisible(true);
    }
  }, [ui.status]);

  // ── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e) => {
      if (stateRef.current?.status === 'dead') return;
      if ([' ', 'ArrowUp', 'w', 'W'].includes(e.key)) { e.preventDefault(); inputRef.current.jumpQ++; }
      if (['ArrowDown', 's', 'S'].includes(e.key)) inputRef.current.duckHeld = true;
    };
    const onUp = (e) => {
      if (['ArrowDown', 's', 'S'].includes(e.key)) inputRef.current.duckHeld = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  // ── Touch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onStart = (e) => {
      if (stateRef.current?.status === 'dead') return;
      const y = e.touches[0]?.clientY ?? 0;
      if (y < window.innerHeight * 0.65) inputRef.current.jumpQ++;
      else inputRef.current.duckHeld = true;
    };
    const onEnd = () => { inputRef.current.duckHeld = false; };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd); };
  }, []);

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // ── Background ───────────────────────────────────────────────────────
    function drawBg(tick) {
      const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      sky.addColorStop(0,    '#030010');
      sky.addColorStop(0.35, '#0e0035');
      sky.addColorStop(0.65, '#55006a');
      sky.addColorStop(0.85, '#cc0062');
      sky.addColorStop(1,    '#e6006c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, LW, GROUND_Y);

      // Stars
      const seeds = [17,53,89,131,173,211,257,313,379,431,499,563,631,709,787,863,941,1019,1097,1181,1259,1327];
      seeds.forEach((s, i) => {
        const x = (s * 37 + i * 200) % LW;
        const y = (s * 13 + i * 50)  % (GROUND_Y * 0.62);
        const r = s % 3 === 0 ? 1.5 : 0.8;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(tick * 0.017 + s * 0.1));
        ctx.save();
        ctx.globalAlpha = tw * 0.85;
        ctx.fillStyle = s % 5 === 0 ? '#e0c8ff' : '#fff';
        if (s % 5 === 0) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 6; }
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // Sun
      const sx = LW * 0.5, sy = GROUND_Y * 0.68, sr = 38;
      const og = ctx.createRadialGradient(sx, sy, sr * 0.4, sx, sy, sr * 2.8);
      og.addColorStop(0, 'rgba(255,70,0,0.45)');
      og.addColorStop(0.4, 'rgba(180,0,80,0.18)');
      og.addColorStop(1, 'transparent');
      ctx.fillStyle = og;
      ctx.fillRect(sx - sr * 3, sy - sr * 3, sr * 6, sr * 6);
      ctx.save();
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.clip();
      const sg = ctx.createLinearGradient(sx, sy - sr, sx, sy + sr);
      sg.addColorStop(0, '#ffee00'); sg.addColorStop(0.25, '#ff8800');
      sg.addColorStop(0.55, '#ff2222'); sg.addColorStop(1, '#aa0044');
      ctx.fillStyle = sg; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
      for (let i = 0; i < 8; i++) {
        const ly = sy + (i / 8) * sr * 0.9;
        ctx.fillStyle = `rgba(4,0,10,${0.32 + i * 0.055})`;
        ctx.fillRect(sx - sr, ly, sr * 2, 5 + i * 0.5);
      }
      ctx.restore();

      // Mountain silhouettes
      const peaks = [
        [60,55],[160,85],[290,60],[420,90],[540,65],[670,80],[780,52],
      ];
      ctx.save();
      ctx.fillStyle = '#200040';
      ctx.shadowColor = '#aa00ff'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.moveTo(0, GROUND_Y);
      peaks.forEach(([px, ph]) => {
        ctx.lineTo(px - 75, GROUND_Y);
        ctx.lineTo(px, GROUND_Y - ph);
        ctx.lineTo(px + 75, GROUND_Y);
      });
      ctx.lineTo(LW, GROUND_Y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#cc00ff'; ctx.shadowBlur = 10; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, GROUND_Y);
      peaks.forEach(([px, ph]) => {
        ctx.lineTo(px - 75, GROUND_Y); ctx.lineTo(px, GROUND_Y - ph); ctx.lineTo(px + 75, GROUND_Y);
      });
      ctx.stroke(); ctx.restore();
    }

    function drawGround(dist) {
      const gg = ctx.createLinearGradient(0, GROUND_Y, 0, LH);
      gg.addColorStop(0, '#15003e'); gg.addColorStop(1, '#060018');
      ctx.fillStyle = gg;
      ctx.fillRect(0, GROUND_Y, LW, LH - GROUND_Y);

      // Scrolling vertical lines
      const spacing = 72, vp = LW / 2, offset = dist % spacing;
      for (let i = -1; i < LW / spacing + 3; i++) {
        const gx = i * spacing - offset;
        if (gx < -spacing || gx > LW + spacing) continue;
        const hx = vp + (gx - vp) * 0.06;
        const t = Math.abs(gx - vp) / (LW / 2);
        ctx.strokeStyle = `rgba(0,50,200,${0.10 + t * 0.07})`;
        ctx.shadowBlur = 0; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(hx, GROUND_Y); ctx.lineTo(gx, LH); ctx.stroke();
      }
      // Horizontal lines
      for (let i = 0; i < 7; i++) {
        const t = (i + 1) / 7;
        const y = GROUND_Y + (LH - GROUND_Y) * t * t;
        ctx.strokeStyle = `rgba(0,75,210,${0.10 + t * 0.55})`;
        ctx.shadowColor = '#0055ff'; ctx.shadowBlur = t > 0.6 ? 4 : 1;
        ctx.lineWidth = 0.5 + t * 0.8;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(LW, y); ctx.stroke();
      }
      // Bright ground line
      ctx.strokeStyle = '#0055ff'; ctx.shadowColor = '#00aaff'; ctx.shadowBlur = 12; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(LW, GROUND_Y); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // ── Monkey ────────────────────────────────────────────────────────────
    function drawMonkey(monkey) {
      const { y, ducking, onGround, animTick } = monkey;
      const O = '#ff8c00', LO = '#ffb84d', DO = '#cc5000', G = '#ff6600';
      ctx.save();

      if (ducking) {
        const bx = MONKEY_X - MONKEY_DW / 2, by = y;
        // Tail
        ctx.strokeStyle = DO; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.moveTo(bx + 6, by + 4);
        ctx.quadraticCurveTo(bx - 14, by - 8, bx - 5, by - 20); ctx.stroke();
        // Body
        ctx.shadowColor = G; ctx.shadowBlur = 14; ctx.fillStyle = O;
        rrPath(ctx, bx + 5, by + 2, MONKEY_DW - 22, MONKEY_DH - 4, 6); ctx.fill();
        // Head
        ctx.beginPath(); ctx.arc(bx + MONKEY_DW - 13, by + MONKEY_DH / 2, 14, 0, Math.PI * 2);
        ctx.fillStyle = O; ctx.fill();
        // Ear
        ctx.shadowBlur = 0; ctx.fillStyle = DO;
        ctx.beginPath(); ctx.arc(bx + MONKEY_DW - 24, by + MONKEY_DH / 2 - 9, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff4488';
        ctx.beginPath(); ctx.arc(bx + MONKEY_DW - 24, by + MONKEY_DH / 2 - 9, 3.5, 0, Math.PI * 2); ctx.fill();
        // Face
        ctx.fillStyle = LO;
        ctx.beginPath(); ctx.ellipse(bx + MONKEY_DW - 10, by + MONKEY_DH / 2 + 2, 9, 10, 0, 0, Math.PI * 2); ctx.fill();
        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(bx + MONKEY_DW - 6, by + MONKEY_DH / 2 - 3, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(bx + MONKEY_DW - 5, by + MONKEY_DH / 2 - 3, 1.8, 0, Math.PI * 2); ctx.fill();

      } else {
        const bx = MONKEY_X - MONKEY_W / 2, by = y;
        const runSin = Math.sin(animTick * 0.24);
        // Tail
        ctx.strokeStyle = DO; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.shadowBlur = 0;
        const tw = onGround ? Math.sin(animTick * 0.22) * 7 : 0;
        ctx.beginPath();
        ctx.moveTo(bx + 2, by + MONKEY_H * 0.55);
        ctx.quadraticCurveTo(bx - 17, by + MONKEY_H * 0.35 + tw, bx - 8, by + 5); ctx.stroke();
        // Legs
        ctx.shadowColor = G; ctx.shadowBlur = 8; ctx.fillStyle = O;
        const ll = onGround ? Math.round(runSin * 9) : 0;
        ctx.fillRect(bx + 4, by + MONKEY_H - 20 + (ll > 0 ? 0 : -ll), 11, 20 + (ll > 0 ? ll : 0));
        ctx.fillRect(bx + MONKEY_W - 15, by + MONKEY_H - 20 + (ll > 0 ? -ll : 0), 11, 20 + (ll > 0 ? 0 : ll));
        // Body
        ctx.shadowColor = G; ctx.shadowBlur = 14; ctx.fillStyle = O;
        rrPath(ctx, bx + 2, by + MONKEY_H * 0.35, MONKEY_W - 4, MONKEY_H * 0.58, 7); ctx.fill();
        // Arms
        ctx.fillStyle = O;
        const as = onGround ? Math.round(runSin * 7) : 0;
        if (!onGround) {
          ctx.fillRect(bx - 9, by + MONKEY_H * 0.35, 11, 16);
          ctx.fillRect(bx + MONKEY_W - 2, by + MONKEY_H * 0.35, 11, 16);
        } else {
          ctx.fillRect(bx - 7, by + MONKEY_H * 0.42 + as, 11, 17);
          ctx.fillRect(bx + MONKEY_W - 4, by + MONKEY_H * 0.42 - as, 11, 17);
        }
        // Head
        ctx.shadowColor = G; ctx.shadowBlur = 14; ctx.fillStyle = O;
        ctx.beginPath(); ctx.arc(bx + MONKEY_W / 2, by + 14, 15, 0, Math.PI * 2); ctx.fill();
        // Ears
        ctx.shadowBlur = 0; ctx.fillStyle = DO;
        ctx.beginPath(); ctx.arc(bx + 2, by + 7, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(bx + MONKEY_W - 2, by + 7, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff4488';
        ctx.beginPath(); ctx.arc(bx + 2, by + 7, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(bx + MONKEY_W - 2, by + 7, 3.5, 0, Math.PI * 2); ctx.fill();
        // Face
        ctx.fillStyle = LO;
        ctx.beginPath(); ctx.ellipse(bx + MONKEY_W / 2, by + 18, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(bx + MONKEY_W / 2 - 5, by + 12, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(bx + MONKEY_W / 2 + 5, by + 12, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(bx + MONKEY_W / 2 - 4, by + 12, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(bx + MONKEY_W / 2 + 6, by + 12, 2, 0, Math.PI * 2); ctx.fill();
        // Nose
        ctx.fillStyle = DO;
        ctx.beginPath(); ctx.ellipse(bx + MONKEY_W / 2, by + 21, 4.5, 3, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // ── Obstacles ─────────────────────────────────────────────────────────
    function drawObstacle(obs, tick) {
      const { x, type, w, h, yOff } = obs;
      const top = GROUND_Y - yOff - h;
      ctx.save();

      if (type.startsWith('cactus')) {
        ctx.fillStyle = '#cc00ff'; ctx.shadowColor = '#cc00ff'; ctx.shadowBlur = 18;
        const mid = x + w / 2;
        if (type === 'cactus_tall') {
          ctx.fillRect(mid - 8, top, 16, h);
          ctx.fillRect(mid - 24, top + h * 0.28, 16, 10);
          ctx.fillRect(mid - 24, top + h * 0.12, 10, h * 0.18);
          ctx.fillRect(mid + 8,  top + h * 0.40, 16, 10);
          ctx.fillRect(mid + 14, top + h * 0.24, 10, h * 0.18);
        } else if (type === 'cactus_short') {
          ctx.fillRect(mid - 9, top, 18, h);
          ctx.fillRect(mid - 22, top + h * 0.35, 14, 10);
          ctx.fillRect(mid + 9,  top + h * 0.42, 14, 10);
        } else {
          ctx.fillRect(x + 3,       top + 14, 16, h - 14);
          ctx.fillRect(x + w - 19,  top + 8,  16, h - 8);
          ctx.fillRect(x + 3,       top + h * 0.30, 12, 10);
          ctx.fillRect(x + w - 19,  top + h * 0.22, 12, 10);
        }

      } else {
        // Bird
        const cx = x + w / 2, cy = top + h / 2;
        const wb = Math.floor(tick / 10) % 2 === 0;
        ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 20;
        // Wings
        ctx.fillStyle = '#00ccff';
        const wd = wb ? 10 : -4;
        ctx.beginPath(); ctx.moveTo(cx - 6, cy);
        ctx.quadraticCurveTo(cx - w / 2, cy + wd, cx - w / 2 + 4, cy - h / 3); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx + 6, cy);
        ctx.quadraticCurveTo(cx + w / 2, cy + wd, cx + w / 2 - 4, cy - h / 3); ctx.closePath(); ctx.fill();
        // Body
        ctx.fillStyle = '#0099dd';
        ctx.beginPath(); ctx.ellipse(cx, cy, w / 2 - 6, h / 2 - 2, 0, 0, Math.PI * 2); ctx.fill();
        // Head
        ctx.fillStyle = '#00ccff';
        ctx.beginPath(); ctx.arc(cx + w / 2 - 13, cy - 3, 10, 0, Math.PI * 2); ctx.fill();
        // Eye + beak
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(cx + w / 2 - 9, cy - 5, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#001133';
        ctx.beginPath(); ctx.arc(cx + w / 2 - 8, cy - 5, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffbb00';
        ctx.beginPath();
        ctx.moveTo(cx + w / 2 - 3, cy - 4); ctx.lineTo(cx + w / 2 + 7, cy - 1);
        ctx.lineTo(cx + w / 2 - 3, cy + 2); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    function drawScanlines() {
      ctx.save(); ctx.globalAlpha = 0.04;
      for (let y = 0; y < LH; y += 4) { ctx.fillStyle = '#000'; ctx.fillRect(0, y, LW, 2); }
      ctx.restore();
    }

    // ── Update ────────────────────────────────────────────────────────────
    function update(dt, s) {
      if (s.status !== 'playing') return;
      const m = s.monkey;
      const inp = inputRef.current;
      const dt_60 = dt * 60; // normalize to 60 fps so physics are frame-rate independent

      // Duck (only on ground)
      m.ducking = inp.duckHeld && m.onGround;

      // Jump
      if (inp.jumpQ > 0) {
        inp.jumpQ = 0;
        if (m.jumpsLeft > 0) {
          m.vy = m.onGround ? JUMP_VY : DJUMP_VY;
          m.onGround = false;
          m.ducking = false;
          m.jumpsLeft--;
        }
      }

      // Physics — dt-scaled so jump height is consistent at any refresh rate
      m.vy += GRAVITY * dt_60;
      m.y  += m.vy * dt_60;
      const floor = GROUND_Y - (m.ducking ? MONKEY_DH : MONKEY_H);
      if (m.y >= floor) { m.y = floor; m.vy = 0; m.onGround = true; m.jumpsLeft = 2; }

      if (m.onGround && !m.ducking) m.animTick += dt_60;

      // Speed & score — dt-scaled
      s.speed = Math.min(MAX_SPEED, s.speed + SPEED_RAMP * dt_60);
      const px = s.speed * dt * 60;
      s.dist  += px;
      s.score += s.speed * 0.1 * dt_60;

      // Move & cull obstacles
      s.obstacles.forEach(o => { o.x -= px; });
      s.obstacles = s.obstacles.filter(o => o.x + o.w > -30);

      // Spawn
      if (s.dist >= s.nextObs) {
        const pool = s.speed > 9
          ? OBS_KEYS
          : OBS_KEYS.filter(k => k !== 'bird');
        const key = pool[Math.floor(Math.random() * pool.length)];
        s.obstacles.push({ x: LW + 20, type: key, ...OBS[key] });
        const gapSec = 0.9 + Math.random() * 1.4;
        s.nextObs = s.dist + Math.max(260, gapSec * s.speed * 60);
      }

      // Collision (AABB with leniency)
      // mB uses the monkey's ACTUAL bottom, not the fixed ground line —
      // without this fix, jumping never cleared obstacles because the
      // hitbox bottom stayed at GROUND_Y regardless of the monkey's position.
      const pad = 7;
      const mH = m.ducking ? MONKEY_DH : MONKEY_H;
      const mHalf = (m.ducking ? MONKEY_DW : MONKEY_W) / 2;
      const mL = MONKEY_X - mHalf + pad, mR = MONKEY_X + mHalf - pad;
      const mT = m.y + pad, mB = m.y + mH - pad;
      for (const o of s.obstacles) {
        if (
          mL < o.x + o.w - pad && mR > o.x + pad &&
          mT < GROUND_Y - o.yOff - pad && mB > GROUND_Y - o.yOff - o.h + pad
        ) {
          s.status = 'dead';
          setUi({ score: Math.floor(s.score), speed: s.speed, status: 'dead' });
          return;
        }
      }
      s.tick++;
    }

    // ── Draw ──────────────────────────────────────────────────────────────
    function draw(s) {
      ctx.clearRect(0, 0, LW, LH);
      drawBg(s.tick);
      drawGround(s.dist);
      s.obstacles.forEach(o => drawObstacle(o, s.tick));
      drawMonkey(s.monkey);
      drawScanlines();
      if (s.status === 'dead') {
        ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#ff0044';
        ctx.fillRect(0, 0, LW, LH); ctx.restore();
      }
    }

    // ── Tick ──────────────────────────────────────────────────────────────
    function tick(ts) {
      const dt = Math.min(0.05, (ts - lastTRef.current) / 1000);
      lastTRef.current = ts;
      const s = stateRef.current;
      if (!s) { animRef.current = requestAnimationFrame(tick); return; }
      update(dt, s);
      draw(s);
      if (s.status === 'playing' && s.tick % 6 === 0) {
        setUi({ score: Math.floor(s.score), speed: s.speed, status: 'playing' });
      }
      animRef.current = requestAnimationFrame(tick);
    }

    lastTRef.current = performance.now();
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#030010', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,12,0.28)', zIndex: 2 }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3, backgroundImage: 'linear-gradient(rgba(0,0,0,0.055) 50%, transparent 50%)', backgroundSize: '100% 4px' }} />

      <Link to="/" style={{ position: 'absolute', top: 22, left: 24, zIndex: 20, fontFamily: "'Orbitron', sans-serif", fontSize: 10, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase', transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
      >← BACK</Link>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        {/* HUD */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: DW, fontFamily: "'Orbitron', sans-serif", fontSize: isMobile ? 11 : 13, color: '#fff', letterSpacing: '0.08em', padding: '0 4px', boxSizing: 'border-box' }}>
          <div>
            <span style={{ color: '#ffe066', textShadow: '0 0 10px #ffcc00' }}>SCORE </span>
            <span>{ui.score.toLocaleString()}</span>
          </div>
          <div style={{ color: '#ff8c00', textShadow: '0 0 10px #ff6600' }}>
            {Math.round(ui.speed * 10) / 10}x SPEED
          </div>
        </div>

        {/* Canvas */}
        <div style={{ border: '2px solid rgba(0,180,255,0.4)', borderRadius: 4, boxShadow: '0 0 32px rgba(0,100,255,0.28), inset 0 0 24px rgba(0,0,40,0.85)', overflow: 'hidden' }}>
          <canvas ref={canvasRef} width={LW} height={LH} style={{ display: 'block', width: DW, height: DH }} />
        </div>

        {/* Controls */}
        <div style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          {isMobile ? 'TAP TOP → JUMP • TAP BOTTOM → DUCK' : 'SPACE / ↑ → JUMP (2×) • ↓ → DUCK'}
        </div>
      </div>

      <Leaderboard
        apiUrl={`${process.env.REACT_APP_SERVER_URL}/leaderboard/infinity-run`}
        score={ui.score}
        sessionToken={sessionTokenRef.current}
        onPlayAgain={handlePlayAgain}
        visible={lbVisible}
      />
    </div>
  );
}

export default InfinityRunGame;
