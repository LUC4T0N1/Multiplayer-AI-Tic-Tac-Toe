import { MeshGradient } from "@paper-design/shaders-react";
import { useState, useEffect } from "react";

const COLORS = ["#08000f", "#1e0044", "#550077", "#770033", "#001a44", "#441100"];

function MeshBackground({ zIndex = 0, style }) {
  const [dims, setDims] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const update = () => setDims({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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
