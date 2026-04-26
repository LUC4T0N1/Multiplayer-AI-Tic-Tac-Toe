import { MeshGradient } from "@paper-design/shaders-react";
import { useState, useEffect } from "react";
import isMobile from "../../utils/isMobile";

const COLORS = ["#12b9da8e", "#e014a07e", "#b014e07e"];

function MeshBackground({ zIndex = 0, style }) {
  const [dims, setDims] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    if (isMobile) return;
    const update = () => setDims({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 25% 35%, #2a0044 0%, #050010 52%, #1a001a 100%)',
        ...style,
      }} />
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      zIndex,
      pointerEvents: 'none',
      ...style,
    }}>
      <MeshGradient
        width={dims.width}
        height={dims.height}
        colors={COLORS}
        distortion={0.8}
        swirl={0.6}
        grainMixer={0}
        grainOverlay={0}
        speed={0.42}
        offsetX={0.08}
      />
    </div>
  );
}

export default MeshBackground;
