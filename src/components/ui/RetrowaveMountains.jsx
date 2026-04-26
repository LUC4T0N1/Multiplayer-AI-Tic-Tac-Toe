import { useEffect, useRef } from 'react';

function RetrowaveMountains({ opacity = 1, zIndex = 2 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');

    const COLS = 34, W_WIDE = 22, H_MAX = 5.2;
    const Z_NEAR = 0.18, Z_FAR = 22;
    const ROW_STEP = (Z_FAR - Z_NEAR) / 45;
    const CAM_Y = 1.2, FOV = 290, HRZ = 0.46, SPEED = 1.4;
    let W = 0, H = 0, scrollZ = 0, lastT = 0, stars = [], animId;

    function seeded(s) { return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

    function th(wx, wz) {
      const nx = wx / (W_WIDE / 2);
      const prof = Math.max(0, Math.pow(Math.abs(nx) - 0.20, 0.70) * 1.55);
      const v = Math.sin(wx * 0.40 + wz * 0.22) * 0.38 + Math.sin(wx * 0.95 - wz * 0.16) * 0.28
        + Math.sin(wx * 0.22 + wz * 0.48) * 0.20 + Math.cos(wx * 0.70 + wz * 0.10) * 0.15
        + Math.sin(wx * 1.80 + wz * 0.32) * 0.20 + Math.sin(wx * 3.20 + wz * 0.18) * 0.14
        + Math.sin(wx * 0.14 - wz * 0.60) * 0.08;
      return prof * H_MAX * Math.max(0, (v + 1.43) / 2.86 * 0.80 + 0.20);
    }

    function proj(wx, wy, rz) {
      if (rz <= 0.001) return null;
      return { x: W / 2 + (wx / rz) * FOV, y: H * HRZ + (CAM_Y - wy) / rz * FOV };
    }

    function buildGrid() {
      const nMax = Math.floor((scrollZ + Z_FAR) / ROW_STEP);
      const nMin = Math.ceil((scrollZ + Z_NEAR) / ROW_STEP);
      const rows = [];
      for (let n = nMax; n >= nMin; n--) {
        const wz = n * ROW_STEP, relZ = wz - scrollZ;
        if (relZ <= 0) continue;
        const row = [];
        for (let c = 0; c < COLS; c++) {
          const wx = ((c / (COLS - 1)) - 0.5) * W_WIDE;
          const wy = th(wx, wz), sp = proj(wx, wy, relZ);
          row.push(sp ? { x: sp.x, y: sp.y, wy } : null);
        }
        rows.push(row);
      }
      return rows;
    }

    function drawBackground() {
      const sky = ctx.createLinearGradient(0, 0, 0, H * HRZ);
      sky.addColorStop(0, '#040010'); sky.addColorStop(0.20, '#0e0030');
      sky.addColorStop(0.50, '#500062'); sky.addColorStop(0.80, '#cc0062'); sky.addColorStop(1, '#e8006e');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * HRZ);
      const gnd = ctx.createLinearGradient(0, H * HRZ, 0, H);
      gnd.addColorStop(0, '#240048'); gnd.addColorStop(0.35, '#160030'); gnd.addColorStop(1, '#080018');
      ctx.fillStyle = gnd; ctx.fillRect(0, H * HRZ, W, H * (1 - HRZ));
      ctx.save();
      for (let i = 0; i < 40; i++) {
        const y = (i / 40) * H * HRZ;
        ctx.globalAlpha = 0.015 + (i / 40) * 0.055;
        ctx.fillStyle = i > 25 ? '#ff1188' : '#440066';
        ctx.fillRect(0, y, W, 2.5);
      }
      ctx.restore();
    }

    function drawStars() {
      const t0 = lastT * 0.001;
      stars.forEach(s => {
        const f = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t0 * s.sp + s.ph));
        ctx.save(); ctx.globalAlpha = f;
        ctx.fillStyle = s.b ? '#fff' : '#e0c8ff';
        if (s.b) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 8; }
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
    }

    function drawSun(t) {
      const cx = W / 2, cy = H * (HRZ - 0.15), r = Math.min(W, H) * 0.15;
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.5);
      const og = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 3.0);
      og.addColorStop(0, `rgba(255,${Math.round(70 + 40 * pulse)},0,0.50)`);
      og.addColorStop(0.35, 'rgba(200,0,80,0.22)'); og.addColorStop(1, 'transparent');
      ctx.fillStyle = og; ctx.fillRect(cx - r * 3.2, cy - r * 3.2, r * 6.4, r * 6.4);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      const sg = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
      sg.addColorStop(0, '#ffee00'); sg.addColorStop(0.22, '#ff8800');
      sg.addColorStop(0.55, '#ff2222'); sg.addColorStop(1, '#aa0044');
      ctx.fillStyle = sg; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      for (let i = 0; i < 10; i++) {
        const sy = cy + (i / 10) * r * 0.88;
        ctx.fillStyle = `rgba(4,0,10,${0.40 + i * 0.042})`;
        ctx.fillRect(cx - r, sy, r * 2, 5.5 + i * 0.5);
      }
      ctx.restore();
    }

    function drawTerrain(rows) {
      if (rows.length < 2) return;
      const NR = rows.length;
      for (let ri = 0; ri < NR - 1; ri++) {
        const rA = rows[ri], rB = rows[ri + 1];
        for (let c = 0; c < COLS - 1; c++) {
          const p00 = rA[c], p01 = rA[c + 1], p10 = rB[c], p11 = rB[c + 1];
          if (!p00 || !p01 || !p10 || !p11) continue;
          const avgWy = (p00.wy + p01.wy + p10.wy + p11.wy) / 4;
          ctx.fillStyle = avgWy < 0.5 ? '#1a0038' : '#060016';
          ctx.beginPath();
          ctx.moveTo(p00.x, p00.y); ctx.lineTo(p01.x, p01.y);
          ctx.lineTo(p11.x, p11.y); ctx.lineTo(p10.x, p10.y);
          ctx.closePath(); ctx.fill();
        }
      }
      ctx.shadowBlur = 4;
      for (let ri = 0; ri < NR; ri++) {
        const d = ri / (NR - 1);
        ctx.globalAlpha = 0.14 + d * 0.86; ctx.lineWidth = 0.45 + d * 1.0;
        ctx.strokeStyle = '#0055ff'; ctx.shadowColor = '#00aaff';
        ctx.beginPath();
        const row = rows[ri];
        for (let c = 0; c < COLS - 1; c++) {
          const p0 = row[c], p1 = row[c + 1];
          if (!p0 || !p1) continue;
          ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
        }
        ctx.stroke();
      }
      const B = 10;
      for (let b = 0; b < B; b++) {
        const rMin = Math.floor(b * (NR - 1) / B), rMax = Math.floor((b + 1) * (NR - 1) / B), d = (b + 0.5) / B;
        ctx.globalAlpha = 0.10 + d * 0.75; ctx.lineWidth = 0.38 + d * 0.82;
        ctx.strokeStyle = '#0044cc'; ctx.shadowColor = '#0088ee'; ctx.shadowBlur = 3;
        ctx.beginPath();
        for (let c = 0; c < COLS; c++) {
          for (let ri = rMin; ri < Math.min(rMax, NR - 1); ri++) {
            const p0 = rows[ri][c], p1 = rows[ri + 1][c];
            if (!p0 || !p1) continue;
            ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
          }
        }
        ctx.stroke();
      }
      ctx.strokeStyle = '#55ddff'; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 10; ctx.lineWidth = 1.5;
      for (let ri = 0; ri < NR; ri++) {
        const d = ri / (NR - 1); ctx.globalAlpha = 0.06 + d * 0.55; ctx.beginPath();
        const row = rows[ri];
        for (let c = 0; c < COLS - 1; c++) {
          const p0 = row[c], p1 = row[c + 1];
          if (!p0 || !p1 || p0.wy < H_MAX * 0.48 || p1.wy < H_MAX * 0.48) continue;
          ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }

    function drawAtmos() {
      const hg = ctx.createLinearGradient(0, H * (HRZ - 0.05), 0, H * (HRZ + 0.06));
      hg.addColorStop(0, 'transparent'); hg.addColorStop(0.5, 'rgba(150,0,180,0.18)'); hg.addColorStop(1, 'transparent');
      ctx.fillStyle = hg; ctx.fillRect(0, H * (HRZ - 0.05), W, H * 0.11);
      const fg = ctx.createLinearGradient(0, H * 0.90, 0, H);
      fg.addColorStop(0, 'transparent'); fg.addColorStop(0.5, 'rgba(5,0,16,0.55)'); fg.addColorStop(1, 'rgba(4,0,12,0.88)');
      ctx.fillStyle = fg; ctx.fillRect(0, H * 0.90, W, H * 0.10);
      ['left', 'right'].forEach((_, i) => {
        const g = ctx.createLinearGradient(i === 0 ? 0 : W, 0, i === 0 ? W * 0.12 : W * 0.88, 0);
        g.addColorStop(0, 'rgba(3,0,10,0.55)'); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.fillRect(i === 0 ? 0 : W * 0.88, 0, W * 0.12, H);
      });
    }

    function drawScan() {
      ctx.save(); ctx.globalAlpha = 0.044;
      for (let y = 0; y < H; y += 4) { ctx.fillStyle = '#000'; ctx.fillRect(0, y, W, 2); }
      ctx.restore();
    }

    function tick(ts) {
      const dt = Math.min(0.05, (ts - lastT) / 1000);
      lastT = ts; scrollZ += SPEED * dt;
      ctx.clearRect(0, 0, W, H);
      drawBackground(); drawStars(); drawSun(ts * 0.001);
      drawTerrain(buildGrid()); drawAtmos(); drawScan();
      animId = requestAnimationFrame(tick);
    }

    function handleResize() { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; }

    function init() {
      W = cv.width = window.innerWidth; H = cv.height = window.innerHeight;
      const r = seeded(42);
      for (let i = 0; i < 160; i++) stars.push({
        x: r() * W, y: r() * H * 0.56, r: 0.5 + r() * 2,
        ph: r() * Math.PI * 2, sp: 0.6 + r() * 2.2, b: r() > 0.80,
      });
      window.addEventListener('resize', handleResize);
      animId = requestAnimationFrame(tick);
    }

    init();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        zIndex, display: 'block', pointerEvents: 'none',
        opacity, transition: 'opacity 1.2s ease',
      }}
    />
  );
}

export default RetrowaveMountains;
