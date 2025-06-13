"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, Star, Search, Grid, List, Loader2 } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { apiClient, type Game } from "@/lib/api"

export default function ShopPage() {
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const [games, setGames] = useState<Game[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortBy, setSortBy] = useState("featured")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    loadGames()
    loadCategories()
  }, [])

  useEffect(() => {
    loadGames()
  }, [searchTerm, selectedCategory])

  // Update the loadGames function to not show error toast for API failures
  const loadGames = async () => {
    try {
      setLoading(true)
      const params: any = {}

      if (selectedCategory !== "All") {
        params.category = selectedCategory
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      const gamesData = await apiClient.getGames(params)
      setGames(gamesData)
    } catch (error) {
      console.warn("Failed to load games:", error)
      // Don't show error toast since we have fallback data
    } finally {
      setLoading(false)
    }
  }

  // Update the loadCategories function similarly
  const loadCategories = async () => {
    try {
      const categoriesData = await apiClient.getCategories()
      setCategories(["All", ...categoriesData])
    } catch (error) {
      console.warn("Failed to load categories:", error)
      // Fallback categories
      setCategories(["All", "RPG", "Racing", "Adventure", "Action", "Horror", "Strategy", "Sports", "Puzzle"])
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price)
  }

  const sortedGames = [...games].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "rating":
        return b.rating - a.rating
      case "name":
        return a.title.localeCompare(b.title)
      default:
        return b.featured ? 1 : -1
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Game Shop</h1>
            <p className="text-xl text-gray-300">Discover amazing games at unbeatable prices</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search games..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-black focus:ring-black"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:border-black focus:ring-black">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:border-black focus:ring-black">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-black hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-black hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading games...</span>
          </div>
        )}

        {/* Results Count */}
        {!loading && (
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {sortedGames.length} games
              {selectedCategory !== "All" && ` in ${selectedCategory}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
        )}

        {/* Games Grid/List */}
        {!loading && (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedGames.map((game) => (
                  <Card
                    key={game.id}
                    className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden bg-white"
                  >
                    <CardHeader className="p-0 relative">
                      <div className="relative overflow-hidden">
                        <img
                          src={game.image || "/placeholder.svg"}
                          alt={game.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-black text-white border-0">{game.category}</Badge>
                        </div>
                        <div className="absolute top-4 right-4 flex items-center bg-black/80 text-white px-2 py-1 rounded-full text-sm">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                          {game.rating}
                        </div>
                        {game.featured && (
                          <div className="absolute bottom-4 left-4">
                            <Badge className="bg-yellow-500 text-black border-0">Featured</Badge>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="text-lg mb-2 text-black group-hover:text-gray-700 transition-colors line-clamp-1">
                        {game.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 mb-3 line-clamp-2 text-sm">
                        {game.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {game.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs border-gray-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xl font-bold text-black">{formatPrice(game.price)}</div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button
                        className="w-full bg-black hover:bg-gray-800 text-white border-0"
                        onClick={() => addToCart(game)}
                        disabled={!user}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {user ? "Add to Cart" : "Login to Purchase"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedGames.map((game) => (
                  <Card key={game.id} className="hover:shadow-lg transition-shadow bg-white">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="relative w-full md:w-48 h-32 md:h-36 overflow-hidden rounded-lg">
                          <img
                            src={game.image || "/placeholder.svg"}
                            alt={game.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-black text-white border-0 text-xs">{game.category}</Badge>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-bold text-black">{game.title}</h3>
                                {game.featured && (
                                  <Badge className="bg-yellow-500 text-black border-0 text-xs">Featured</Badge>
                                )}
                              </div>
                              <p className="text-gray-600 mb-3 line-clamp-2">{game.description}</p>
                              <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                                  <span className="text-sm font-medium">{game.rating}</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {game.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs border-gray-300">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-black mb-4">{formatPrice(game.price)}</div>
                              <Button
                                className="bg-black hover:bg-gray-800 text-white w-full md:w-auto"
                                onClick={() => addToCart(game)}
                                disabled={!user}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                {user ? "Add to Cart" : "Login to Purchase"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {sortedGames.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No games found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
