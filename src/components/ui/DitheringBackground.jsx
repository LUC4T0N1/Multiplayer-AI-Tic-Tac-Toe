import { DitheringShader } from "./DitheringShader";

/*
  Two-layer dithered overlay using the home screen palette.
  Both layers use transparent colorBack so MeshBackground shows through.

  Layer 1 — violet/purple simplex noise  (#6600cc)
  Layer 2 — deep pink ripple             (#ff2d78), screen-blended
*/
function DitheringBackground({ style }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      overflow: "hidden", pointerEvents: "none",
      ...style,
    }}>
      {/* Purple simplex — subtle dithered noise */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.28 }}>
        <DitheringShader
          shape="simplex"
          type="8x8"
          colorBack="transparent"
          colorFront="#5500aa"
          pxSize={4}
          speed={0.45}
        />
      </div>

      {/* Pink ripple — soft radial waves, screen-blended */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: 0.20,
        mixBlendMode: "screen",
      }}>
        <DitheringShader
          shape="ripple"
          type="4x4"
          colorBack="transparent"
          colorFront="#cc1155"
          pxSize={4}
          speed={0.65}
        />
      </div>
    </div>
  );
}

export default DitheringBackground;
