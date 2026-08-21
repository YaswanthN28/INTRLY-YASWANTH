import { NextResponse } from "next/server"
import { compileLatexToPdf, LatexCompilationError } from "@/lib/latex/compiler"
import { analyzeAtsScore } from "@/lib/resume/atsScore"

export async function POST(request: Request) {
  try {
    let { latex } = await request.json()

    if (!latex) {
      return NextResponse.json({ success: false, error: { type: "INVALID_REQUEST", message: "LaTeX code is required" } }, { status: 400 })
    }

    // Sanitize latex code if the user pasted a markdown block from ChatGPT
    if (latex.includes("```")) {
      // Try to extract content inside the first markdown code block
      const match = latex.match(/```[a-zA-Z]*\n([\s\S]*?)```/)
      if (match) {
        latex = match[1]
      } else {
        latex = latex.replace(/```[a-zA-Z]*/g, "").replace(/```/g, "")
      }
    }

    // Basic source validation
    if (!latex.includes("\\documentclass") || !latex.includes("\\begin{document}") || !latex.includes("\\end{document}")) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            type: "INVALID_LATEX", 
            message: "Invalid LaTeX document\n\nYour resume source must contain:\n\\documentclass\n\\begin{document}\n\\end{document}\n\nPlease paste a complete LaTeX resume." 
          } 
        }, 
        { status: 400 }
      )
    }

    // Run PDF compilation
    let pdfBuffer: Buffer
    try {
      pdfBuffer = await compileLatexToPdf(latex)
    } catch (compileError: any) {
      if (compileError instanceof LatexCompilationError) {
        return NextResponse.json(
          { success: false, error: compileError.details },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { success: false, error: { type: "UNKNOWN_ERROR", message: compileError.message } },
        { status: 500 }
      )
    }

    // Try to get ATS score, but don't fail if it crashes
    let atsScoreData = null
    try {
      atsScoreData = await analyzeAtsScore(latex)
    } catch (atsError) {
      console.error("ATS Analysis failed:", atsError)
    }

    // Return the PDF buffer with application/pdf content type
    // and put ATS score in a custom header if available
    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"resume.pdf\"",
    })

    if (atsScoreData) {
      headers.set("X-ATS-Score", JSON.stringify(atsScoreData))
    }

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers
    })

  } catch (error: any) {
    console.error("Unexpected compilation error:", error)
    return NextResponse.json(
      { success: false, error: { type: "SERVER_ERROR", message: error.message || "Failed to process request" } },
      { status: 500 }
    )
  }
}
