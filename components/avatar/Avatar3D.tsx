"use client"

import * as React from "react"
import { useRef, useState, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { GLTFLoader } from "three-stdlib"

interface AvatarProps {
  isSpeaking: boolean
  emotion: string
  interviewerType: 'aarav' | 'reshma'
}

export function Avatar({ isSpeaking, emotion, interviewerType }: AvatarProps) {
  const group = useRef<THREE.Group>(null)
  const mouthRef = useRef<THREE.Mesh>(null)
  const leftEyeRef = useRef<THREE.Mesh>(null)
  const rightEyeRef = useRef<THREE.Mesh>(null)
  
  const [blinkTimer, setBlinkTimer] = useState(0)
  const [isBlinking, setIsBlinking] = useState(false)
  const [gltf, setGltf] = useState<any>(null)
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null)
  const [activeAction, setActiveAction] = useState<THREE.AnimationAction | null>(null)

  // Dynamically load GLTF model if it exists
  useEffect(() => {
    const loader = new GLTFLoader()
    const modelPath = `/models/${interviewerType}.glb`

    loader.load(
      modelPath,
      (gltfData) => {
        setGltf(gltfData)
        if (gltfData.animations && gltfData.animations.length > 0) {
          const newMixer = new THREE.AnimationMixer(gltfData.scene)
          setMixer(newMixer)
        }
      },
      undefined,
      (error) => {
        console.warn(`Could not load 3D model from ${modelPath}. Falling back to default avatar.`, error)
        setGltf(null)
        setMixer(null)
      }
    )
  }, [interviewerType])

  // Handle Animations
  useEffect(() => {
    if (!mixer || !gltf) return

    // Find animation clip matching the current state
    // Expected clips: "idle", "speaking", "listening", "thinking"
    let clipName = "idle"
    if (isSpeaking) {
      clipName = "speaking"
    } else if (emotion === "listening") {
      clipName = "listening"
    } else if (emotion === "thinking") {
      clipName = "thinking"
    }

    const clip = gltf.animations.find((a: any) => a.name.toLowerCase().includes(clipName)) || gltf.animations[0]
    if (clip) {
      const action = mixer.clipAction(clip)
      action.reset()
      action.fadeIn(0.2)
      action.play()
      
      if (activeAction && activeAction !== action) {
        activeAction.fadeOut(0.2)
      }
      setActiveAction(action)
    }
  }, [emotion, isSpeaking, mixer, gltf, activeAction])

  useFrame((state, delta) => {
    // 1. Play GLTF skeletal animations if loaded
    if (mixer) {
      mixer.update(delta)
      return
    }

    // 2. Fallback Primitive Animations (floating & moving eyes/mouth)
    if (group.current) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.05
      
      // Slight head tilt when thinking
      if (emotion === 'thinking') {
        group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0.08, 0.1)
      } else {
        group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 0.1)
      }
    }

    // Blinking
    setBlinkTimer((prev) => prev + delta)
    if (blinkTimer > (Math.random() * 3 + 3)) {
      setIsBlinking(true)
      setBlinkTimer(0)
    }

    if (isBlinking) {
      if (leftEyeRef.current && rightEyeRef.current) {
        leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, 0.1, 0.4)
        rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, 0.1, 0.4)
        if (leftEyeRef.current.scale.y < 0.15) {
          setIsBlinking(false)
        }
      }
    } else {
      if (leftEyeRef.current && rightEyeRef.current) {
        leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, 1, 0.3)
        rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, 1, 0.3)
      }
    }

    // Lip sync / mouth movement
    if (mouthRef.current) {
      if (isSpeaking) {
        const targetScaleY = 0.3 + Math.random() * 0.7
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, targetScaleY, 0.3)
      } else {
        const targetScaleY = emotion === 'smile' || emotion === 'happy' ? 0.3 : 0.1
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, targetScaleY, 0.2)
      }
    }
  })

  return (
    <group>
      {/* ── PREMIUM OFFICE ENVIRONMENT ── */}
      
      {/* Glass Back Wall */}
      <mesh position={[0, 1.5, -4]}>
        <planeGeometry args={[15, 8]} />
        <meshPhysicalMaterial 
          color="#ffffff" 
          transmission={0.9} 
          opacity={1} 
          roughness={0.1} 
          ior={1.5} 
          thickness={0.5} 
        />
      </mesh>

      {/* Dark Corporate Background behind glass */}
      <mesh position={[0, 1.5, -4.5]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>

      {/* Modern Desk */}
      <group position={[0, -1.2, 1]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[4, 0.1, 1.5]} />
          <meshStandardMaterial color="#2d3748" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[-1.8, -0.6, 0]} castShadow>
          <boxGeometry args={[0.1, 1.2, 1.3]} />
          <meshStandardMaterial color="#1a202c" metalness={0.9} />
        </mesh>
        <mesh position={[1.8, -0.6, 0]} castShadow>
          <boxGeometry args={[0.1, 1.2, 1.3]} />
          <meshStandardMaterial color="#1a202c" metalness={0.9} />
        </mesh>
      </group>

      {/* Laptop (facing candidate) */}
      <group position={[-0.8, -1.1, 1]}>
        {/* Base */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[0.7, 0.04, 0.5]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0.25, -0.22]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.7, 0.5, 0.04]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Screen Glow */}
        <mesh position={[0, 0.25, -0.19]} rotation={[0.2, 0, 0]}>
          <planeGeometry args={[0.65, 0.45]} />
          <meshBasicMaterial color="#4fd1c5" />
        </mesh>
      </group>

      {/* Indoor Plant (Right) */}
      <group position={[2.5, -1.5, -2]}>
        {/* Pot */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.3, 0.8, 32]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
        {/* Plant Leaves Placeholder */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshStandardMaterial color="#2f855a" roughness={0.9} />
        </mesh>
        <mesh position={[-0.3, 1.5, 0.2]} castShadow>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color="#276749" roughness={0.9} />
        </mesh>
      </group>

      {/* ── AVATAR ── */}
      {gltf ? (
        // Render imported GLB if successfully loaded
        <primitive object={gltf.scene} scale={[1.8, 1.8, 1.8]} position={[0, -1.8, -0.5]} />
      ) : (
        // Render fallback Stylized Primitive Avatar sitting behind desk
        <group ref={group} position={[0, -0.4, -0.5]}>
          {/* Torso/Blazer (Navy Blue) */}
          <mesh position={[0, -0.8, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.7, 0.9, 1.2, 32]} />
            <meshStandardMaterial color="#1e3a8a" roughness={0.7} />
          </mesh>
          
          {/* Inner T-Shirt (Black Crew-Neck) */}
          <mesh position={[0, -0.25, 0.05]}>
            <cylinderGeometry args={[0.35, 0.38, 0.2, 32]} />
            <meshStandardMaterial color="#171717" roughness={0.8} />
          </mesh>

          {/* Neck */}
          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.22, 0.4, 32]} />
            <meshStandardMaterial color="#f5d0a9" roughness={0.5} />
          </mesh>

          {/* Head */}
          <mesh position={[0, 0.6, 0]} castShadow>
            <sphereGeometry args={[0.45, 32, 32]} />
            <meshStandardMaterial color="#f5d0a9" roughness={0.6} />
          </mesh>

          {/* Professional Glasses */}
          <group position={[0, 0.65, 0.35]}>
            {/* Left Rim */}
            <mesh position={[-0.18, 0, 0]}>
              <ringGeometry args={[0.08, 0.1, 32]} />
              <meshBasicMaterial color="#111827" />
            </mesh>
            {/* Right Rim */}
            <mesh position={[0.18, 0, 0]}>
              <ringGeometry args={[0.08, 0.1, 32]} />
              <meshBasicMaterial color="#111827" />
            </mesh>
            {/* Bridge */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.1, 0.02, 0.01]} />
              <meshBasicMaterial color="#111827" />
            </mesh>
          </group>

          {/* Left Eye */}
          <mesh ref={leftEyeRef} position={[-0.18, 0.65, 0.36]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshBasicMaterial color="#111827" />
          </mesh>

          {/* Right Eye */}
          <mesh ref={rightEyeRef} position={[0.18, 0.65, 0.36]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshBasicMaterial color="#111827" />
          </mesh>

          {/* Mouth */}
          <mesh ref={mouthRef} position={[0, 0.4, 0.41]}>
            <boxGeometry args={[0.12, 0.02, 0.01]} />
            <meshBasicMaterial color={isSpeaking ? "#b91c1c" : "#111827"} />
          </mesh>
        </group>
      )}
    </group>
  )
}
