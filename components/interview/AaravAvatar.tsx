"use client"

import React, { useRef, useEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

interface AaravAvatarProps {
  mood: 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy' | 'serious'
}

export function AaravAvatar({ mood }: AaravAvatarProps) {
  const group = useRef<THREE.Group>(null)
  
  // We attempt to load aarav.glb. If it's missing, R3F will throw, so in production we should catch it.
  // For now we assume the user will place it in public/models/aarav.glb
  const { scene, animations } = useGLTF('/models/aarav.glb')
  const { actions, mixer } = useAnimations(animations, group)

  useEffect(() => {
    // Crossfade animations based on mood if actions exist
    if (actions && Object.keys(actions).length > 0) {
      const actionName = getAnimationForMood(mood)
      if (actions[actionName]) {
        actions[actionName]?.reset().fadeIn(0.5).play()
        return () => {
          actions[actionName]?.fadeOut(0.5)
        }
      } else {
        // Fallback to first animation if specific one is missing
        const fallback = Object.values(actions)[0]
        if (fallback) fallback.play()
      }
    } else {
      // Procedural fallback if no animations exist
      if (mood === 'thinking' && group.current) {
         group.current.position.y = Math.sin(Date.now() / 500) * 0.05
      } else if (mood === 'speaking' && scene) {
         // Naive amplitude-based mouth movement check (assuming mesh names)
         scene.traverse((child) => {
           if ((child as any).isMesh && child.name.toLowerCase().includes('head')) {
             if ((child as any).morphTargetDictionary?.['mouthOpen']) {
               const idx = (child as any).morphTargetDictionary['mouthOpen']
               ;(child as any).morphTargetInfluences[idx] = Math.random() * 0.8
             }
           }
         })
      }
    }
  }, [mood, actions, scene])

  // Simple procedural breathing
  useEffect(() => {
    let frame: number
    const animate = () => {
      if (group.current && mood === 'idle' || mood === 'listening') {
        group.current.position.y = Math.sin(Date.now() / 1000) * 0.02
      }
      frame = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(frame)
  }, [mood])

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}

function getAnimationForMood(mood: string): string {
  switch (mood) {
    case 'listening': return 'Listen'
    case 'thinking': return 'Think'
    case 'speaking': return 'Talk'
    case 'happy': return 'Smile'
    case 'serious': return 'Neutral'
    case 'idle':
    default: return 'Idle'
  }
}

useGLTF.preload('/models/aarav.glb')
