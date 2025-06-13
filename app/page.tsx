"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Star, GamepadIcon, TrendingUp, Users, Shield } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

const featuredGames = [
  {
    id: 1,
    title: "Elden Ring Nightreign",
    description: "An epic fantasy RPG set in a vast open world filled with mystery and monsters.",
    price: 400000,
    category: "RPG",
    image: "/Elden.png?height=200&width=300",
    rating: 4.8,
    tags: ["Fantasy", "Open World", "Soulslike"],
    featured: true,
  },
  {
    id: 2,
    title: "Cyberpunk 2077",
    description: "Futuristic open-world RPG in a dystopian city driven by technology and chaos.",
    price: 289000,
    category: "RPG",
    image: "/Cyberpunk.jpg?height=200&width=300",
    rating: 4.4,
    tags: ["Sci-Fi", "Open World", "Shooter"],
    featured: true,
  },
  {
    id: 3,
    title: "Call of Duty: Black Ops 7",
    description: "Intense first-person shooter with gripping campaign and multiplayer action.",
    price: 700000,
    category: "Shooter",
    image: "/CallOfDuty.jpg?height=200&width=300",
    rating: 4.6,
    tags: ["Shooter", "Multiplayer", "War"],
    featured: true,
  },
  {
    id: 4,
    title: "GTA V",
    description: "Crime-filled open world action-adventure set in the city of Los Santos.",
    price: 259000,
    category: "Action",
    image: "/GTAV.png?height=200&width=300",
    rating: 4.9,
    tags: ["Open World", "Crime", "Adventure"],
    featured: true,
  },
]

export default function HomePage() {
  const { addToCart } = useCart()
  const { user } = useAuth()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-black text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-black opacity-90"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
  <img
    src="/Logo.png"
    alt="Gamepad"
    className="h-16 w-16 object-contain"
  />
</div>

            </div>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              UAP MARKET
            </h1>
            <p className="text-xl mb-8 text-gray-300 leading-relaxed">
              Premium digital games marketplace with instant access and unbeatable prices
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <Link href="/auth">
                  <Button size="lg" className="bg-white text-black hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
                    Get Started
                  </Button>
                </Link>
              ) : (
                <Link href="/shop">
                  <Button size="lg" className="bg-white text-black hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
                    Browse Games
                  </Button>
                </Link>
              )}
              <Link href="/shop">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-black hover:bg-white hover:text-black px-8 py-3 text-lg font-semibold"
                >
                  Explore Shop
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-black rounded-full">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-black mb-2">1000+</h3>
              <p className="text-gray-600">Premium Games</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-black rounded-full">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-black mb-2">50K+</h3>
              <p className="text-gray-600">Happy Customers</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-black rounded-full">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-black mb-2">24/7</h3>
              <p className="text-gray-600">Support Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Games */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">Featured Games</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our handpicked selection of premium games with instant access
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredGames.map((game) => (
              <Card
                key={game.id}
                className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden"
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
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <CardTitle className="text-lg mb-2 text-black group-hover:text-gray-700 transition-colors">
                    {game.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 mb-4 line-clamp-2">{game.description}</CardDescription>
                  <div className="text-2xl font-bold text-black">{formatPrice(game.price)}</div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
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

          <div className="text-center mt-12">
            <Link href="/shop">
              <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-3">
                View All Games
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Gaming?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of gamers who trust Uap Market for their digital game purchases
          </p>
          {!user && (
            <Link href="/auth">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
                Create Account
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
