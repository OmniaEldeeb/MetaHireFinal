"use client";

/**
 * Avatar
 * ======
 * مكوّن الأفاتار 3D — بيستقبل الـ visemes اللحظية من useAudioLipSync
 * وبيقودها لـ morph targets في موديل Ready Player Me.
 *
 * يشتغل مع:
 *   - أي مصدر صوت (URL / base64 / Blob)
 *   - أي TTS provider (LLM، Azure، ElevenLabs، Web Speech، إلخ)
 *
 * مش بيحتاج backend — كل حاجة في المتصفح.
 */

import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const animationFiles = {
  "Sitting Idle": "/animations/Sitting Idle.fbx",
  "Sitting Talking": "/animations/Sitting Talking.fbx",
  "Having A Meeting": "/animations/Having A Meeting.fbx",
  Idle: "/animations/Idle.fbx",
};

Object.values(animationFiles).forEach((url) => useFBX.preload(url));

// الأنيميشن اللي بتشتغل أثناء الكلام
const talkingAnimations = ["Sitting Talking", "Having A Meeting"];

// كل أسماء الـ visemes اللي هنحركها
const VISEME_NAMES = ["viseme_O", "viseme_aa", "viseme_E", "viseme_I"];

/**
 * @param {object} props
 * @param {object} props.visemes  - من useAudioLipSync.currentVisemes
 * @param {boolean} props.isPlaying - من useAudioLipSync.isPlaying
 * @param {string} props.modelUrl  - افتراضي: /models/avatar.glb
 * @param {boolean} props.headFollow - تتبع رأس الأفاتار للكاميرا
 * @param {number} props.smoothing - نعومة الحركة (0-1)
 */
export function Avatar({
  visemes,
  isPlaying,
  modelUrl = "/models/avatar.glb",
  headFollow = true,
  smoothing = 0.35,
  ...props
}) {
  const { nodes, materials } = useGLTF(modelUrl);
  const group = useRef();

  const [animation, setAnimation] = useState("Sitting Idle");

  // تحميل الأنيميشنز
  const { animations: idleAnim } = useFBX(animationFiles["Sitting Idle"]);
  idleAnim[0].name = "Sitting Idle";

  const { animations: talkAnim1 } = useFBX(animationFiles["Sitting Talking"]);
  talkAnim1[0].name = "Sitting Talking";

  const { animations: meetAnim } = useFBX(animationFiles["Having A Meeting"]);
  meetAnim[0].name = "Having A Meeting";

  const { animations: idleStandAnim } = useFBX(animationFiles["Idle"]);
  idleStandAnim[0].name = "Idle";

  const { actions } = useAnimations(
    [idleAnim[0], talkAnim1[0], meetAnim[0], idleStandAnim[0]],
    group
  );

  // لما الـ isPlaying يتغير → بدّل الأنيميشن
  useEffect(() => {
    if (isPlaying) {
      setAnimation(talkingAnimations[Math.floor(Math.random() * talkingAnimations.length)]);
    } else {
      setAnimation("Sitting Idle");
    }
  }, [isPlaying]);

  // شغّل/أطفّي الأنيميشن الحالي
  useEffect(() => {
    if (actions[animation]) {
      actions[animation].reset().fadeIn(0.5).play();
      return () => actions[animation].fadeOut(0.5);
    }
  }, [animation, actions]);

  // frame loop: قود الـ visemes للـ morph targets
  useFrame(() => {
    if (!nodes?.Wolf3D_Head?.morphTargetDictionary) return;

    const targetInfluences = visemes || {};
    const headDict = nodes.Wolf3D_Head.morphTargetDictionary;
    const teethDict = nodes.Wolf3D_Teeth?.morphTargetDictionary;

    // 1) ارجاع كل الـ visemes لـ 0 تدريجياً
    for (const name of VISEME_NAMES) {
      const hIdx = headDict[name];
      const tIdx = teethDict?.[name];
      if (hIdx !== undefined) {
        nodes.Wolf3D_Head.morphTargetInfluences[hIdx] = THREE.MathUtils.lerp(
          nodes.Wolf3D_Head.morphTargetInfluences[hIdx], 0, smoothing
        );
      }
      if (tIdx !== undefined) {
        nodes.Wolf3D_Teeth.morphTargetInfluences[tIdx] = THREE.MathUtils.lerp(
          nodes.Wolf3D_Teeth.morphTargetInfluences[tIdx], 0, smoothing
        );
      }
    }

    // 2) ارفع الـ viseme النشط
    for (const name of VISEME_NAMES) {
      const target = targetInfluences[name] || 0;
      if (target <= 0) continue;
      const hIdx = headDict[name];
      const tIdx = teethDict?.[name];
      if (hIdx !== undefined) {
        nodes.Wolf3D_Head.morphTargetInfluences[hIdx] = THREE.MathUtils.lerp(
          nodes.Wolf3D_Head.morphTargetInfluences[hIdx], target, 0.6
        );
      }
      if (tIdx !== undefined) {
        nodes.Wolf3D_Teeth.morphTargetInfluences[tIdx] = THREE.MathUtils.lerp(
          nodes.Wolf3D_Teeth.morphTargetInfluences[tIdx], target, 0.6
        );
      }
    }

    // 3) رمشة عين عشوائية لما يكون بيتكلم
    if (isPlaying && Math.random() < 0.015) {
      const blinkL = nodes.EyeLeft?.morphTargetDictionary?.["blink"];
      const blinkR = nodes.EyeRight?.morphTargetDictionary?.["blink"];
      if (blinkL !== undefined && nodes.EyeLeft) {
        nodes.EyeLeft.morphTargetInfluences[blinkL] = 1;
      }
      if (blinkR !== undefined && nodes.EyeRight) {
        nodes.EyeRight.morphTargetInfluences[blinkR] = 1;
      }
    }
    // fade out الرمشة
    ["EyeLeft", "EyeRight"].forEach((nodeName) => {
      const node = nodes[nodeName];
      const blinkIdx = node?.morphTargetDictionary?.["blink"];
      if (blinkIdx !== undefined && node) {
        node.morphTargetInfluences[blinkIdx] = THREE.MathUtils.lerp(
          node.morphTargetInfluences[blinkIdx], 0, 0.2
        );
      }
    });
  });

  // تتبع رأس الأفاتار للكاميرا
  useFrame((state) => {
    if (headFollow && group.current) {
      const head = group.current.getObjectByName("Head");
      if (head) head.lookAt(state.camera.position);
    }
  });

  return (
    <group {...props} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
      <skinnedMesh geometry={nodes.Wolf3D_Body.geometry} material={materials.Wolf3D_Body} skeleton={nodes.Wolf3D_Body.skeleton} />
      <skinnedMesh geometry={nodes.Wolf3D_Outfit_Bottom.geometry} material={materials.Wolf3D_Outfit_Bottom} skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton} />
      <skinnedMesh geometry={nodes.Wolf3D_Outfit_Footwear.geometry} material={materials.Wolf3D_Outfit_Footwear} skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton} />
      <skinnedMesh geometry={nodes.Wolf3D_Outfit_Top.geometry} material={materials.Wolf3D_Outfit_Top} skeleton={nodes.Wolf3D_Outfit_Top.skeleton} />
      <skinnedMesh geometry={nodes.Wolf3D_Hair.geometry} material={materials.Wolf3D_Hair} skeleton={nodes.Wolf3D_Hair.skeleton} />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
    </group>
  );
}

useGLTF.preload("/models/avatar.glb");