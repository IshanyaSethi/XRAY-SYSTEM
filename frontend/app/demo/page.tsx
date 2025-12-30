"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react"
import Link from "next/link"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface CompetitorResult {
  title: string
  asin: string
  price: number
  rating: number
  reviews: number
  score: number
}

export default function DemoPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    reference_product: any
    selected_competitor?: CompetitorResult
    message?: string
  } | null>(null)

  const sampleProducts = [
    {
      name: "Water Bottle (Default)",
      title: "Stainless Steel Water Bottle 32oz Insulated",
      price: "29.99",
      rating: "4.2",
      reviews: "1247",
      category: "Sports & Outdoors"
    },
    {
      name: "Premium Water Bottle",
      title: "Titanium Insulated Water Bottle 40oz",
      price: "89.99",
      rating: "4.7",
      reviews: "5234",
      category: "Sports & Outdoors"
    },
    {
      name: "Budget Water Bottle",
      title: "Plastic Reusable Water Bottle 24oz",
      price: "9.99",
      rating: "3.9",
      reviews: "856",
      category: "Sports & Outdoors"
    },
    {
      name: "Wireless Earbuds",
      title: "Bluetooth 5.0 True Wireless Earbuds with Noise Cancelling",
      price: "79.99",
      rating: "4.3",
      reviews: "12345",
      category: "Electronics"
    },
    {
      name: "Premium Headphones",
      title: "Over-Ear Wireless Headphones with Active Noise Cancellation",
      price: "249.99",
      rating: "4.6",
      reviews: "8932",
      category: "Electronics"
    },
    {
      name: "Laptop Stand",
      title: "Adjustable Aluminum Laptop Stand for Desk",
      price: "34.99",
      rating: "4.4",
      reviews: "5678",
      category: "Computer Accessories"
    },
    {
      name: "Mechanical Keyboard",
      title: "RGB Mechanical Gaming Keyboard with Blue Switches",
      price: "129.99",
      rating: "4.5",
      reviews: "12456",
      category: "Computer Accessories"
    },
    {
      name: "Yoga Mat",
      title: "Extra Thick TPE Yoga Mat Non-Slip Exercise Mat",
      price: "24.99",
      rating: "4.3",
      reviews: "9876",
      category: "Sports & Outdoors"
    },
    {
      name: "Smart Watch",
      title: "Fitness Smartwatch with Heart Rate Monitor",
      price: "199.99",
      rating: "4.4",
      reviews: "15234",
      category: "Electronics"
    },
    {
      name: "Desk Lamp",
      title: "LED Desk Lamp with USB Charging Port",
      price: "39.99",
      rating: "4.2",
      reviews: "6543",
      category: "Home & Office"
    }
  ]

  const [formData, setFormData] = useState({
    title: sampleProducts[0].title,
    price: sampleProducts[0].price,
    rating: sampleProducts[0].rating,
    reviews: sampleProducts[0].reviews,
    category: sampleProducts[0].category
  })

  const loadSampleProduct = (product: typeof sampleProducts[0]) => {
    setFormData({
      title: product.title,
      price: product.price,
      rating: product.rating,
      reviews: product.reviews,
      category: product.category
    })
    setResult(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`${API_URL}/api/demo/run-competitor-selection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          price: parseFloat(formData.price),
          rating: parseFloat(formData.rating),
          reviews: parseInt(formData.reviews),
          category: formData.category
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        reference_product: formData,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-primary" />
                Competitor Selection Demo
              </h1>
              <p className="text-muted-foreground">
                Run the multi-step competitor selection workflow and see the X-Ray trace
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">
                View All Executions
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>
                Enter details of the product to find competitors for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">
                  Try Sample Products:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-muted/30">
                  {sampleProducts.map((product, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant={formData.title === product.title ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-auto py-2 px-3 justify-start"
                      onClick={() => loadSampleProduct(product)}
                    >
                      {product.name}
                    </Button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="text-sm font-medium">
                    Product Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="text-sm font-medium">
                      Price ($)
                    </label>
                    <input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="rating" className="text-sm font-medium">
                      Rating (★)
                    </label>
                    <input
                      id="rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reviews" className="text-sm font-medium">
                      Review Count
                    </label>
                    <input
                      id="reviews"
                      type="number"
                      value={formData.reviews}
                      onChange={(e) => setFormData({ ...formData, reviews: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="text-sm font-medium">
                      Category
                    </label>
                    <input
                      id="category"
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Finding Competitor...
                    </>
                  ) : (
                    "Find Best Competitor"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {loading ? "Processing workflow..." : "Competitor selection results"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">
                    Running competitor selection workflow...
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This may take a few seconds
                  </p>
                </div>
              )}

              {!loading && !result && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Sparkles className="w-12 h-12 mb-4 opacity-50" />
                  <p>Enter product information and click "Find Best Competitor" to get started</p>
                </div>
              )}

              {!loading && result && (
                <div className="space-y-6">
                  {result.success ? (
                    <>
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-semibold">Competitor Found!</span>
                      </div>

                      {result.selected_competitor && (
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold mb-2">Selected Competitor</h3>
                            <div className="bg-muted p-4 rounded-lg space-y-2">
                              <div className="font-medium text-lg">
                                {result.selected_competitor.title}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Price:</span>{" "}
                                  <span className="font-medium">
                                    ${result.selected_competitor.price.toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Rating:</span>{" "}
                                  <span className="font-medium">
                                    {result.selected_competitor.rating}★
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Reviews:</span>{" "}
                                  <span className="font-medium">
                                    {result.selected_competitor.reviews.toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Score:</span>{" "}
                                  <Badge variant="secondary">
                                    {result.selected_competitor.score.toFixed(2)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t">
                        <Link href="/">
                          <Button variant="outline" className="w-full">
                            View Full Execution Trace
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          The execution has been saved. View it in the main dashboard to see all steps.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-semibold">
                        {result.message || "No competitor found"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              The competitor selection workflow includes 5 steps, all tracked with X-Ray
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { num: 1, name: "Keyword Generation", desc: "Extract search keywords from product title" },
                { num: 2, name: "Candidate Search", desc: "Search for potential competitor products" },
                { num: 3, name: "Apply Filters", desc: "Filter by price, rating, and review count" },
                { num: 4, name: "Relevance Check", desc: "Use LLM to remove false positives" },
                { num: 5, name: "Rank & Select", desc: "Score and select the best competitor" }
              ].map((step) => (
                <div key={step.num} className="text-center p-4 bg-muted rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 font-semibold">
                    {step.num}
                  </div>
                  <div className="font-semibold text-sm mb-1">{step.name}</div>
                  <div className="text-xs text-muted-foreground">{step.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>💡 Tip:</strong> After running the workflow, click "View Full Execution Trace" 
                to see the complete X-Ray trace with inputs, outputs, and reasoning for each step!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

