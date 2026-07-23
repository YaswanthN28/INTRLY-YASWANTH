"use client"

import * as React from "react"
import Webcam from "react-webcam"
import { CameraOff } from "lucide-react"

interface WebcamPreviewProps {
  isCameraOn: boolean
}

export function WebcamPreview({ isCameraOn }: WebcamPreviewProps) {
  if (!isCameraOn) {
    return (
      <div className="w-full h-full bg-muted flex flex-col items-center justify-center rounded-xl overflow-hidden border border-border/50 shadow-inner">
        <div className="p-4 bg-background/50 rounded-full mb-2">
          <CameraOff className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Camera is off</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border/50 shadow-sm relative bg-black">
      <Webcam
        audio={false}
        mirrored={true}
        className="w-full h-full object-cover"
        videoConstraints={{
          width: 1280,
          height: 720,
          facingMode: "user"
        }}
      />
      {/* Live Indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-bold text-white tracking-wider uppercase">Live</span>
      </div>
    </div>
  )
}
