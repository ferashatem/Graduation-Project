import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import Campus from "./Campus";

function CampusScene({
  buildings,
  roomsByBuilding,
  layoutMap,
  activeBuildingId,
  activeFloorKey,
  activeRoomKey,
  hoveredRoomKey,
  roomStatusMap,
  onSelectBuilding,
  onSelectFloor,
  onSelectRoom,
  onHoverRoom,
  dayOptions,
  cameraFocus,
}) {
  const controlsRef = useRef(null);

  useEffect(() => {
    if (!cameraFocus || !controlsRef.current) return;
    const controls = controlsRef.current;
    const camera = controls.object;
    camera.position.set(
      cameraFocus.position[0],
      cameraFocus.position[1],
      cameraFocus.position[2]
    );
    controls.target.set(
      cameraFocus.target[0],
      cameraFocus.target[1],
      cameraFocus.target[2]
    );
    controls.update();
  }, [cameraFocus]);

  return (
    <div className="h-[520px] w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950 shadow-lg">
      <Canvas camera={{ position: [20, 18, 20], fov: 48, near: 0.1, far: 20000 }}>
        <color attach="background" args={["#0b1020"]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[12, 18, 8]} intensity={1} />
        <directionalLight position={[-10, 8, -12]} intensity={0.4} />

        <Suspense fallback={null}>
          <Campus
            buildings={buildings}
            roomsByBuilding={roomsByBuilding}
            layoutMap={layoutMap}
            activeBuildingId={activeBuildingId}
            activeFloorKey={activeFloorKey}
            activeRoomKey={activeRoomKey}
            hoveredRoomKey={hoveredRoomKey}
            roomStatusMap={roomStatusMap}
            onSelectBuilding={onSelectBuilding}
            onSelectFloor={onSelectFloor}
            onSelectRoom={onSelectRoom}
            onHoverRoom={onHoverRoom}
            dayOptions={dayOptions}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          enablePan
          screenSpacePanning
          rotateSpeed={0.9}
          zoomSpeed={1.2}
          minDistance={0.1}
          maxDistance={5000}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          minAzimuthAngle={-Infinity}
          maxAzimuthAngle={Infinity}
        />
      </Canvas>
    </div>
  );
}

export default CampusScene;

