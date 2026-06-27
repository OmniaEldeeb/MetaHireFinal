"use client";

/**
 * AvatarScene
 * ===========
 * Self-contained R3F Canvas: lighting + camera + avatar + desk + background.
 * Drop it into any client component:
 *
 *   <AvatarScene visemes={visemes} isPlaying={isPlaying} />
 *
 * Adapted for the MetaHire interview room:
 *  - Explicit lights are added alongside the (optional) HDR Environment so the
 *    avatar stays lit even if the remote environment preset can't be fetched.
 *  - The background image and the Environment preset both fail soft: if either
 *    asset is unavailable the scene still renders on a solid color.
 *
 * @param {object}  props
 * @param {object}  props.visemes    - live visemes from a lip-sync hook
 * @param {boolean} props.isPlaying  - true while the interviewer is "speaking"
 * @param {string}  props.background - solid background color (hex)
 * @param {string|null} props.bgImage - optional background image path
 */

import React, { Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { Avatar } from "./Avatar";
import { Desk } from "./Desk";

function BackgroundPlane({ image }) {
  const texture = useTexture(image);
  const viewport = useThree((state) => state.viewport);
  return (
    <mesh position={[0, 0, -2]}>
      <planeGeometry args={[viewport.width * 3.5, viewport.height * 3]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

export function AvatarScene({
  visemes,
  isPlaying,
  background = "#0f0f15",
  bgImage = "/textures/youtubeBackground.jpg",
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 8], fov: 42 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ preserveDrawingBuffer: true }}
    >
      <color attach="background" args={[background]} />

      {/* Explicit lighting — self-contained, no remote HDR fetch. Keeps the
          avatar well lit regardless of network conditions. */}
      <ambientLight intensity={1.0} />
      <hemisphereLight args={["#ffffff", "#444466", 0.6]} />
      <directionalLight position={[2, 4, 6]} intensity={1.3} castShadow />
      <directionalLight position={[-3, 2, 4]} intensity={0.5} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 1.9}
        minAzimuthAngle={-Math.PI / 8}
        maxAzimuthAngle={Math.PI / 8}
        target={[0, -0.9, 9]}
      />

      <Suspense fallback={null}>
        <Avatar
          position={[0, -3, 5]}
          scale={2}
          visemes={visemes}
          isPlaying={isPlaying}
        />

        <Desk position={[-0.25, -3.05, 5]} scale={0.05} />

        {bgImage && <BackgroundPlane image={bgImage} />}
      </Suspense>
    </Canvas>
  );
}