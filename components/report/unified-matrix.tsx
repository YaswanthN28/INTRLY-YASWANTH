"use client"

import { UnifiedMatrixRow, ProvenAssessmentResult } from "@/services/unified-evidence-service"
import { Check, X, ShieldCheck, XCircle, HelpCircle, Clock, FileText, Building2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface UnifiedMatrixProps {
  matrix: UnifiedMatrixRow[];
}

export function UnifiedMatrix({ matrix }: UnifiedMatrixProps) {
  if (matrix.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/20 rounded-xl border border-border/50">
        <p className="text-muted-foreground text-sm">Preparation requirements are not available for this role yet.</p>
      </div>
    )
  }

  const renderProvenAssessment = (assessment: ProvenAssessmentResult, idx: number) => {
    let Icon = HelpCircle;
    let colorClass = "text-muted-foreground bg-muted/30 border-border/50";
    let label = "Not Assessed";

    if (assessment.status === 'VERIFIED') {
      Icon = ShieldCheck;
      colorClass = "text-amber-700 dark:text-amber-500 bg-amber-500/10 border-amber-500/30";
      label = "Verified";
    } else if (assessment.status === 'NOT_VERIFIED') {
      Icon = XCircle;
      colorClass = "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20";
      label = "Not Verified";
    }

    return (
      <div key={idx} className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-border/50 bg-background shadow-sm mt-2 first:mt-0">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${colorClass}`}>
            <Icon className="w-3 h-3" /> {label}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(assessment.submittedAt), { addSuffix: true })}
          </span>
        </div>
        
        {(assessment.organizationName || assessment.interviewerLabel) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <Building2 className="w-3 h-3 opacity-50" />
            <span className="font-medium">{assessment.organizationName || assessment.interviewerLabel}</span>
          </div>
        )}
        
        {assessment.comments && (
          <p className="text-xs text-muted-foreground italic mt-1 border-l-2 border-border pl-2">
            "{assessment.comments}"
          </p>
        )}
      </div>
    )
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border/50 shadow-sm bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold w-1/4">Requirement</th>
              <th className="px-6 py-4 font-semibold w-1/6">Claimed</th>
              <th className="px-6 py-4 font-semibold w-1/4">Practiced</th>
              <th className="px-6 py-4 font-semibold w-1/3">Proven (Human Verified)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {matrix.map((row, idx) => (
              <tr key={idx} className="hover:bg-muted/10 transition-colors">
                <td className="px-6 py-4 align-top font-medium text-foreground capitalize">
                  {row.concept}
                </td>
                
                {/* CLAIMED */}
                <td className="px-6 py-4 align-top">
                  {row.claimed ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-500/10 px-2.5 py-1 rounded-md border border-green-500/20">
                      <FileText className="w-3.5 h-3.5" /> Resume
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs text-muted-foreground/60">
                      —
                    </span>
                  )}
                </td>

                {/* PRACTICED */}
                <td className="px-6 py-4 align-top space-y-1">
                  {row.practiceInterviewCount > 0 ? (
                    <>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <Check className="w-3.5 h-3.5 text-blue-500" />
                        {row.practiceInterviewCount} {row.practiceInterviewCount === 1 ? 'session' : 'sessions'}
                      </div>
                      {row.lastPracticedAt && (
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(row.lastPracticedAt), { addSuffix: true })}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="inline-flex items-center text-xs text-muted-foreground/60">
                      Not demonstrated
                    </span>
                  )}
                </td>

                {/* PROVEN */}
                <td className="px-6 py-4 align-top bg-amber-50/10 dark:bg-amber-900/5">
                  {row.provenAssessments.length > 0 ? (
                    <div className="space-y-2">
                      {row.provenAssessments.map(renderProvenAssessment)}
                    </div>
                  ) : (
                    <span className="inline-flex items-center text-xs text-muted-foreground/60 italic">
                      No assessments
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards */}
      <div className="md:hidden space-y-4">
        {matrix.map((row, idx) => (
          <div key={idx} className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm">
            <div className="bg-muted/30 px-4 py-3 border-b border-border/50">
              <h4 className="font-semibold text-foreground capitalize">{row.concept}</h4>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Claimed */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Claimed</span>
                {row.claimed ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                    <FileText className="w-3.5 h-3.5" /> Found in Resume
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>

              {/* Practiced */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Practiced</span>
                {row.practiceInterviewCount > 0 ? (
                  <div className="space-y-0.5">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      <Check className="w-3.5 h-3.5" /> {row.practiceInterviewCount} {row.practiceInterviewCount === 1 ? 'session' : 'sessions'}
                    </span>
                    {row.lastPracticedAt && (
                      <p className="text-[10px] text-muted-foreground ml-4.5">
                        {formatDistanceToNow(new Date(row.lastPracticedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>

              {/* Proven */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Proven</span>
                {row.provenAssessments.length > 0 ? (
                  <div className="space-y-2">
                    {row.provenAssessments.map(renderProvenAssessment)}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No assessments yet</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
