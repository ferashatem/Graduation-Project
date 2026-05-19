// ── Design Canvas ─────────────────────────────────────────────────────────────
// Renders the active screen at 1440px width, scaled to fit viewport

function DesignCanvas({ children }) {
  const CANVAS_W = 1440;
  const CANVAS_H = 900;
  const [scale, setScale] = React.useState(1);

  React.useEffect(()=>{
    const update = () => {
      // Available width = viewport - tweaks panel (260px)
      const availW = window.innerWidth - 260;
      const availH = window.innerHeight;
      const s = Math.min(availW / CANVAS_W, availH / CANVAS_H, 1);
      setScale(s);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div style={{
      flex:1, overflow:'hidden', background:'#e9e7e1',
      display:'flex', alignItems:'center', justifyContent:'center',
      position:'relative',
    }}>
      {/* Checkerboard hint */}
      <div style={{
        position:'absolute', inset:0, opacity:0.4,
        backgroundImage:`
          linear-gradient(45deg,#d8d4cc 25%,transparent 25%),
          linear-gradient(-45deg,#d8d4cc 25%,transparent 25%),
          linear-gradient(45deg,transparent 75%,#d8d4cc 75%),
          linear-gradient(-45deg,transparent 75%,#d8d4cc 75%)
        `,
        backgroundSize:'20px 20px',
        backgroundPosition:'0 0,0 10px,10px -10px,-10px 0',
        pointerEvents:'none',
      }}/>

      {/* Canvas frame */}
      <div style={{
        width:CANVAS_W,
        height:CANVAS_H,
        transform:`scale(${scale})`,
        transformOrigin:'center center',
        overflow:'hidden',
        borderRadius:8,
        boxShadow:'0 24px 80px rgba(0,0,0,0.3)',
        position:'relative',
        flexShrink:0,
      }}>
        {children}
      </div>
    </div>
  );
}

window.DesignCanvas = DesignCanvas;
