"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface DownloadReportButtonProps {
  candidateName: string
  targetId: string
}

export function DownloadReportButton({ candidateName, targetId }: DownloadReportButtonProps) {
  const [isDownloading, setIsDownloading] = React.useState(false)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      const element = document.getElementById(targetId)
      if (!element) throw new Error("Report container not found")

      // Temporarily modify styles for better PDF rendering
      const originalBg = element.style.backgroundColor
      element.style.backgroundColor = "#ffffff" // Ensure white background for PDF
      element.classList.add("pdf-mode") // if we needed specific print styles

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#111111" // Match dark mode if that's the default
      })

      // Restore styles
      element.style.backgroundColor = originalBg
      element.classList.remove("pdf-mode")

      const imgData = canvas.toDataURL('image/png')
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${candidateName.replace(/\s+/g, '_')}_Interview_Report.pdf`)
      
    } catch (error) {
      console.error("PDF generation failed", error)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button 
      onClick={handleDownload} 
      disabled={isDownloading}
      className="gap-2 bg-primary text-primary-foreground"
    >
      <Download className="w-4 h-4" /> 
      {isDownloading ? "Generating..." : "Download PDF"}
    </Button>
  )
}
