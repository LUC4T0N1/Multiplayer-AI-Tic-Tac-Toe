import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MeshBackground from '../../ui/MeshBackground';
import WaveAnimation from '../../ui/WaveAnimation';
import isMobile from '../../../utils/isMobile';

const COLS = 21;
const ROWS = 22;

const MAZE_TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,3,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,2,0,2,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,0,0,0,0,1,1,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,1,4,1,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,1,0,0,0,0,0,1,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,0,0,0,0,0,1,0,0,2,0,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,2,0,2,2,2,2,2,2,1,2,3,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const GHOST_COLORS = ['#ff2222', '#ffb8ff', '#00e5ff', '#ffb852'];
const EXIT_COL = 10;
const EXIT_ROW = 6;

function buildMaze() { return MAZE_TEMPLATE.map(r => [...r]); }
function countDots(maze) {
  let n = 0;
  maze.forEach(row => row.forEach(v => { if (v === 2 || v === 3) n++; }));
  return n;
}

function levelConfig(level) {
  const L = Math.min(level, 7);
  const delays = [
    [0, 6, 12, 18], [0, 5,  9, 15], [0, 4,  7, 12],
    [0, 3,  5,  9], [0, 2,  4,  7], [0, 1,  3,  5], [0, 0,  2,  3],
  ][L - 1];
  return {
    pacSpeed:         Math.max(0.11, 0.22 - (L - 1) * 0.016),
    ghostSpeed:       Math.max(0.15, 0.30 - (L - 1) * 0.023),
    frightenDuration: Math.max(3,    9    - (L - 1) * 0.9),
    releaseDelays: delays,
  };
}

function lp(a, b, t) { return a + (b - a) * Math.min(1, Math.max(0, t)); }

function PacmanGame() {
  const canvasRef    = useRef(null);
  const stateRef     = useRef(null);
  const animRef      = useRef(null);
  const lastTRef     = useRef(0);
  const lbVisibleRef = useRef(false);

  const [ui, setUi] = useState({ score: 0, lives: 3, level: 1, status: 'playing' });
  const [lb, setLb] = useState({
    visible: false, data: [], page: 1, loading: false,
    saved: false, saving: false, name: '', error: null, hasMore: false,
  });

  const CELL = isMobile
    ? Math.floor(Math.min(window.innerWidth * 0.95, 360) / COLS)
    : 28;
  const CW = CELL * COLS;
  const CH = CELL * ROWS;

  const initState = useCallback((level = 1, score = 0, lives = 3) => {
    const cfg  = levelConfig(level);
    const maze = buildMaze();
    return {
      maze,
      totalDots: countDots(maze),
      dotsLeft:  countDots(maze),
      score, lives, level,
      status: 'playing',
      levelCompleteTimer: 0,
      pacman: {
        x: 10, y: 16, prevX: 10, prevY: 16,
        dx: 0, dy: 0, nextDx: 0, nextDy: 0,
        animT: 0, moveAccum: 0,
      },
      ghosts: GHOST_COLORS.map((color, i) => {
        const sx = i === 0 ? EXIT_COL : (9 + (i - 1));
        const sy = i === 0 ? EXIT_ROW : 9;
        return {
          color, x: sx, y: sy, prevX: sx, prevY: sy,
          dx: 0, dy: 0,
          mode: i === 0 ? 'chase' : 'house',
          releaseTimer: cfg.releaseDelays[i],
          frightTimer: 0,
          moveAccum: 0, lastMoveSpeed: cfg.ghostSpeed,
          bounceDir: 1, bounceAccum: 0,
          homeX: sx, homeY: sy,
        };
      }),
      pacSpeed:         cfg.pacSpeed,
      ghostSpeed:       cfg.ghostSpeed,
      frightenDuration: cfg.frightenDuration,
      ghostEatCombo: 0,
      deathAnim: 0,
      deathAnimating: false,
    };
  }, []);

  const fetchLb = useCallback(async (page) => {
    setLb(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res  = await fetch(`${process.env.REACT_APP_SERVER_URL}/leaderboard/pacman?page=${page}`);
      const json = await res.json();
      const data = json.data || [];
      setLb(prev => ({ ...prev, data, page, loading: false, hasMore: data.length === 20 }));
    } catch {
      setLb(prev => ({ ...prev, loading: false, error: 'Erro ao carregar.' }));
    }
  }, []);

  useEffect(() => {
    stateRef.current = initState(1);
    setUi({ score: 0, lives: 3, level: 1, status: 'playing' });
  }, [initState]);

  // Show leaderboard when game over
  useEffect(() => {
    if (ui.status === 'dead') {
      lbVisibleRef.current = true;
      setLb({ visible: true, data: [], page: 1, loading: false, saved: false, saving: false, name: '', error: null, hasMore: false });
      fetchLb(1);
    }
  }, [ui.status, fetchLb]);

  const restart = useCallback(() => {
    stateRef.current = initState(1);
    setUi({ score: 0, lives: 3, level: 1, status: 'playing' });
  }, [initState]);

  const nextLevel = useCallback((score, lives, level) => {
    const lvl = level + 1;
    stateRef.current = initState(lvl, score, lives);
    setUi({ score, lives, level: lvl, status: 'playing' });
  }, [initState]);

  const saveScore = async () => {
    if (!lb.name.trim() || lb.saving || lb.saved) return;
    setLb(prev => ({ ...prev, saving: true, error: null }));
    try {
      const res = await fetch(`${process.env.REACT_APP_SERVER_URL}/leaderboard/pacman`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: lb.name.trim(), score: ui.score }),
      });
      if (!res.ok) throw new Error();
      setLb(prev => ({ ...prev, saved: true, saving: false }));
      fetchLb(lb.page);
    } catch {
      setLb(prev => ({ ...prev, saving: false, error: 'Erro ao salvar.' }));
    }
  };

  const handlePlayAgain = () => {
    lbVisibleRef.current = false;
    setLb(prev => ({ ...prev, visible: false }));
    restart();
  };

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const s = stateRef.current;
      if (!s) return;
      if (s.status === 'dead') {
        if (!lbVisibleRef.current && (e.key === 'Enter' || e.key === ' ')) restart();
        return;
      }
      if (s.status === 'levelComplete') return;
      const MAP = {
        ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
        w:[0,-1], s:[0,1], a:[-1,0], d:[1,0],
      };
      const d = MAP[e.key];
      if (d) { s.pacman.nextDx = d[0]; s.pacman.nextDy = d[1]; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [restart]);

  // ── Touch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let tx = 0, ty = 0;
    const onStart = (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; };
    const onEnd   = (e) => {
      const s = stateRef.current;
      if (!s) return;
      if (s.status === 'dead') { if (!lbVisibleRef.current) restart(); return; }
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > Math.abs(dy)) { s.pacman.nextDx = dx > 0 ? 1 : -1; s.pacman.nextDy = 0; }
      else                             { s.pacman.nextDy = dy > 0 ? 1 : -1; s.pacman.nextDx = 0; }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend',   onEnd);
    };
  }, [restart]);

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function wrapX(x) { return ((x % COLS) + COLS) % COLS; }
    function canMove(maze, x, y, dx, dy) {
      const ny = y + dy, wnx = wrapX(x + dx);
      if (ny < 0 || ny >= ROWS) return false;
      return maze[ny][wnx] !== 1;
    }

    // ── Ghost AI ────────────────────────────────────────────────────────────
    function ghostAI(g, pm, maze, dt, s) {
      if (g.mode === 'house') {
        g.releaseTimer -= dt;
        if (g.releaseTimer <= 0) { g.mode = 'exiting'; g.moveAccum = 0; return; }
        g.bounceAccum += dt;
        if (g.bounceAccum >= 0.35) {
          g.bounceAccum = 0;
          const nx = g.x + g.bounceDir;
          g.prevX = g.x;
          if (nx < 8 || nx > 12 || maze[g.y][nx] === 1) { g.bounceDir = -g.bounceDir; }
          else { g.x = nx; }
        }
        return;
      }

      if (g.mode === 'exiting') {
        g.moveAccum += dt;
        if (g.moveAccum < s.ghostSpeed) return;
        g.lastMoveSpeed = s.ghostSpeed;
        g.prevX = g.x; g.prevY = g.y;
        g.moveAccum = 0;
        if (g.y > EXIT_ROW) {
          if (g.x !== EXIT_COL) {
            const dx = g.x < EXIT_COL ? 1 : -1;
            if (canMove(maze, g.x, g.y, dx, 0)) g.x += dx;
            else if (canMove(maze, g.x, g.y, 0, -1)) g.y--;
          } else {
            if (canMove(maze, g.x, g.y, 0, -1)) g.y--;
          }
        } else {
          g.mode = 'chase'; g.dx = 1; g.dy = 0;
        }
        return;
      }

      const OPP = { '1,0':'-1,0', '-1,0':'1,0', '0,1':'0,-1', '0,-1':'0,1' };
      const ALL = [[1,0],[-1,0],[0,1],[0,-1]];

      if (g.mode === 'frightened') {
        g.frightTimer -= dt;
        if (g.frightTimer <= 0) { g.mode = 'chase'; return; }
        const speed = s.ghostSpeed * 1.8;
        g.moveAccum += dt;
        if (g.moveAccum < speed) return;
        g.lastMoveSpeed = speed;
        g.prevX = g.x; g.prevY = g.y;
        g.moveAccum = 0;
        const curKey = `${g.dx},${g.dy}`;
        let valid = ALL.filter(([dx,dy]) =>
          `${dx},${dy}` !== OPP[curKey] && canMove(maze, g.x, g.y, dx, dy));
        if (!valid.length) valid = ALL.filter(([dx,dy]) => canMove(maze, g.x, g.y, dx, dy));
        if (!valid.length) return;
        const pick = valid[Math.floor(Math.random() * valid.length)];
        g.dx = pick[0]; g.dy = pick[1];
        g.x = wrapX(g.x + g.dx);
        g.y = Math.max(0, Math.min(ROWS - 1, g.y + g.dy));
        return;
      }

      // chase
      g.moveAccum += dt;
      if (g.moveAccum < s.ghostSpeed) return;
      g.lastMoveSpeed = s.ghostSpeed;
      g.prevX = g.x; g.prevY = g.y;
      g.moveAccum = 0;
      const curKey = `${g.dx},${g.dy}`;
      let valid = ALL.filter(([dx,dy]) =>
        `${dx},${dy}` !== OPP[curKey] && canMove(maze, g.x, g.y, dx, dy));
      if (!valid.length) valid = ALL.filter(([dx,dy]) => canMove(maze, g.x, g.y, dx, dy));
      if (!valid.length) return;
      const tx = pm.x, ty = pm.y;
      const best = valid.reduce((b, d) => {
        const dist  = (wrapX(g.x + d[0]) - tx) ** 2 + (g.y + d[1] - ty) ** 2;
        const bdist = (wrapX(g.x + b[0]) - tx) ** 2 + (g.y + b[1] - ty) ** 2;
        return dist < bdist ? d : b;
      });
      g.dx = best[0]; g.dy = best[1];
      g.x = wrapX(g.x + g.dx);
      g.y = Math.max(0, Math.min(ROWS - 1, g.y + g.dy));
    }

    // ── Draw ────────────────────────────────────────────────────────────────
    function draw(s, ts) {
      const C = CELL;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#04000e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      s.maze.forEach((row, ry) => {
        row.forEach((cell, cx) => {
          const px = cx * C, py = ry * C;
          if (cell === 1) {
            ctx.fillStyle = '#080038';
            ctx.fillRect(px, py, C, C);
            ctx.strokeStyle = '#0055dd';
            ctx.shadowColor = '#0088ff'; ctx.shadowBlur = 5;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(px + 0.75, py + 0.75, C - 1.5, C - 1.5);
            ctx.shadowBlur = 0;
          } else if (cell === 2) {
            ctx.fillStyle = '#ffe066'; ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 4;
            ctx.beginPath(); ctx.arc(px + C/2, py + C/2, C * 0.10, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
          } else if (cell === 3) {
            const p = 0.65 + 0.35 * Math.sin(ts * 0.005);
            ctx.fillStyle = `rgba(255,170,0,${p})`; ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 14;
            ctx.beginPath(); ctx.arc(px + C/2, py + C/2, C * 0.27, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
          } else if (cell === 4) {
            ctx.fillStyle = '#ff66bb';
            ctx.fillRect(px, py + C*0.4, C, C*0.2);
          }
        });
      });

      // Ghosts (interpolated)
      s.ghosts.forEach(g => {
        const doLerp = g.mode !== 'house';
        const t_g = doLerp && g.lastMoveSpeed > 0 ? g.moveAccum / g.lastMoveSpeed : 1;
        const noWrapX = Math.abs(g.x - g.prevX) <= 1;
        const rgx = doLerp && noWrapX ? lp(g.prevX, g.x, t_g) : g.x;
        const rgy = doLerp ? lp(g.prevY, g.y, t_g) : g.y;
        const px  = rgx * C + C/2;
        const py  = rgy * C + C/2;
        const r   = C * 0.42;
        const frightBlink = g.mode === 'frightened' && g.frightTimer < 2 && Math.sin(ts * 0.018) > 0;
        const col = g.mode === 'frightened' ? (frightBlink ? '#fff' : '#2244ff') : g.color;

        ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py - r*0.1, r, Math.PI, 0);
        ctx.lineTo(px + r, py + r*0.88);
        for (let i = 0; i < 3; i++) {
          const bx = px + r - (r*2/3)*i;
          ctx.quadraticCurveTo(bx - r/3, py + r*1.28, bx - r*2/3, py + r*0.88);
        }
        ctx.lineTo(px - r, py - r*0.1);
        ctx.closePath(); ctx.fill();

        ctx.shadowBlur = 0;
        if (g.mode !== 'frightened') {
          const edx = (g.mode === 'chase' ? g.dx : 0) * r * 0.09;
          const edy = (g.mode === 'chase' ? g.dy : 0) * r * 0.09;
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.ellipse(px-r*0.28, py-r*0.08, r*0.17, r*0.23, 0, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(px+r*0.28, py-r*0.08, r*0.17, r*0.23, 0, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#000d';
          ctx.beginPath(); ctx.arc(px-r*0.28+edx, py-r*0.08+edy, r*0.10, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(px+r*0.28+edx, py-r*0.08+edy, r*0.10, 0, Math.PI*2); ctx.fill();
        } else {
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(px-r*0.30, py, r*0.10, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(px+r*0.30, py, r*0.10, 0, Math.PI*2); ctx.fill();
        }
      });

      // Pacman (interpolated)
      const pm   = s.pacman;
      const t_pm = s.pacSpeed > 0 ? pm.moveAccum / s.pacSpeed : 1;
      const noWrapPm = Math.abs(pm.x - pm.prevX) <= 1;
      const rpx  = noWrapPm ? lp(pm.prevX, pm.x, t_pm) : pm.x;
      const rpy  = lp(pm.prevY, pm.y, t_pm);
      const ppx  = rpx * C + C/2;
      const ppy  = rpy * C + C/2;
      const pr   = C * 0.44;

      const isMoving = pm.dx !== 0 || pm.dy !== 0;
      const mouthOpen = s.deathAnimating
        ? s.deathAnim * Math.PI
        : isMoving
          ? 0.25 * Math.abs(Math.sin(t_pm * Math.PI))
          : 0.12;
      const angle = Math.atan2(pm.dy, pm.dx === 0 && pm.dy === 0 ? 1 : (pm.dx || 1));

      ctx.fillStyle = '#ffee00'; ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 14;
      ctx.beginPath();
      if (s.deathAnimating) {
        ctx.arc(ppx, ppy, pr, angle + mouthOpen, angle + Math.PI*2 - mouthOpen);
        ctx.lineTo(ppx, ppy);
      } else {
        ctx.moveTo(ppx, ppy);
        ctx.arc(ppx, ppy, pr, angle + mouthOpen, angle + Math.PI*2 - mouthOpen);
      }
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;

      // Level complete overlay only (game over handled by React modal)
      if (s.status === 'levelComplete') {
        ctx.fillStyle = 'rgba(0,0,12,0.65)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign  = 'center';
        ctx.fillStyle  = '#00ffcc';
        ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 22;
        ctx.font = `bold ${Math.round(C*1.3)}px Orbitron, sans-serif`;
        ctx.fillText(`LEVEL ${s.level} CLEAR!`, canvas.width/2, canvas.height/2 - C);
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `${Math.round(C*0.65)}px Orbitron, sans-serif`;
        ctx.fillText('NEXT LEVEL INCOMING...', canvas.width/2, canvas.height/2 + C*0.7);
      }
    }

    // ── Tick ────────────────────────────────────────────────────────────────
    function tick(ts) {
      const dt = Math.min(0.05, (ts - lastTRef.current) / 1000);
      lastTRef.current = ts;
      const s = stateRef.current;
      if (!s) { animRef.current = requestAnimationFrame(tick); return; }

      if (s.status === 'levelComplete') {
        s.levelCompleteTimer += dt;
        if (s.levelCompleteTimer >= 2.5) nextLevel(s.score, s.lives, s.level);
        draw(s, ts);
        animRef.current = requestAnimationFrame(tick); return;
      }
      if (s.status === 'dead') {
        draw(s, ts);
        animRef.current = requestAnimationFrame(tick); return;
      }

      if (s.deathAnimating) {
        s.deathAnim += dt * 1.8;
        if (s.deathAnim >= 1) {
          s.deathAnimating = false; s.deathAnim = 0;
          if (s.lives <= 0) { s.status = 'dead'; setUi(u => ({...u, status:'dead'})); }
          else resetPositions(s);
        }
        draw(s, ts);
        animRef.current = requestAnimationFrame(tick); return;
      }

      // Pacman move
      const pm = s.pacman;
      pm.animT += dt;
      pm.moveAccum += dt;
      if (pm.moveAccum >= s.pacSpeed) {
        pm.prevX = pm.x; pm.prevY = pm.y;
        pm.moveAccum = 0;
        if (canMove(s.maze, pm.x, pm.y, pm.nextDx, pm.nextDy)) {
          pm.dx = pm.nextDx; pm.dy = pm.nextDy;
        }
        if (canMove(s.maze, pm.x, pm.y, pm.dx, pm.dy)) {
          pm.x = wrapX(pm.x + pm.dx);
          pm.y = Math.max(0, Math.min(ROWS - 1, pm.y + pm.dy));
        }
        const cell = s.maze[pm.y][pm.x];
        if (cell === 2) { s.maze[pm.y][pm.x] = 0; s.score += 10; s.dotsLeft--; }
        else if (cell === 3) {
          s.maze[pm.y][pm.x] = 0; s.score += 50; s.dotsLeft--;
          s.ghostEatCombo = 0;
          s.ghosts.forEach(g => {
            if (g.mode === 'chase') { g.mode = 'frightened'; g.frightTimer = s.frightenDuration; }
          });
        }
        if (s.dotsLeft <= 0) {
          s.status = 'levelComplete'; s.levelCompleteTimer = 0;
          setUi(u => ({...u, status:'levelComplete', score:s.score}));
        }
      }

      // Ghosts
      s.ghosts.forEach(g => ghostAI(g, pm, s.maze, dt, s));

      // Collision
      let died = false;
      s.ghosts.forEach(g => {
        if (g.mode === 'house' || g.mode === 'exiting') return;
        if (Math.abs(g.x - pm.x) < 1 && Math.abs(g.y - pm.y) < 1) {
          if (g.mode === 'frightened') {
            g.mode = 'house'; g.x = g.homeX; g.y = g.homeY; g.prevX = g.homeX; g.prevY = g.homeY;
            g.dx = 0; g.dy = 0; g.releaseTimer = 3; g.moveAccum = 0; g.bounceAccum = 0; g.bounceDir = 1;
            s.ghostEatCombo++;
            s.score += 200 * Math.pow(2, s.ghostEatCombo - 1);
          } else if (!died) {
            died = true; s.lives--;
            s.deathAnimating = true;
            setUi(u => ({...u, lives:s.lives, score:s.score}));
          }
        }
      });

      setUi(u => ({...u, score:s.score}));
      draw(s, ts);
      animRef.current = requestAnimationFrame(tick);
    }

    lastTRef.current = performance.now();
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [CELL, nextLevel]);

  function resetPositions(s) {
    const pm = s.pacman;
    pm.x = 10; pm.y = 16; pm.prevX = 10; pm.prevY = 16;
    pm.dx = 0; pm.dy = 0; pm.nextDx = 0; pm.nextDy = 0; pm.moveAccum = 0;
    const cfg = levelConfig(s.level);
    s.ghosts.forEach((g, i) => {
      g.x = g.homeX; g.y = g.homeY; g.prevX = g.homeX; g.prevY = g.homeY;
      g.dx = 0; g.dy = 0;
      g.mode = i === 0 ? 'chase' : 'house';
      g.releaseTimer = cfg.releaseDelays[i];
      g.frightTimer = 0; g.moveAccum = 0; g.lastMoveSpeed = cfg.ghostSpeed;
      g.bounceAccum = 0; g.bounceDir = 1;
    });
    s.ghostEatCombo = 0;
  }

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#050010',
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      <MeshBackground zIndex={0} />
      {!isMobile && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: 0.35, pointerEvents: 'none' }}>
          <WaveAnimation particleColor="#ffffff" waveSpeed={1.5} waveIntensity={12} pointSize={1.5} gridDistance={5} />
        </div>
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,12,0.38)', zIndex: 2 }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.055) 50%, transparent 50%)',
        backgroundSize: '100% 4px',
      }} />
      <Link to="/" style={{
        position: 'absolute', top: 22, left: 24, zIndex: 20,
        fontFamily: "'Orbitron', sans-serif", fontSize: 10, letterSpacing: '0.14em',
        color: 'rgba(255,255,255,0.35)', textDecoration: 'none', textTransform: 'uppercase',
        transition: 'color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
      >← BACK</Link>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: CW, fontFamily: "'Orbitron', sans-serif", fontSize: isMobile ? 11 : 13,
          color: '#fff', letterSpacing: '0.08em', padding: '0 4px', boxSizing: 'border-box',
        }}>
          <div>
            <span style={{ color: '#ffe066', textShadow: '0 0 10px #ffcc00' }}>SCORE </span>
            <span>{ui.score}</span>
          </div>
          <div style={{ color: '#cc00ff', textShadow: '0 0 10px #cc00ff' }}>LVL {ui.level}</div>
          <div style={{ color: '#ff2d78', textShadow: '0 0 8px #ff2d78' }}>
            {'♥'.repeat(Math.max(0, ui.lives))}
          </div>
        </div>

        <div style={{
          border: '2px solid rgba(0,180,255,0.4)', borderRadius: 4,
          boxShadow: '0 0 32px rgba(0,100,255,0.28), inset 0 0 24px rgba(0,0,40,0.85)',
          overflow: 'hidden',
        }}>
          <canvas ref={canvasRef} width={CW} height={CH} style={{ display: 'block' }} />
        </div>

        <div style={{
          fontFamily: "'VT323', monospace", fontSize: 14, color: 'rgba(255,255,255,0.28)',
          letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
          {isMobile ? 'SWIPE TO MOVE' : 'WASD / ARROW KEYS'}
        </div>
      </div>

      {/* ── Leaderboard overlay ───────────────────────────────────────────── */}
      {lb.visible && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(4,0,18,0.93)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto',
        }}>
          {/* Scanlines on overlay */}
          <div style={{
            position: 'fixed', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.055) 50%, transparent 50%)',
            backgroundSize: '100% 4px',
          }} />

          <div style={{
            position: 'relative', width: '100%', maxWidth: 520,
            background: 'rgba(4,0,18,0.97)',
            border: '1.5px solid rgba(255,45,120,0.35)',
            borderRadius: 8,
            boxShadow: '0 0 50px rgba(255,45,120,0.14), 0 0 100px rgba(180,0,255,0.07), inset 0 0 40px rgba(100,0,255,0.04)',
            padding: isMobile ? '24px 16px 20px' : '32px 30px 26px',
          }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                fontFamily: "'VT323', monospace", fontSize: 14,
                color: '#ff2d78', letterSpacing: '0.5em',
                textShadow: '0 0 10px #ff2d7888', marginBottom: 6, opacity: 0.8,
              }}>✦ ✦ ✦</div>
              <div style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: isMobile ? 22 : 28,
                fontWeight: 900, letterSpacing: '0.1em',
                color: '#ff2d78',
                textShadow: '0 0 18px #ff2d78, 0 0 36px #ff2d7840',
              }}>GAME OVER</div>
              <div style={{
                marginTop: 6,
                fontFamily: "'Orbitron', sans-serif", fontSize: 13,
                color: '#ffe066', letterSpacing: '0.12em',
                textShadow: '0 0 10px #ffcc00',
              }}>
                SCORE: <span style={{ fontWeight: 900 }}>{ui.score.toLocaleString()}</span>
              </div>
            </div>

            {/* Divider */}
            <div style={{
              height: 1, marginBottom: 20,
              background: 'linear-gradient(90deg, transparent, #ff2d78, #cc00ff, #00e5ff, transparent)',
              boxShadow: '0 0 8px #ff2d7855',
            }} />

            {/* Save section */}
            {!lb.saved ? (
              <div style={{ marginBottom: 22 }}>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif", fontSize: 9,
                  color: '#00e5ff', letterSpacing: '0.22em', marginBottom: 10,
                  textShadow: '0 0 6px #00e5ff', textTransform: 'uppercase',
                }}>Salvar placar</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    autoFocus
                    value={lb.name}
                    onChange={e => setLb(prev => ({ ...prev, name: e.target.value.slice(0, 20) }))}
                    onKeyDown={e => { if (e.key === 'Enter') saveScore(); e.stopPropagation(); }}
                    placeholder="SEU NOME"
                    maxLength={20}
                    style={{
                      flex: 1, padding: '10px 14px',
                      background: 'rgba(0,229,255,0.05)',
                      border: '1.5px solid rgba(0,229,255,0.30)',
                      borderRadius: 3, color: '#fff',
                      fontFamily: "'Orbitron', sans-serif", fontSize: 11,
                      letterSpacing: '0.1em', outline: 'none',
                      boxShadow: '0 0 0 0 transparent',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.7)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(0,229,255,0.30)'}
                  />
                  <button
                    onClick={saveScore}
                    disabled={!lb.name.trim() || lb.saving}
                    style={{
                      padding: '10px 20px',
                      background: lb.name.trim() && !lb.saving ? 'rgba(0,229,255,0.12)' : 'rgba(0,229,255,0.04)',
                      border: '1.5px solid rgba(0,229,255,0.45)',
                      borderRadius: 3, color: '#00e5ff',
                      fontFamily: "'Orbitron', sans-serif", fontSize: 11,
                      cursor: lb.name.trim() && !lb.saving ? 'pointer' : 'not-allowed',
                      letterSpacing: '0.1em', fontWeight: 700,
                      opacity: lb.name.trim() && !lb.saving ? 1 : 0.45,
                      boxShadow: lb.name.trim() ? '0 0 12px rgba(0,229,255,0.2)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >{lb.saving ? '...' : 'SALVAR'}</button>
                </div>
                {lb.error && (
                  <div style={{
                    color: '#ff2d78', fontSize: 9, marginTop: 5,
                    fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.1em',
                  }}>{lb.error}</div>
                )}
                <button
                  onClick={handlePlayAgain}
                  style={{
                    marginTop: 10, background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.28)', fontFamily: "'Orbitron', sans-serif",
                    fontSize: 9, letterSpacing: '0.15em', cursor: 'pointer',
                    textTransform: 'uppercase', transition: 'color 0.15s', padding: 0,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
                >jogar novamente sem salvar →</button>
              </div>
            ) : (
              <div style={{ marginBottom: 22, textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif", fontSize: 11,
                  color: '#00ffcc', textShadow: '0 0 10px #00ffcc',
                  letterSpacing: '0.12em', marginBottom: 14,
                }}>✓ PLACAR SALVO!</div>
                <button
                  onClick={handlePlayAgain}
                  style={{
                    padding: '12px 36px',
                    background: 'rgba(255,45,120,0.10)',
                    border: '2px solid #ff2d78',
                    borderRadius: 3, color: '#ff2d78',
                    fontFamily: "'Orbitron', sans-serif", fontSize: 13,
                    cursor: 'pointer', letterSpacing: '0.12em', fontWeight: 700,
                    boxShadow: '0 0 18px rgba(255,45,120,0.28)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,45,120,0.20)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(255,45,120,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,45,120,0.10)'; e.currentTarget.style.boxShadow = '0 0 18px rgba(255,45,120,0.28)'; }}
                >JOGAR NOVAMENTE</button>
              </div>
            )}

            {/* Leaderboard table */}
            <div style={{
              fontFamily: "'Orbitron', sans-serif", fontSize: 9,
              color: '#c200ff', letterSpacing: '0.22em', marginBottom: 10,
              textShadow: '0 0 6px #c200ff', textTransform: 'uppercase',
            }}>Ranking</div>

            {lb.loading ? (
              <div style={{
                textAlign: 'center', padding: '24px 0',
                fontFamily: "'VT323', monospace", fontSize: 22,
                color: 'rgba(194,0,255,0.55)', letterSpacing: '0.3em',
              }}>LOADING...</div>
            ) : lb.data.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '24px 0',
                fontFamily: "'VT323', monospace", fontSize: 18,
                color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em',
              }}>NENHUM PLACAR AINDA</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['#', 'NOME', 'SCORE', 'DATA'].map((h, i) => (
                      <th key={h} style={{
                        fontFamily: "'Orbitron', sans-serif", fontSize: 8,
                        color: '#c200ff', letterSpacing: '0.18em', fontWeight: 700,
                        padding: '5px 8px',
                        textAlign: i === 0 ? 'center' : i === 2 ? 'right' : 'left',
                        borderBottom: '1px solid rgba(194,0,255,0.18)',
                        textTransform: 'uppercase',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lb.data.map((row, idx) => {
                    const rank = (lb.page - 1) * 20 + idx + 1;
                    const medalColor = rank === 1 ? '#ffe066' : rank === 2 ? '#b0b8c8' : rank === 3 ? '#ff8844' : null;
                    return (
                      <tr key={row.id} style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: idx % 2 === 0 ? 'rgba(255,255,255,0.018)' : 'transparent',
                      }}>
                        <td style={{
                          textAlign: 'center', padding: '6px 8px',
                          fontFamily: "'VT323', monospace", fontSize: 18,
                          color: medalColor || 'rgba(255,255,255,0.35)',
                          textShadow: medalColor ? `0 0 8px ${medalColor}` : 'none',
                        }}>{rank}</td>
                        <td style={{
                          padding: '6px 8px',
                          fontFamily: "'Orbitron', sans-serif", fontSize: 10,
                          color: '#e0e0ff', letterSpacing: '0.04em',
                          maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{row.name}</td>
                        <td style={{
                          padding: '6px 8px', textAlign: 'right',
                          fontFamily: "'VT323', monospace", fontSize: 20,
                          color: '#ffe066', textShadow: '0 0 6px #ffcc0066',
                        }}>{Number(row.score).toLocaleString()}</td>
                        <td style={{
                          padding: '6px 8px',
                          fontFamily: "'Orbitron', sans-serif", fontSize: 8,
                          color: 'rgba(255,255,255,0.28)', letterSpacing: '0.05em',
                          whiteSpace: 'nowrap',
                        }}>{fmtDate(row.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {!lb.loading && (lb.page > 1 || lb.hasMore) && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 14, marginTop: 16,
              }}>
                <button
                  onClick={() => fetchLb(lb.page - 1)}
                  disabled={lb.page === 1}
                  style={{
                    width: 32, height: 32,
                    background: 'rgba(0,229,255,0.06)',
                    border: `1px solid ${lb.page === 1 ? 'rgba(0,229,255,0.12)' : 'rgba(0,229,255,0.35)'}`,
                    borderRadius: 3, color: lb.page === 1 ? 'rgba(0,229,255,0.2)' : '#00e5ff',
                    cursor: lb.page === 1 ? 'not-allowed' : 'pointer',
                    fontFamily: "'VT323', monospace", fontSize: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >{'<'}</button>
                <span style={{
                  fontFamily: "'Orbitron', sans-serif", fontSize: 9,
                  color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em',
                }}>PÁG {lb.page}</span>
                <button
                  onClick={() => fetchLb(lb.page + 1)}
                  disabled={!lb.hasMore}
                  style={{
                    width: 32, height: 32,
                    background: 'rgba(0,229,255,0.06)',
                    border: `1px solid ${!lb.hasMore ? 'rgba(0,229,255,0.12)' : 'rgba(0,229,255,0.35)'}`,
                    borderRadius: 3, color: !lb.hasMore ? 'rgba(0,229,255,0.2)' : '#00e5ff',
                    cursor: !lb.hasMore ? 'not-allowed' : 'pointer',
                    fontFamily: "'VT323', monospace", fontSize: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >{'>'}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PacmanGame;
