import { promises as fs } from "fs"
import path from "path"
import os from "os"
import crypto from "crypto"
import { execFile } from "child_process"
import { promisify } from "util"

const execFileAsync = promisify(execFile)

export interface CompileError {
  type: string
  message: string
  log?: string
}

export class LatexCompilationError extends Error {
  public details: CompileError

  constructor(details: CompileError) {
    super(details.message)
    this.name = "LatexCompilationError"
    this.details = details
  }
}

/**
 * Compiles LaTeX source code into a PDF buffer.
 * Uses a temporary directory and executes `pdflatex`.
 */
export async function compileLatexToPdf(latexCode: string): Promise<Buffer> {
  const tmpDir = path.join(os.tmpdir(), `intrly-latex-${crypto.randomUUID()}`)
  
  try {
    await fs.mkdir(tmpDir, { recursive: true })
    const texFilePath = path.join(tmpDir, "resume.tex")
    await fs.writeFile(texFilePath, latexCode, "utf8")

    try {
      await execFileAsync(
        "pdflatex",
        [
          "-interaction=nonstopmode",
          "-halt-on-error",
          "resume.tex"
        ],
        {
          cwd: tmpDir,
          timeout: 120000,
        }
      )
    } catch (execError: any) {
      let isFallbackSuccessful = false
      if (execError.code === "ENOENT") {
        try {
          await execFileAsync(
            "C:\\Users\\yaswa\\AppData\\Local\\Programs\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe",
            [
              "-interaction=nonstopmode",
              "-halt-on-error",
              "resume.tex"
            ],
            {
              cwd: tmpDir,
              timeout: 120000,
            }
          )
          isFallbackSuccessful = true
        } catch (fallbackError: any) {
          execError = fallbackError // overwrite with fallback error to process logs below
        }
      }

      if (!isFallbackSuccessful) {
        if (execError.code === "ENOENT") {
          throw new LatexCompilationError({
            type: "DEPENDENCY_MISSING",
            message: "LaTeX compiler (pdflatex) is not installed on the server. Please install TeX Live or a compatible distribution."
          })
        }
        
        if (execError.killed && execError.signal === "SIGTERM") {
          throw new LatexCompilationError({
            type: "TIMEOUT",
            message: "LaTeX compilation timed out after 30 seconds."
          })
        }

        // Try to read the log file to get better error context
        let logContent = ""
        try {
          const logPath = path.join(tmpDir, "resume.log")
          logContent = await fs.readFile(logPath, "utf8")
        } catch (logErr) {
          // Log file might not exist if it failed early
        }

        // Extract basic error message from log if possible, otherwise use stderr/stdout
        let errorMessage = "LaTeX compilation failed."
        if (logContent) {
          const match = logContent.match(/!(.*?\n.*)/)
          if (match) {
            errorMessage = match[0].trim()
          }
        }

        throw new LatexCompilationError({
          type: "LATEX_ERROR",
          message: errorMessage,
          log: logContent || execError.stdout || execError.message
        })
      }
    }

    const pdfPath = path.join(tmpDir, "resume.pdf")
    const pdfBuffer = await fs.readFile(pdfPath)
    return pdfBuffer

  } finally {
    // Clean up temporary directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true })
    } catch (cleanupErr) {
      console.error("Failed to clean up latex temp dir:", cleanupErr)
    }
  }
}
