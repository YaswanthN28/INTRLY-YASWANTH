"use client"

import Editor from "@monaco-editor/react"

interface LatexEditorProps {
  value: string
  onChange: (value: string) => void
}

export function LatexEditor({ value, onChange }: LatexEditorProps) {
  return (
    <div className="absolute inset-0">
      <Editor
        height="100%"
        defaultLanguage="latex"
        language="latex"
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val || "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          padding: { top: 16 },
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  )
}
