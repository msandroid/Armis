import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { SequentialThinkingPlan, SequentialThinkingStep } from '@/types/llm'
import { 
  Brain, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Wrench,
  Lightbulb
} from 'lucide-react'

interface SequentialThinkingPanelProps {
  plan: SequentialThinkingPlan | null
  onCancel?: () => void
  className?: string
}

const getStepIcon = (type: SequentialThinkingStep['type']) => {
  switch (type) {
    case 'thinking':
      return <Brain className="w-4 h-4" />
    case 'tool_call':
      return <Wrench className="w-4 h-4" />
    case 'result':
      return <CheckCircle className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

const getStepColor = (type: SequentialThinkingStep['type']) => {
  switch (type) {
    case 'thinking':
      return 'text-blue-500'
    case 'tool_call':
      return 'text-green-500'
    case 'result':
      return 'text-purple-500'
    default:
      return 'text-gray-500'
  }
}

const getStatusIcon = (status: SequentialThinkingPlan['status']) => {
  switch (status) {
    case 'planning':
      return <Clock className="w-4 h-4 text-yellow-500" />
    case 'executing':
      return <Play className="w-4 h-4 text-blue-500" />
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

const getStatusText = (status: SequentialThinkingPlan['status']) => {
  switch (status) {
    case 'planning':
      return 'Planning'
    case 'executing':
      return 'Executing'
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    default:
      return 'Unknown'
  }
}

export const SequentialThinkingPanel: React.FC<SequentialThinkingPanelProps> = ({
  plan,
  onCancel,
  className
}) => {
  if (!plan) {
    return null
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Sequential Thinking</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(plan.status)}
            <span className="text-sm font-medium">
              {getStatusText(plan.status)}
            </span>
            {plan.status === 'executing' && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="h-7 px-2 text-xs"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {plan.steps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg"
              >
                <div className={cn("mt-1", getStepColor(step.type))}>
                  {getStepIcon(step.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Step {index + 1}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {step.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    {step.type === 'thinking' && (
                      <div className="italic text-muted-foreground">
                        {step.content}
                      </div>
                    )}
                    
                    {step.type === 'tool_call' && step.toolCall && (
                      <div>
                        <div className="font-medium text-foreground">
                          {step.toolCall.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(step.toolCall.arguments, null, 2)}
                        </div>
                      </div>
                    )}
                    
                    {step.type === 'result' && step.result && (
                      <div>
                        <div className="font-medium text-foreground">
                          Result
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(step.result, null, 2)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {plan.steps.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Starting thinking process...</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
