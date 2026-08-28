import { RemediationRecommendation } from "@/services/remediation-service"
import { RemediationPracticeButton } from "./remediation-practice-button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Lightbulb, AlertCircle } from "lucide-react"

export function RemediationList({ 
  userId, 
  recommendations 
}: { 
  userId: string;
  recommendations: RemediationRecommendation[] 
}) {
  if (recommendations.length === 0) return null;

  return (
    <Card className="bg-orange-500/5 border-orange-500/20 shadow-sm mt-8">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <CardTitle className="text-orange-700 dark:text-orange-400">Actionable Feedback</CardTitle>
        </div>
        <CardDescription className="text-orange-700/70 dark:text-orange-400/70">
          The following requirements were not verified during your recent human assessments. 
          Use focused practice to demonstrate these competencies before your next interview.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-background border border-border/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold text-sm">{rec.requirement}</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  {rec.reason} {rec.recommendation}
                </p>
              </div>
              <RemediationPracticeButton userId={userId} requirement={rec.requirement} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
