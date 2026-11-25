import React, {useLayoutEffect, useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {PMREMGenerator} from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

export type GeminiVariant = 'sparkle' | 'bot' | 'chibi';
export type GeminiAction = 'idle' | 'wave' | 'sparkle' | 'typing' | 'still';
export type GeminiBgMode = 'transparent' | 'greenscreen' | 'studio';

export type GeminiMascot3DProps = {
  variant?: GeminiVariant;
  action?: GeminiAction;
  bgMode?: GeminiBgMode;
  showShadow?: boolean;
  cameraYaw?: number;
};

// Google Gemini signature brand palette
const COL_BLUE = new THREE.Color('#1B6EF3');
const COL_INDIGO = new THREE.Color('#6366F1');
const COL_LAVENDER = new THREE.Color('#A855F7');
const COL_CORAL = new THREE.Color('#F43F5E');
const COL_GOLD = new THREE.Color('#FBBF24');

function sampleGeminiGradient(nx: number, ny: number): THREE.Color {
  const diag = THREE.MathUtils.clamp((nx * 0.55 + ny * 0.68 + 0.95) * 0.52, 0, 1);
  const out = new THREE.Color();
  if (diag < 0.34) {
    out.lerpColors(COL_BLUE, COL_INDIGO, diag / 0.34);
  } else if (diag < 0.64) {
    out.lerpColors(COL_INDIGO, COL_LAVENDER, (diag - 0.34) / 0.3);
  } else if (diag < 0.86) {
    out.lerpColors(COL_LAVENDER, COL_CORAL, (diag - 0.64) / 0.22);
  } else {
    out.lerpColors(COL_CORAL, COL_GOLD, (diag - 0.86) / 0.14);
  }
  return out;
}

/** Procedural subtle clay tactile micro-bump texture */
function createClayBumpTexture(): THREE.DataTexture {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2;
      const v = (y / size) * Math.PI * 2;
      const swirl =
        Math.sin(u * 6 + Math.cos(v * 4) * 1.5) * 0.35 +
        Math.cos(v * 7 - Math.sin(u * 5) * 1.3) * 0.35 +
        Math.sin((u + v) * 14) * 0.15;
      const val = Math.round(THREE.MathUtils.clamp(128 + swirl * 22, 0, 255));
      const idx = (y * size + x) * 4;
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.needsUpdate = true;
  return tex;
}

/** Soft radial ground contact shadow texture (clean alpha falloff to 0 at edges) */
function createSoftShadowTexture(): THREE.DataTexture {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x / (size - 1)) * 2 - 1;
      const dy = (y / (size - 1)) * 2 - 1;
      const r = Math.sqrt(dx * dx + dy * dy);
      const a = r >= 1 ? 0 : Math.pow(1 - r * r, 2.5) * 0.26;
      const idx = (y * size + x) * 4;
      data[idx] = 15;
      data[idx + 1] = 23;
      data[idx + 2] = 42;
      data[idx + 3] = Math.round(a * 255);
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Seam-free, outward-normal plump 3D 4-point Gemini sparkle pillow geometry!
 * Deformed smoothly from a Y-polar SphereGeometry so the entire front/back belly
 * is an equatorial band with ZERO bevel seams, ZERO polar pinching, and exact Z depth!
 */
function createPlumpSparkleGeometry(opts: {
  tipRadius?: number;
  waistRadius?: number;
  depth?: number;
  verticalStretch?: number;
  sharpness?: number;
  segs?: number;
  colorMode?: 'gemini' | 'gold' | 'blue' | 'pink' | 'cyan' | 'purple' | 'white';
} = {}): THREE.BufferGeometry {
  const {
    tipRadius = 1.16,
    waistRadius = 0.48,
    depth = 0.44,
    verticalStretch = 1.05,
    sharpness = 1.55,
    segs = 112,
    colorMode = 'gemini',
  } = opts;

  const geo = new THREE.SphereGeometry(1, segs * 2, segs);
  const pos = geo.getAttribute('position');
  const colors: number[] = [];

  for (let i = 0; i < pos.count; i++) {
    const sx = pos.getX(i);
    const sy = pos.getY(i);
    const sz = pos.getZ(i);

    // Angle in the XY plane for the 4-point Gemini sparkle silhouette
    const theta = Math.atan2(sy, sx);
    const wave = 0.5 + 0.5 * Math.cos(4 * theta);
    const shaped = Math.pow(wave, sharpness);
    const rProfile = waistRadius + (tipRadius - waistRadius) * shaped;

    // Smoothly blend from full star silhouette at Z=0 rim to plump spherical belly at Z=+-1
    const rXY = Math.hypot(sx, sy);
    const x = sx * rProfile;
    const y = sy * rProfile * verticalStretch;
    // Slight plush pillow fullness in Z while keeping exact max Z = depth at (0,0,+-1)
    const zSign = Math.sign(sz);
    const zMag = Math.pow(Math.abs(sz), 0.84) * (1 - 0.14 * rXY * shaped);
    const z = zSign * zMag * depth;

    pos.setXYZ(i, x, y, z);

    const ny = THREE.MathUtils.clamp((y / tipRadius + 1) * 0.5, 0, 1);
    let c: THREE.Color;
    if (colorMode === 'gold') {
      c = new THREE.Color().lerpColors(new THREE.Color('#F59E0B'), new THREE.Color('#FEF08A'), ny);
    } else if (colorMode === 'blue') {
      c = new THREE.Color().lerpColors(new THREE.Color('#2563EB'), new THREE.Color('#93C5FD'), ny);
    } else if (colorMode === 'pink') {
      c = new THREE.Color().lerpColors(new THREE.Color('#EC4899'), new THREE.Color('#FDE047'), ny);
    } else if (colorMode === 'cyan') {
      c = new THREE.Color().lerpColors(new THREE.Color('#38BDF8'), new THREE.Color('#BAE6FD'), ny);
    } else if (colorMode === 'purple') {
      c = new THREE.Color().lerpColors(new THREE.Color('#C084FC'), new THREE.Color('#F9A8D4'), ny);
    } else if (colorMode === 'white') {
      c = new THREE.Color('#FFFFFF');
    } else {
      c = sampleGeminiGradient(x / tipRadius, y / tipRadius);
    }
    colors.push(c.r, c.g, c.b);
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Rounded superellipsoid box with verified outward CCW normals */
function createRoundedBoxSphere(wx: number, wy: number, wz: number, power = 0.58, segs = 56): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, segs * 2, segs);
  const pos = geo.getAttribute('position');
  const spow = (val: number, p: number) => Math.sign(val) * Math.pow(Math.abs(val), p);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    pos.setXYZ(i, wx * spow(x, power), wy * spow(y, power), wz * spow(z, power));
  }
  geo.computeVertexNormals();
  return geo;
}

/** Flared A-line pleated dress/cape cone with outward-facing normals */
function createPleatedSkirtGeometry(
  topR: number,
  botR: number,
  height: number,
  pleats = 12,
  pleatAmp = 0.028,
  palette: [string, string] = ['#1E3A8A', '#3B82F6'],
): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(topR, botR, height, 120, 28, false);
  const pos = geo.getAttribute('position');
  const colors: number[] = [];
  const cTop = new THREE.Color(palette[0]);
  const cBot = new THREE.Color(palette[1]);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const t = THREE.MathUtils.clamp(0.5 - y / height, 0, 1);
    const ang = Math.atan2(z, x);
    const r = Math.hypot(x, z);
    if (r > 0.01) {
      const ripple = Math.sin(ang * pleats) * pleatAmp * Math.pow(t, 0.8);
      const nr = r + ripple;
      pos.setXYZ(i, Math.cos(ang) * nr, y, Math.sin(ang) * nr * 0.92);
    }
    const c = new THREE.Color().lerpColors(cTop, cBot, t * 0.9);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Sculpted tapered hair lock built from SphereGeometry warp along spline */
function createHairLockGeometry(
  points: [number, number, number][],
  maxRadius: number,
  flattenZ = 0.72,
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const lengthSegs = 44;
  const radSegs = 20;
  const frames = curve.computeFrenetFrames(lengthSegs, false);

  const geo = new THREE.SphereGeometry(1, radSegs, lengthSegs);
  const pos = geo.getAttribute('position');
  const colors: number[] = [];

  for (let i = 0; i < pos.count; i++) {
    const sx = pos.getX(i);
    const sy = pos.getY(i);
    const sz = pos.getZ(i);
    const t = THREE.MathUtils.clamp((1 - sy) * 0.5, 0, 1);
    const idx = Math.min(lengthSegs, Math.round(t * lengthSegs));
    const pt = curve.getPointAt(t);
    const N = frames.normals[idx];
    const B = frames.binormals[idx];

    const rRing = Math.hypot(sx, sz);
    const ang = Math.atan2(sz, sx);
    const profile = maxRadius * Math.sin(Math.pow(t, 0.58) * Math.PI);
    const localN = Math.cos(ang) * profile * (rRing > 1e-4 ? 1 : 0);
    const localB = Math.sin(ang) * profile * flattenZ * (rRing > 1e-4 ? 1 : 0);

    pos.setXYZ(
      i,
      pt.x + localN * N.x + localB * B.x,
      pt.y + localN * N.y + localB * B.y,
      pt.z + localN * N.z + localB * B.z,
    );

    // Rich deep Gemini royal blue at crown/bangs -> indigo/lavender mid -> coral-pink tips
    const c = new THREE.Color();
    if (t < 0.55) {
      c.lerpColors(new THREE.Color('#1B56E4'), new THREE.Color('#4F5EE8'), t / 0.55);
    } else if (t < 0.84) {
      c.lerpColors(new THREE.Color('#4F5EE8'), new THREE.Color('#A855F7'), (t - 0.55) / 0.29);
    } else {
      c.lerpColors(new THREE.Color('#A855F7'), new THREE.Color('#F45B7E'), (t - 0.84) / 0.16);
    }
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Shared Studio Softbox Environment setup */
const StudioLighting: React.FC = () => {
  const {gl, scene} = useThree();
  useLayoutEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const envTarget = pmrem.fromScene(room, 0.035);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.45;
    return () => {
      scene.environment = null;
      envTarget.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return (
    <>
      <ambientLight intensity={0.82} color="#FFFDFB" />
      <hemisphereLight args={['#FFFFFF', '#C7D2FE', 0.62]} />
      <directionalLight position={[3.4, 5.2, 5.0]} intensity={1.32} color="#FFFDF9" />
      <directionalLight position={[-3.8, 2.4, 2.8]} intensity={0.55} color="#C4B5FD" />
      <directionalLight position={[0.5, 3.0, -4.2]} intensity={0.58} color="#93C5FD" />
    </>
  );
};

/** Compute rich procedural animation pose from frame & action */
function computePose(action: GeminiAction, sec: number) {
  const blinkPhase = (sec % 2.4) / 2.4;
  const autoBlink =
    action === 'still'
      ? 1
      : blinkPhase > 0.88 && blinkPhase < 0.95
        ? Math.max(0.12, Math.abs(blinkPhase - 0.915) / 0.035)
        : 1;

  if (action === 'still') {
    return {
      bobY: 0.0,
      bodyTiltZ: -0.025,
      bodyTiltX: 0.015,
      bodyTurnY: 0.14,
      headTiltZ: 0.035,
      headTurnY: 0.03,
      leftArmZ: 0.35,
      leftArmX: 0.1,
      rightArmZ: -0.52,
      rightArmX: -0.18,
      leftLegX: 0.03,
      rightLegX: -0.03,
      eyeScaleY: 1,
      mouthOpen: 0.25,
      sparkleBurst: 0.3,
      showKeyboard: false,
      starSpin: 0.28,
    };
  }

  if (action === 'wave') {
    const t = sec * Math.PI * 2;
    const waveEnv = THREE.MathUtils.clamp(Math.sin(Math.min(sec / 4.8, 1) * Math.PI) * 2.2, 0, 1);
    const waveOsc = Math.sin(sec * 10.5) * 0.38 * waveEnv;
    return {
      bobY: Math.abs(Math.sin(t * 0.85)) * 0.075,
      bodyTiltZ: -0.07 * waveEnv + Math.sin(t * 0.42) * 0.03,
      bodyTiltX: -0.025,
      bodyTurnY: 0.12 + Math.sin(t * 0.35) * 0.08,
      headTiltZ: 0.085 * waveEnv,
      headTurnY: 0.05,
      leftArmZ: 0.42 + Math.sin(t * 0.85) * 0.08,
      leftArmX: 0.1,
      rightArmZ: THREE.MathUtils.lerp(-0.42, -2.15, waveEnv) + waveOsc,
      rightArmX: -0.2 * waveEnv,
      leftLegX: Math.sin(t * 0.85) * 0.08,
      rightLegX: -Math.sin(t * 0.85) * 0.08,
      eyeScaleY: waveEnv > 0.55 ? 0.86 : autoBlink,
      mouthOpen: 0.72 * waveEnv,
      sparkleBurst: 0.45 + 0.35 * waveEnv,
      showKeyboard: false,
      starSpin: sec * 2.4,
    };
  }

  if (action === 'sparkle') {
    const u = (sec % 4.8) / 4.8;
    const rise = Math.sin(u * Math.PI);
    const pulse = 0.5 + 0.5 * Math.sin(sec * 6.0);
    return {
      bobY: rise * 0.24 + Math.sin(sec * 5.0) * 0.025,
      bodyTiltZ: Math.sin(sec * 2.6) * 0.075,
      bodyTiltX: -0.07 * rise,
      bodyTurnY: 0.12 + Math.sin(u * Math.PI * 2) * 0.36,
      headTiltZ: Math.cos(sec * 2.6) * 0.06,
      headTurnY: Math.sin(sec * 2.2) * 0.12,
      leftArmZ: 0.4 + rise * 1.05 + Math.sin(sec * 6) * 0.12,
      leftArmX: -0.22 * rise,
      rightArmZ: -0.4 - rise * 1.05 - Math.sin(sec * 6) * 0.12,
      rightArmX: -0.22 * rise,
      leftLegX: 0.16 * rise,
      rightLegX: 0.07 * rise,
      eyeScaleY: autoBlink,
      mouthOpen: 0.55 * rise + 0.2 * pulse,
      sparkleBurst: 0.32 + 0.68 * rise,
      showKeyboard: false,
      starSpin: sec * 3.8,
    };
  }

  if (action === 'typing') {
    const fast = sec * 22;
    return {
      bobY: Math.abs(Math.sin(sec * 5.5)) * 0.035,
      bodyTiltZ: Math.sin(sec * 2.8) * 0.04,
      bodyTiltX: 0.1,
      bodyTurnY: 0.12 + Math.sin(sec * 1.8) * 0.07,
      headTiltZ: Math.sin(sec * 3.1) * 0.05,
      headTurnY: Math.sin(sec * 4.2) * 0.1,
      leftArmZ: 0.5 + Math.sin(fast) * 0.18,
      leftArmX: -0.75 + Math.cos(fast) * 0.22,
      rightArmZ: -0.5 + Math.cos(fast) * 0.18,
      rightArmX: -0.75 - Math.sin(fast) * 0.22,
      leftLegX: Math.sin(sec * 5.5) * 0.05,
      rightLegX: -Math.sin(sec * 5.5) * 0.05,
      eyeScaleY: autoBlink,
      mouthOpen: 0.35 + 0.2 * Math.sin(sec * 4),
      sparkleBurst: 0.52,
      showKeyboard: true,
      starSpin: sec * 2.8,
    };
  }

  // Default: 'idle'
  const t = (sec / 2.4) * Math.PI * 2;
  return {
    bobY: (Math.sin(t) * 0.5 + 0.5) * 0.055,
    bodyTiltZ: Math.sin(t * 0.5) * 0.042,
    bodyTiltX: Math.cos(t * 0.5) * 0.02,
    bodyTurnY: 0.14 + Math.sin(t * 0.5) * 0.085,
    headTiltZ: Math.sin(t * 0.5 + 0.6) * 0.045,
    headTurnY: Math.cos(t * 0.5) * 0.055,
    leftArmZ: 0.38 + Math.sin(t) * 0.07,
    leftArmX: 0.08 + Math.cos(t) * 0.05,
    rightArmZ: -0.38 - Math.sin(t) * 0.07,
    rightArmX: 0.08 - Math.cos(t) * 0.05,
    leftLegX: 0,
    rightLegX: 0,
    eyeScaleY: autoBlink,
    mouthOpen: 0.2,
    sparkleBurst: 0.28,
    showKeyboard: false,
    starSpin: sec * 1.4,
  };
}

/** Floating holographic mini-keyboard for `typing` + orbiting magic stars for `sparkle` */
const ActionPropsLayer: React.FC<{
  pose: ReturnType<typeof computePose>;
  sec: number;
  yOffset?: number;
}> = ({pose, sec, yOffset = 0}) => {
  const miniStarGeo = useMemo(
    () => createPlumpSparkleGeometry({tipRadius: 0.14, waistRadius: 0.048, depth: 0.05, segs: 40, colorMode: 'white'}),
    [],
  );
  const colors = ['#3B82F6', '#A855F7', '#EC4899', '#FBBF24', '#60A5FA', '#F472B6'];

  return (
    <group position={[0, yOffset, 0]}>
      {pose.sparkleBurst > 0.42 &&
        colors.map((hex, i) => {
          const ang = pose.starSpin + (i / colors.length) * Math.PI * 2;
          const rad = 1.18 + Math.sin(sec * 3 + i) * 0.08;
          const sy = 0.15 + Math.sin(ang * 2 + i) * 0.36;
          const sc = THREE.MathUtils.clamp((pose.sparkleBurst - 0.4) * 1.8, 0, 1) * (0.78 + (i % 2) * 0.32);
          return (
            <mesh
              key={i}
              geometry={miniStarGeo}
              position={[Math.cos(ang) * rad, sy, Math.sin(ang) * rad * 0.72]}
              rotation={[0, ang, sec * 2]}
              scale={sc}
            >
              <meshPhysicalMaterial color={hex} emissive={hex} emissiveIntensity={0.45} roughness={0.28} />
            </mesh>
          );
        })}

      {pose.showKeyboard && (
        <group position={[0.04, -0.34 + Math.sin(sec * 4) * 0.02, 0.78]} rotation={[-0.36, 0.1, 0]}>
          <mesh>
            <boxGeometry args={[0.96, 0.045, 0.38]} />
            <meshPhysicalMaterial
              color="#1E293B"
              emissive="#3B82F6"
              emissiveIntensity={0.28}
              roughness={0.2}
              clearcoat={0.9}
              transparent
              opacity={0.92}
            />
          </mesh>
          {Array.from({length: 12}).map((_, idx) => {
            const col = idx % 6;
            const row = Math.floor(idx / 6);
            const pressed = Math.sin(sec * 24 + idx * 1.9) > 0.65;
            const kColor = idx % 3 === 0 ? '#60A5FA' : idx % 3 === 1 ? '#C084FC' : '#F472B6';
            return (
              <mesh key={idx} position={[(col - 2.5) * 0.135, pressed ? 0.018 : 0.036, (row - 0.5) * 0.13]}>
                <boxGeometry args={[0.1, 0.024, 0.09]} />
                <meshStandardMaterial color={kColor} emissive={kColor} emissiveIntensity={pressed ? 0.95 : 0.35} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
};

/**
 * VARIANT A: "星芒团子 · Gemini Sparkle Mascot" (Matches Codex / Claude soft-clay mascot style)
 */
const SparkleClayMascot: React.FC<{pose: ReturnType<typeof computePose>; bumpMap: THREE.Texture}> = ({pose, bumpMap}) => {
  // Max front Z at center (0,0) is exact `depth = 0.44`!
  const bodyGeo = useMemo(
    () =>
      createPlumpSparkleGeometry({
        tipRadius: 1.12,
        waistRadius: 0.59,
        depth: 0.46,
        verticalStretch: 1.03,
        sharpness: 1.28,
        segs: 120,
      }),
    [],
  );
  const miniStarGeo = useMemo(
    () =>
      createPlumpSparkleGeometry({
        tipRadius: 0.24,
        waistRadius: 0.088,
        depth: 0.095,
        sharpness: 1.6,
        segs: 56,
        colorMode: 'gold',
      }),
    [],
  );
  const eyeStarGeo = useMemo(
    () =>
      createPlumpSparkleGeometry({
        tipRadius: 0.048,
        waistRadius: 0.016,
        depth: 0.015,
        sharpness: 1.6,
        segs: 36,
        colorMode: 'white',
      }),
    [],
  );

  return (
    <group position={[0, -0.02 + pose.bobY, 0]} rotation={[pose.bodyTiltX, pose.bodyTurnY, pose.bodyTiltZ]}>
      {/* Seam-free silky-smooth 3D Gemini 4-point star soft-clay body */}
      <mesh geometry={bodyGeo} position={[0, 0.18, 0]} rotation={[0, 0, -0.03]}>
        <meshPhysicalMaterial
          vertexColors
          roughness={0.58}
          metalness={0.02}
          bumpMap={bumpMap}
          bumpScale={0.008}
          sheen={0.48}
          sheenRoughness={0.62}
          sheenColor="#F5D0FE"
          clearcoat={0.08}
          clearcoatRoughness={0.5}
        />
      </mesh>

      {/* Expressive 3D face seated cleanly ON TOP of front belly surface (z = 0.455) */}
      <group position={[0, 0.2, 0.455]} rotation={[0, 0, pose.headTiltZ * 0.4]}>
        {[-0.22, 0.22].map((ex, idx) => (
          <group key={idx} position={[ex, 0.06, 0]} scale={[1, pose.eyeScaleY, 1]}>
            <mesh scale={[0.92, 1.18, 0.55]}>
              <sphereGeometry args={[0.108, 32, 32]} />
              <meshPhysicalMaterial color="#0F172A" roughness={0.1} clearcoat={1.0} clearcoatRoughness={0.06} />
            </mesh>
            <mesh geometry={eyeStarGeo} position={[-0.026, 0.038, 0.062]} />
            <mesh position={[0.032, -0.028, 0.058]}>
              <sphereGeometry args={[0.018, 16, 16]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
          </group>
        ))}

        {/* Rosy pastel clay cheeks */}
        {[-0.36, 0.36].map((cx, idx) => (
          <mesh key={idx} position={[cx, -0.065, -0.015]} scale={[1.28, 0.76, 0.38]}>
            <sphereGeometry args={[0.074, 24, 24]} />
            <meshStandardMaterial color="#FB7185" roughness={0.78} transparent opacity={0.6} />
          </mesh>
        ))}

        {/* Tactile raised cream-white 3D smile */}
        <mesh position={[0, -0.09, 0.022]} rotation={[0, 0, Math.PI]} scale={[1, 0.85 + pose.mouthOpen * 0.45, 1]}>
          <torusGeometry args={[0.084, 0.026, 20, 40, Math.PI]} />
          <meshPhysicalMaterial color="#FFFBEB" roughness={0.32} clearcoat={0.25} />
        </mesh>
      </group>

      {/* Floating companion mini twin-sparkle near top-right */}
      <mesh
        geometry={miniStarGeo}
        position={[0.78, 0.88 + Math.sin(pose.starSpin * 1.5) * 0.055, 0.18]}
        rotation={[0.12, pose.starSpin, -0.18]}
      >
        <meshPhysicalMaterial vertexColors emissive="#F59E0B" emissiveIntensity={0.24} roughness={0.32} clearcoat={0.35} />
      </mesh>

      {/* Cute stubby clay arms clearly visible at waist sides */}
      <group position={[-0.58, -0.06, 0.24]} rotation={[pose.leftArmX, 0, pose.leftArmZ]}>
        <mesh position={[-0.14, -0.08, 0.04]} rotation={[0.2, 0, 0.95]}>
          <capsuleGeometry args={[0.125, 0.22, 20, 32]} />
          <meshPhysicalMaterial color="#3B6EF5" roughness={0.58} bumpMap={bumpMap} bumpScale={0.007} sheen={0.4} />
        </mesh>
      </group>

      <group position={[0.58, -0.06, 0.24]} rotation={[pose.rightArmX, 0, pose.rightArmZ]}>
        <mesh position={[0.14, -0.08, 0.04]} rotation={[0.2, 0, -0.95]}>
          <capsuleGeometry args={[0.125, 0.22, 20, 32]} />
          <meshPhysicalMaterial color="#DF5899" roughness={0.58} bumpMap={bumpMap} bumpScale={0.007} sheen={0.4} />
        </mesh>
      </group>

      {/* Stubby clay legs */}
      {[-0.29, 0.29].map((lx, idx) => (
        <group
          key={idx}
          position={[lx, -0.52, 0.08]}
          rotation={[idx === 0 ? pose.leftLegX : pose.rightLegX, 0, idx === 0 ? -0.05 : 0.05]}
        >
          <mesh position={[0, -0.18, 0]}>
            <capsuleGeometry args={[0.148, 0.22, 20, 32]} />
            <meshPhysicalMaterial
              color={idx === 0 ? '#1D5AE6' : '#5664F2'}
              roughness={0.6}
              bumpMap={bumpMap}
              bumpScale={0.007}
              sheen={0.35}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/**
 * VARIANT B: "双子星机甲崽 · Gemini Astro Bot" (Designer Toy AI Companion Robot)
 */
const GeminiAstroBot: React.FC<{pose: ReturnType<typeof computePose>; bumpMap: THREE.Texture}> = ({pose, bumpMap}) => {
  const headGeo = useMemo(() => createRoundedBoxSphere(0.74, 0.58, 0.58, 0.62, 56), []);
  const visorGeo = useMemo(() => createRoundedBoxSphere(0.59, 0.4, 0.32, 0.68, 48), []);
  const torsoGeo = useMemo(() => createRoundedBoxSphere(0.52, 0.46, 0.44, 0.72, 48), []);
  const haloStarGeo = useMemo(
    () => createPlumpSparkleGeometry({tipRadius: 0.24, waistRadius: 0.09, depth: 0.09, sharpness: 1.6, segs: 56}),
    [],
  );
  const chestStarGeo = useMemo(
    () => createPlumpSparkleGeometry({tipRadius: 0.16, waistRadius: 0.058, depth: 0.055, sharpness: 1.6, segs: 48}),
    [],
  );
  const leftEyeStarGeo = useMemo(
    () => createPlumpSparkleGeometry({tipRadius: 0.125, waistRadius: 0.042, depth: 0.02, sharpness: 1.65, segs: 48, colorMode: 'cyan'}),
    [],
  );
  const rightEyeStarGeo = useMemo(
    () => createPlumpSparkleGeometry({tipRadius: 0.125, waistRadius: 0.042, depth: 0.02, sharpness: 1.65, segs: 48, colorMode: 'purple'}),
    [],
  );

  return (
    <group position={[0, -0.14 + pose.bobY, 0]} rotation={[pose.bodyTiltX, pose.bodyTurnY, pose.bodyTiltZ]}>
      <group position={[0, -0.2, 0]}>
        <mesh geometry={torsoGeo}>
          <meshPhysicalMaterial
            color="#F4F7FE"
            roughness={0.4}
            bumpMap={bumpMap}
            bumpScale={0.004}
            clearcoat={0.28}
            sheen={0.3}
            sheenColor="#DBEAFE"
          />
        </mesh>
        <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.35, 0.05, 20, 48]} />
          <meshPhysicalMaterial color="#3B82F6" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.04, 0.39]} scale={[1, 1, 0.3]}>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshPhysicalMaterial color="#0F172A" roughness={0.18} clearcoat={0.85} />
        </mesh>
        <mesh geometry={chestStarGeo} position={[0, 0.04, 0.455]} rotation={[0, 0, Math.sin(pose.starSpin) * 0.14]}>
          <meshPhysicalMaterial vertexColors emissive="#6366F1" emissiveIntensity={0.32} roughness={0.25} clearcoat={0.5} />
        </mesh>
      </group>

      <group position={[0, 0.56, 0]} rotation={[0, pose.headTurnY, pose.headTiltZ]}>
        <mesh geometry={headGeo}>
          <meshPhysicalMaterial
            color="#F8FAFC"
            roughness={0.36}
            bumpMap={bumpMap}
            bumpScale={0.004}
            clearcoat={0.34}
            clearcoatRoughness={0.22}
          />
        </mesh>

        {[-0.75, 0.75].map((ex, idx) => (
          <group key={idx} position={[ex, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.13, 32]} />
              <meshPhysicalMaterial color={idx === 0 ? '#2563EB' : '#EC4899'} roughness={0.35} clearcoat={0.4} />
            </mesh>
            <mesh position={[idx === 0 ? -0.075 : 0.075, 0, 0]} scale={[0.45, 1, 1]}>
              <sphereGeometry args={[0.13, 24, 24]} />
              <meshPhysicalMaterial color="#FBBF24" emissive="#F59E0B" emissiveIntensity={0.25} roughness={0.3} />
            </mesh>
          </group>
        ))}

        <mesh geometry={visorGeo} position={[0, -0.02, 0.34]}>
          <meshPhysicalMaterial
            color="#090F26"
            roughness={0.08}
            metalness={0.08}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
          />
        </mesh>

        <group position={[0, -0.02, 0.665]}>
          <mesh geometry={leftEyeStarGeo} position={[-0.22, 0.05, 0]} scale={[1, pose.eyeScaleY, 1]}>
            <meshBasicMaterial vertexColors />
          </mesh>
          <mesh geometry={rightEyeStarGeo} position={[0.22, 0.05, 0]} scale={[1, pose.eyeScaleY, 1]}>
            <meshBasicMaterial vertexColors />
          </mesh>
          {[-0.35, 0.35].map((bx, idx) => (
            <mesh key={idx} position={[bx, -0.085, -0.02]} scale={[1.3, 0.68, 0.3]}>
              <sphereGeometry args={[0.044, 16, 16]} />
              <meshBasicMaterial color="#FB7185" transparent opacity={0.8} />
            </mesh>
          ))}
          <mesh position={[0, -0.1, 0.01]} rotation={[0, 0, Math.PI]} scale={[1, 0.8 + pose.mouthOpen * 0.5, 1]}>
            <torusGeometry args={[0.072, 0.018, 16, 32, Math.PI]} />
            <meshBasicMaterial color="#93C5FD" />
          </mesh>
          <mesh position={[-0.36, 0.21, -0.03]} rotation={[0, 0, 0.55]} scale={[1, 0.4, 0.2]}>
            <sphereGeometry args={[0.072, 16, 16]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.52} />
          </mesh>
        </group>

        <group position={[0, 0.78 + Math.sin(pose.starSpin * 1.6) * 0.035, 0]}>
          <mesh geometry={haloStarGeo} rotation={[0.08, pose.starSpin, 0]}>
            <meshPhysicalMaterial vertexColors emissive="#8B5CF6" emissiveIntensity={0.28} roughness={0.28} clearcoat={0.4} />
          </mesh>
          <mesh rotation={[Math.PI / 2.3, 0.2, pose.starSpin * 0.5]}>
            <torusGeometry args={[0.31, 0.013, 16, 64]} />
            <meshStandardMaterial color="#93C5FD" emissive="#60A5FA" emissiveIntensity={0.5} transparent opacity={0.75} />
          </mesh>
        </group>
      </group>

      <group position={[-0.58, -0.12, 0.05]} rotation={[pose.leftArmX, 0, pose.leftArmZ]}>
        <mesh position={[-0.09, -0.11, 0]} rotation={[0, 0, 0.42]}>
          <capsuleGeometry args={[0.115, 0.2, 20, 32]} />
          <meshPhysicalMaterial color="#F1F5F9" roughness={0.38} clearcoat={0.3} />
        </mesh>
        <mesh position={[-0.145, -0.22, 0]}>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshPhysicalMaterial color="#3B82F6" roughness={0.4} />
        </mesh>
      </group>

      <group position={[0.58, -0.12, 0.05]} rotation={[pose.rightArmX, 0, pose.rightArmZ]}>
        <mesh position={[0.09, -0.11, 0]} rotation={[0, 0, -0.42]}>
          <capsuleGeometry args={[0.115, 0.2, 20, 32]} />
          <meshPhysicalMaterial color="#F1F5F9" roughness={0.38} clearcoat={0.3} />
        </mesh>
        <mesh position={[0.145, -0.22, 0]}>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshPhysicalMaterial color="#C084FC" roughness={0.4} />
        </mesh>
      </group>

      {[-0.24, 0.24].map((lx, idx) => (
        <group key={idx} position={[lx, -0.62, 0.02]} rotation={[idx === 0 ? pose.leftLegX : pose.rightLegX, 0, 0]}>
          <mesh position={[0, -0.11, 0]}>
            <capsuleGeometry args={[0.14, 0.15, 20, 32]} />
            <meshPhysicalMaterial color="#F8FAFC" roughness={0.42} clearcoat={0.25} />
          </mesh>
          <mesh position={[0, -0.22, 0.03]} scale={[1.05, 0.55, 1.25]}>
            <sphereGeometry args={[0.15, 24, 24]} />
            <meshPhysicalMaterial color={idx === 0 ? '#1D4ED8' : '#7C3AED'} roughness={0.45} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/**
 * VARIANT C: "双子星占星使 · Gemini Starlight Chibi" (Matches DeepSeek / Doubao 3D Pop-Mart Chibi Figure style)
 */
const GeminiStarlightChibi: React.FC<{pose: ReturnType<typeof computePose>; bumpMap: THREE.Texture}> = ({pose}) => {
  const dressGeo = useMemo(() => createPleatedSkirtGeometry(0.23, 0.59, 0.66, 14, 0.028, ['#172554', '#2563EB']), []);
  const capeGeo = useMemo(() => createPleatedSkirtGeometry(0.24, 0.53, 0.34, 8, 0.015, ['#FFFFFF', '#DDD6FE']), []);
  const hairpinStarGeo = useMemo(
    () => createPlumpSparkleGeometry({tipRadius: 0.15, waistRadius: 0.055, depth: 0.055, sharpness: 1.6, segs: 48, colorMode: 'gold'}),
    [],
  );
  const broochStarGeo = useMemo(
    () => createPlumpSparkleGeometry({tipRadius: 0.13, waistRadius: 0.048, depth: 0.048, sharpness: 1.6, segs: 48}),
    [],
  );
  const twinBlueGeo = useMemo(
    () => createPlumpSparkleGeometry({tipRadius: 0.18, waistRadius: 0.065, depth: 0.07, sharpness: 1.6, segs: 48, colorMode: 'blue'}),
    [],
  );
  const twinPinkGeo = useMemo(
    () => createPlumpSparkleGeometry({tipRadius: 0.18, waistRadius: 0.065, depth: 0.07, sharpness: 1.6, segs: 48, colorMode: 'pink'}),
    [],
  );
  const pupilStarGeo = useMemo(
    () => createPlumpSparkleGeometry({tipRadius: 0.045, waistRadius: 0.015, depth: 0.012, sharpness: 1.65, segs: 32, colorMode: 'white'}),
    [],
  );

  // Full, lush overlapping chibi bangs + side hime locks + twin starlight curls
  const hairLocks = useMemo(() => {
    const specs: {pts: [number, number, number][]; r: number; fz?: number}[] = [
      // Dense full bangs covering top forehead seamlessly
      {pts: [[0.0, 0.52, 0.14], [-0.14, 0.44, 0.46], [-0.21, 0.28, 0.52], [-0.23, 0.14, 0.49]], r: 0.155, fz: 0.62},
      {pts: [[0.02, 0.53, 0.14], [-0.02, 0.45, 0.48], [-0.04, 0.28, 0.54], [-0.06, 0.13, 0.5]], r: 0.16, fz: 0.62},
      {pts: [[0.06, 0.52, 0.14], [0.14, 0.44, 0.47], [0.18, 0.28, 0.53], [0.15, 0.14, 0.49]], r: 0.155, fz: 0.62},
      {pts: [[-0.08, 0.5, 0.13], [-0.29, 0.4, 0.43], [-0.39, 0.21, 0.46], [-0.43, 0.03, 0.42]], r: 0.155, fz: 0.65},
      {pts: [[0.1, 0.5, 0.13], [0.3, 0.4, 0.43], [0.4, 0.21, 0.46], [0.44, 0.03, 0.42]], r: 0.155, fz: 0.65},
      // Cheek-framing hime tendrils
      {pts: [[-0.36, 0.38, 0.16], [-0.5, 0.14, 0.27], [-0.52, -0.14, 0.28], [-0.47, -0.34, 0.26]], r: 0.135, fz: 0.72},
      {pts: [[0.36, 0.38, 0.16], [0.5, 0.14, 0.27], [0.52, -0.14, 0.28], [0.47, -0.34, 0.26]], r: 0.135, fz: 0.72},
      // Long flowing twin side curls
      {pts: [[-0.4, 0.4, 0.02], [-0.62, 0.1, 0.08], [-0.7, -0.34, 0.1], [-0.78, -0.68, 0.18], [-0.68, -0.88, 0.26]], r: 0.18, fz: 0.85},
      {pts: [[0.4, 0.4, 0.02], [0.62, 0.1, 0.08], [0.7, -0.34, 0.1], [0.78, -0.68, 0.18], [0.68, -0.88, 0.26]], r: 0.18, fz: 0.85},
      // Voluminous back hair
      {pts: [[-0.28, 0.44, -0.18], [-0.52, 0.02, -0.2], [-0.62, -0.48, -0.14], [-0.54, -0.86, -0.02]], r: 0.21, fz: 0.9},
      {pts: [[0.28, 0.44, -0.18], [0.52, 0.02, -0.2], [0.62, -0.48, -0.14], [0.54, -0.86, -0.02]], r: 0.21, fz: 0.9},
      {pts: [[0, 0.46, -0.22], [0, 0.0, -0.34], [0, -0.5, -0.28], [0.05, -0.86, -0.16]], r: 0.24, fz: 0.9},
    ];
    return specs.map((s) => createHairLockGeometry(s.pts, s.r, s.fz ?? 0.75));
  }, []);

  return (
    <group position={[0, -0.08 + pose.bobY, 0]} rotation={[pose.bodyTiltX, pose.bodyTurnY, pose.bodyTiltZ]}>
      <group position={[0, -0.34, 0]}>
        <mesh geometry={dressGeo}>
          <meshPhysicalMaterial vertexColors roughness={0.52} sheen={0.55} sheenColor="#93C5FD" />
        </mesh>
        <mesh position={[0, -0.32, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.92, 1]}>
          <torusGeometry args={[0.575, 0.034, 16, 64]} />
          <meshPhysicalMaterial color="#FFFFFF" roughness={0.45} />
        </mesh>
        <mesh geometry={capeGeo} position={[0, 0.18, 0]}>
          <meshPhysicalMaterial vertexColors roughness={0.46} sheen={0.5} sheenColor="#F5D0FE" />
        </mesh>
        <mesh position={[-0.08, 0.22, 0.34]} rotation={[0, 0, 0.35]} scale={[1.2, 0.65, 0.4]}>
          <sphereGeometry args={[0.075, 20, 20]} />
          <meshStandardMaterial color="#1E3A8A" roughness={0.45} />
        </mesh>
        <mesh position={[0.08, 0.22, 0.34]} rotation={[0, 0, -0.35]} scale={[1.2, 0.65, 0.4]}>
          <sphereGeometry args={[0.075, 20, 20]} />
          <meshStandardMaterial color="#1E3A8A" roughness={0.45} />
        </mesh>
        <mesh geometry={broochStarGeo} position={[0, 0.22, 0.38]}>
          <meshPhysicalMaterial vertexColors emissive="#F59E0B" emissiveIntensity={0.25} roughness={0.25} clearcoat={0.6} />
        </mesh>
      </group>

      <group position={[0, 0.44, 0]} rotation={[0, pose.headTurnY, pose.headTiltZ]}>
        {/* Warm rosy peach blind-box vinyl skin */}
        <mesh scale={[1.05, 0.95, 0.9]}>
          <sphereGeometry args={[0.5, 64, 64]} />
          <meshPhysicalMaterial
            color="#FFD7C2"
            emissive="#FF8A65"
            emissiveIntensity={0.08}
            roughness={0.52}
            sheen={0.35}
            sheenColor="#FECDD3"
            clearcoat={0.06}
          />
        </mesh>
        {/* Back/crown hair cap cleanly behind face */}
        <mesh position={[0, 0.16, -0.1]} scale={[1.09, 0.98, 0.98]}>
          <sphereGeometry args={[0.51, 48, 48]} />
          <meshPhysicalMaterial color="#1B56E4" roughness={0.44} sheen={0.55} sheenColor="#C4B5FD" clearcoat={0.12} />
        </mesh>

        <mesh position={[0, -0.065, 0.458]}>
          <sphereGeometry args={[0.022, 16, 16]} />
          <meshStandardMaterial color="#F2B09B" roughness={0.5} />
        </mesh>

        {[-0.5, 0.5].map((ex, idx) => (
          <mesh key={idx} position={[ex, -0.04, 0.02]} scale={[0.45, 0.85, 0.65]}>
            <sphereGeometry args={[0.11, 20, 20]} />
            <meshPhysicalMaterial color="#FFD2BA" emissive="#FF8A65" emissiveIntensity={0.07} roughness={0.55} />
          </mesh>
        ))}

        {/* Big expressive chibi anime eyes with gentle flatter upper lash */}
        {[-0.195, 0.195].map((ex, idx) => (
          <group
            key={idx}
            position={[ex, -0.035, 0.415]}
            rotation={[0, idx === 0 ? -0.17 : 0.17, 0]}
            scale={[1, pose.eyeScaleY, 1]}
          >
            <mesh scale={[1.05, 1.08, 0.32]}>
              <sphereGeometry args={[0.132, 32, 32]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.22} />
            </mesh>
            <mesh position={[0, -0.005, 0.02]} scale={[0.88, 0.98, 0.3]}>
              <sphereGeometry args={[0.122, 32, 32]} />
              <meshPhysicalMaterial color="#1E3A8A" roughness={0.1} clearcoat={1.0} />
            </mesh>
            <mesh position={[0, -0.026, 0.03]} scale={[0.72, 0.7, 0.26]}>
              <sphereGeometry args={[0.104, 32, 32]} />
              <meshBasicMaterial color={idx === 0 ? '#60A5FA' : '#C084FC'} />
            </mesh>
            <mesh position={[0, 0.005, 0.038]} scale={[0.48, 0.54, 0.24]}>
              <sphereGeometry args={[0.1, 24, 24]} />
              <meshBasicMaterial color="#0F172A" />
            </mesh>
            <mesh geometry={pupilStarGeo} position={[-0.035, 0.042, 0.064]} />
            <mesh position={[0.038, -0.035, 0.06]}>
              <sphereGeometry args={[0.019, 16, 16]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
            {/* Gentle soft-arch upper lash line */}
            <mesh position={[0, 0.035, 0.03]} rotation={[0, 0, idx === 0 ? 0.16 : 0.08]} scale={[1.15, 0.65, 0.4]}>
              <torusGeometry args={[0.125, 0.022, 12, 32, Math.PI * 0.78]} />
              <meshStandardMaterial color="#1E1B4B" roughness={0.4} />
            </mesh>
          </group>
        ))}

        {/* Soft peach-pink chibi blush */}
        {[-0.31, 0.31].map((bx, idx) => (
          <mesh key={idx} position={[bx, -0.14, 0.39]} rotation={[0, idx === 0 ? -0.35 : 0.35, 0]} scale={[1.38, 0.68, 0.25]}>
            <sphereGeometry args={[0.072, 24, 24]} />
            <meshBasicMaterial color="#FB7185" transparent opacity={0.48} />
          </mesh>
        ))}

        {/* Sweet petite smile */}
        <mesh position={[0, -0.178, 0.442]} rotation={[0, 0, Math.PI]} scale={[1, 0.78 + pose.mouthOpen * 0.48, 1]}>
          <torusGeometry args={[0.046, 0.013, 16, 32, Math.PI]} />
          <meshStandardMaterial color="#E11D48" roughness={0.4} />
        </mesh>

        {hairLocks.map((geo, i) => (
          <mesh key={i} geometry={geo}>
            <meshPhysicalMaterial vertexColors roughness={0.42} sheen={0.58} sheenColor="#F5D0FE" clearcoat={0.14} />
          </mesh>
        ))}

        <mesh geometry={hairpinStarGeo} position={[0.32, 0.25, 0.5]} rotation={[0.12, 0.32, -0.18]}>
          <meshPhysicalMaterial vertexColors emissive="#F59E0B" emissiveIntensity={0.26} roughness={0.24} clearcoat={0.6} />
        </mesh>

        <group position={[-0.1, 0.54, -0.04]} rotation={[0.1, 0, 0.2]}>
          <mesh scale={[1.12, 0.4, 1.1]}>
            <sphereGeometry args={[0.41, 40, 32]} />
            <meshPhysicalMaterial color="#1E293B" roughness={0.62} sheen={0.5} sheenColor="#93C5FD" />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <sphereGeometry args={[0.06, 20, 20]} />
            <meshPhysicalMaterial color="#FBBF24" roughness={0.28} metalness={0.25} />
          </mesh>
        </group>
      </group>

      <group position={[-0.38, -0.16, 0.1]} rotation={[pose.leftArmX, 0, pose.leftArmZ]}>
        <mesh position={[-0.08, -0.06, 0]}>
          <sphereGeometry args={[0.085, 20, 20]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.48} />
        </mesh>
        <mesh position={[-0.15, -0.17, 0]} rotation={[0, 0, 0.52]}>
          <capsuleGeometry args={[0.068, 0.18, 16, 24]} />
          <meshPhysicalMaterial color="#FFD7C2" emissive="#FF8A65" emissiveIntensity={0.07} roughness={0.54} />
        </mesh>
      </group>
      <group position={[0.38, -0.16, 0.1]} rotation={[pose.rightArmX, 0, pose.rightArmZ]}>
        <mesh position={[0.08, -0.06, 0]}>
          <sphereGeometry args={[0.085, 20, 20]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.48} />
        </mesh>
        <mesh position={[0.15, -0.17, 0]} rotation={[0, 0, -0.52]}>
          <capsuleGeometry args={[0.068, 0.18, 16, 24]} />
          <meshPhysicalMaterial color="#FFD7C2" emissive="#FF8A65" emissiveIntensity={0.07} roughness={0.54} />
        </mesh>
      </group>

      {[-0.16, 0.16].map((lx, idx) => (
        <group key={idx} position={[lx, -0.65, 0.02]} rotation={[idx === 0 ? pose.leftLegX : pose.rightLegX, 0, 0]}>
          <mesh position={[0, -0.08, 0]}>
            <capsuleGeometry args={[0.08, 0.14, 16, 24]} />
            <meshPhysicalMaterial color="#FFD7C2" emissive="#FF8A65" emissiveIntensity={0.07} roughness={0.54} />
          </mesh>
          <mesh position={[0, -0.16, 0]}>
            <cylinderGeometry args={[0.086, 0.086, 0.1, 24]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.48} />
          </mesh>
          <mesh position={[0, -0.23, 0.035]} scale={[1.05, 0.62, 1.3]}>
            <sphereGeometry args={[0.108, 24, 24]} />
            <meshPhysicalMaterial color="#1E293B" roughness={0.25} clearcoat={0.8} />
          </mesh>
        </group>
      ))}

      <mesh
        geometry={twinBlueGeo}
        position={[-0.86, 0.32 + Math.sin(pose.starSpin * 1.4) * 0.065, 0.22]}
        rotation={[0.1, pose.starSpin, 0.15]}
      >
        <meshPhysicalMaterial vertexColors emissive="#3B82F6" emissiveIntensity={0.25} roughness={0.28} clearcoat={0.4} />
      </mesh>
      <mesh
        geometry={twinPinkGeo}
        position={[0.86, 0.52 + Math.cos(pose.starSpin * 1.4) * 0.065, 0.22]}
        rotation={[-0.1, -pose.starSpin, -0.15]}
      >
        <meshPhysicalMaterial vertexColors emissive="#F472B6" emissiveIntensity={0.25} roughness={0.28} clearcoat={0.4} />
      </mesh>
    </group>
  );
};

export const GeminiMascot3D: React.FC<GeminiMascot3DProps> = ({
  variant = 'sparkle',
  action = 'idle',
  bgMode = 'transparent',
  showShadow = true,
  cameraYaw = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const sec = frame / fps;

  const bumpMap = useMemo(() => createClayBumpTexture(), []);
  const shadowTex = useMemo(() => createSoftShadowTexture(), []);
  const pose = computePose(action, sec);

  const camDist = 5.35;
  const camX = Math.sin(cameraYaw) * camDist;
  const camZ = Math.cos(cameraYaw) * camDist;

  return (
    <AbsoluteFill
      style={{
        backgroundColor:
          bgMode === 'greenscreen' ? '#00FF00' : bgMode === 'studio' ? '#0F172A' : 'transparent',
      }}
    >
      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        gl={{alpha: bgMode === 'transparent', antialias: true, preserveDrawingBuffer: true}}
        camera={{fov: 34, position: [camX, 0.12, camZ], near: 0.1, far: 30}}
      >
        {bgMode === 'greenscreen' && <color attach="background" args={['#00FF00']} />}
        {bgMode === 'studio' && <color attach="background" args={['#0F172A']} />}
        <StudioLighting />

        <group position={[0, 0.02, 0]}>
          {variant === 'sparkle' && <SparkleClayMascot pose={pose} bumpMap={bumpMap} />}
          {variant === 'bot' && <GeminiAstroBot pose={pose} bumpMap={bumpMap} />}
          {variant === 'chibi' && <GeminiStarlightChibi pose={pose} bumpMap={bumpMap} />}

          <ActionPropsLayer pose={pose} sec={sec} yOffset={variant === 'sparkle' ? 0.15 : 0.05} />

          {showShadow && bgMode !== 'greenscreen' && (
            <mesh position={[0, -0.94, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.45, 0.85, 1]}>
              <planeGeometry args={[1.65, 1.65]} />
              <meshBasicMaterial map={shadowTex} transparent depthWrite={false} opacity={1 - pose.bobY * 1.1} />
            </mesh>
          )}
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
