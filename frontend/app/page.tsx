"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, CheckCircle2, Filter, X } from "lucide-react"

interface Step {
  name: string
  inputs: any
  outputs: any
  reasoning?: string
  metadata?: any
  timestamp: string
  duration_ms?: number
}

interface Execution {
  execution_id: string
  name: string
  steps: Step[]
  started_at: string
  ended_at?: string
  metadata?: any
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function Home() {
  const [executions, setExecutions] = useState<Execution[]>([])
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")

  useEffect(() => {
    fetchExecutions()
  }, [])

  const fetchExecutions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/executions`)
      const data = await response.json()
      setExecutions(data)
      if (data.length > 0 && !selectedExecution) {
        setSelectedExecution(data[0])
      }
      setFilterType("all")
    } catch (error) {
      console.error("Failed to fetch executions:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A"
    return `${ms.toFixed(0)}ms`
  }

  const renderValue = (value: any, depth = 0): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">null</span>
    }

    if (typeof value === "string") {
      return <span className="text-green-700 dark:text-green-400">"{value}"</span>
    }

    if (typeof value === "number") {
      return <span className="text-blue-700 dark:text-blue-400">{value}</span>
    }

    if (typeof value === "boolean") {
      return <span className="text-purple-700 dark:text-purple-400">{value.toString()}</span>
    }

    if (Array.isArray(value)) {
      if (depth > 4) return <span className="text-muted-foreground">[...array]</span>
      return (
        <div className="ml-4 border-l-2 border-muted pl-2">
          {value.map((item, idx) => (
            <div key={idx} className="my-1">
              [{idx}]: {renderValue(item, depth + 1)}
            </div>
          ))}
        </div>
      )
    }

    if (typeof value === "object") {
      if (depth > 4) return <span className="text-muted-foreground">{`{...object}`}</span>
      return (
        <div className="ml-4 border-l-2 border-muted pl-2">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="my-1">
              <span className="font-semibold">{key}:</span> {renderValue(val, depth + 1)}
            </div>
          ))}
        </div>
      )
    }

    return <span>{String(value)}</span>
  }

  const getFilteredCandidates = (step: Step, filterType: string) => {
    if (step.name !== "apply_filters" || filterType === "all" || !step.metadata?.evaluations) {
      return null
    }

    const evaluations = step.metadata.evaluations as any[]
    return evaluations.filter((eval_item: any) => {
      if (filterType === "all") return true
      if (!eval_item.filter_results || !eval_item.filter_results[filterType]) return false
      return !eval_item.filter_results[filterType].passed
    })
  }

  const getAvailableFilters = (step: Step): string[] => {
    if (step.name !== "apply_filters" || !step.metadata?.failed_by_filter) {
      return []
    }
    const failedByFilter = step.metadata.failed_by_filter as Record<string, number>
    return Object.keys(failedByFilter).filter(key => failedByFilter[key] > 0)
  }

  const getAllFilterTypes = (step: Step): string[] => {
    if (step.name !== "apply_filters" || !step.metadata?.filters_applied) {
      return []
    }
    return Object.keys(step.metadata.filters_applied || {})
  }

  const getFilterDisplayName = (filterType: string): string => {
    const names: Record<string, string> = {
      "price_range": "Price Range",
      "min_rating": "Min Rating",
      "min_reviews": "Min Reviews"
    }
    return names[filterType] || filterType.replace(/_/g, " ")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold mb-2">X-Ray Dashboard</h1>
              <p className="text-muted-foreground">
                Debug multi-step algorithmic systems with complete decision transparency
              </p>
            </div>
            <Link href="/demo">
              <Button>Run Demo</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Executions</CardTitle>
                <CardDescription>
                  {executions.length} execution{executions.length !== 1 ? "s" : ""} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {executions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No executions yet. Run the demo to create your first execution!
                    </p>
                    <Link href="/demo">
                      <Button>Run Demo</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {executions.map((exec) => (
                    <button
                      key={exec.execution_id}
                      onClick={() => {
                        setSelectedExecution(exec)
                        setFilterType("all")
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedExecution?.execution_id === exec.execution_id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      <div className="font-semibold">{exec.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatTimestamp(exec.started_at)}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {exec.steps.length} step{exec.steps.length !== 1 ? "s" : ""}
                        </Badge>
                        {exec.ended_at && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </div>
                    </button>
                    ))}
                  </div>
                )}
                {executions.length > 0 && (
                  <div className="space-y-2 mt-4">
                  <Button
                    onClick={fetchExecutions}
                    variant="outline"
                    className="w-full"
                  >
                    Refresh
                  </Button>
                  </div>
                )}
                <Link href="/demo" className="block mt-4">
                  <Button variant="default" className="w-full">
                    Run Demo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedExecution ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedExecution.name}</CardTitle>
                      <CardDescription>
                        Execution ID: {selectedExecution.execution_id}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Started: {formatTimestamp(selectedExecution.started_at)}
                    </div>
                    {selectedExecution.ended_at && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Ended: {formatTimestamp(selectedExecution.ended_at)}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {selectedExecution.steps.map((step, idx) => {
                      const allFilterTypes = getAllFilterTypes(step)
                      const availableFilters = getAvailableFilters(step)
                      const filteredCandidates = getFilteredCandidates(step, filterType)
                      const showFilter = step.name === "apply_filters" && allFilterTypes.length > 0
                      const isFilterActive = filterType !== "all" && filteredCandidates !== null

                      return (
                        <AccordionItem key={idx} value={`step-${idx}`}>
                          <AccordionTrigger className="hover:no-underline [&>svg]:hidden">
                            <div className="flex items-center justify-between gap-3 flex-1 w-full pr-2">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold">{step.name}</span>
                                {step.duration_ms && (
                                  <Badge variant="outline" className="text-xs">
                                    {formatDuration(step.duration_ms)}
                                  </Badge>
                                )}
                                {isFilterActive && (
                                  <Badge variant="secondary" className="text-xs">
                                    Filtered: {getFilterDisplayName(filterType)}
                                  </Badge>
                                )}
                              </div>
                              {showFilter && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-2 z-10"
                                >
                                  {isFilterActive && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setFilterType("all")
                                      }}
                                      className="h-7 px-2 text-xs"
                                    >
                                      <X className="w-3 h-3 mr-1" />
                                      Clear
                                    </Button>
                                  )}
                                  <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger 
                                      className="w-[200px] h-8 text-xs"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Filter className="w-3 h-3 mr-2" />
                                      <SelectValue placeholder="Filter by..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">
                                        <div className="flex items-center justify-between w-full">
                                          <span>All Candidates</span>
                                          {step.metadata?.evaluations && (
                                            <Badge variant="secondary" className="ml-2 text-xs">
                                              {(step.metadata.evaluations as any[]).length}
                                            </Badge>
                                          )}
                                        </div>
                                      </SelectItem>
                                      {allFilterTypes.map((filter) => {
                                        const count = step.metadata?.failed_by_filter?.[filter] || 0
                                        const total = step.metadata?.evaluations ? (step.metadata.evaluations as any[]).length : 0
                                        const passed = total - count
                                        return (
                                          <SelectItem key={filter} value={filter}>
                                            <div className="flex items-center justify-between w-full">
                                              <span>{getFilterDisplayName(filter)}</span>
                                              <div className="flex items-center gap-2 ml-2">
                                                {count > 0 && (
                                                  <Badge variant="destructive" className="text-xs">
                                                    {count} failed
                                                  </Badge>
                                                )}
                                                {passed > 0 && (
                                                  <Badge variant="secondary" className="text-xs">
                                                    {passed} passed
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          </SelectItem>
                                        )
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-2">
                              {showFilter && isFilterActive && filteredCandidates && filteredCandidates.length > 0 && (
                                <div className="border rounded-lg p-4 bg-card">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Filter className="w-4 h-4 text-primary" />
                                      <p className="text-sm font-semibold">
                                        {filteredCandidates.length} candidate(s) failed {getFilterDisplayName(filterType)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    {filteredCandidates.map((candidate: any, cIdx: number) => (
                                      <div key={cIdx} className="p-4 bg-background rounded-lg border border-destructive/20 hover:border-destructive/40 transition-colors">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="font-semibold text-base">{candidate.title}</div>
                                            <div className="text-xs text-muted-foreground mt-1">ASIN: {candidate.asin}</div>
                                            {candidate.metrics && (
                                              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                                                <div>
                                                  <span className="text-muted-foreground">Price:</span>
                                                  <span className="ml-1 font-medium">${candidate.metrics.price?.toFixed(2)}</span>
                                                </div>
                                                <div>
                                                  <span className="text-muted-foreground">Rating:</span>
                                                  <span className="ml-1 font-medium">{candidate.metrics.rating}★</span>
                                                </div>
                                                <div>
                                                  <span className="text-muted-foreground">Reviews:</span>
                                                  <span className="ml-1 font-medium">{candidate.metrics.reviews?.toLocaleString()}</span>
                                                </div>
                                              </div>
                                            )}
                                            {candidate.filter_results?.[filterType] && (
                                              <div className="mt-3 p-2 bg-destructive/10 rounded border-l-2 border-destructive">
                                                <div className="text-sm font-medium text-destructive">
                                                  {candidate.filter_results[filterType].detail}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {showFilter && isFilterActive && filteredCandidates && filteredCandidates.length === 0 && (
                                <div className="border rounded-lg p-4 bg-card">
                                  <div className="text-sm text-center text-muted-foreground">
                                    No candidates failed {getFilterDisplayName(filterType)}.
                                  </div>
                                </div>
                              )}

                              {step.reasoning && (
                                <div>
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    Reasoning
                                  </h4>
                                  <p className="text-sm bg-muted p-3 rounded-md">
                                    {step.reasoning}
                                  </p>
                                </div>
                              )}

                              <div>
                                <h4 className="font-semibold mb-2">Inputs</h4>
                                <div className="bg-muted p-3 rounded-md text-sm font-mono overflow-x-auto">
                                  {renderValue(step.inputs)}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold mb-2">Outputs</h4>
                                <div className="bg-muted p-3 rounded-md text-sm font-mono overflow-x-auto">
                                  {renderValue(step.outputs)}
                                </div>
                              </div>

                              {step.metadata && Object.keys(step.metadata).length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2">Metadata</h4>
                                  <div className="bg-muted p-3 rounded-md text-sm font-mono overflow-x-auto">
                                    {renderValue(step.metadata)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No execution selected. Select an execution from the list to view details.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

