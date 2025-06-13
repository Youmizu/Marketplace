"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, ShoppingCart, Bell, CheckCircle, XCircle, Eye, Plus, Edit, Trash2, Gamepad2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { apiClient, type Game } from "@/lib/api"
import GameManagementModal from "@/components/game-management-modal"
import DeleteConfirmDialog from "@/components/delete-confirm-dialog"
// Add API status indicator and better error handling

// Add this after the existing imports
import { Wifi, WifiOff } from "lucide-react"

export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState([])
  const [notifications, setNotifications] = useState([])
  const [activeUsers, setActiveUsers] = useState<{ id: number; name: string; email: string; lastActive: string; status: string; }[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [stats, setStats] = useState({
    total_games: 0,
    featured_games: 0,
    categories: 0,
    average_rating: 0,
  })
  const [isGameModalOpen, setIsGameModalOpen] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [deletingGame, setDeletingGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  // Add this state variable after the existing useState declarations
  const [apiStatus, setApiStatus] = useState(true)

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push("/")
      return
    }
    loadData()
  }, [user, isAdmin, router])

  // Update the loadData function to check API status
  const loadData = async () => {
    try {
      setLoading(true)

      // Check API status
      setApiStatus(await apiClient.getApiStatus())

      // Load games and stats from API (with fallback)
      const [gamesData, statsData] = await Promise.all([apiClient.getGames(), apiClient.getStats()])

      setGames(gamesData)
      setStats(statsData)

      // Load orders from localStorage
      const allOrders = JSON.parse(localStorage.getItem("orders") || "[]")
      setOrders(allOrders)

      // Load notifications from localStorage
      const allNotifications = JSON.parse(localStorage.getItem("admin_notifications") || "[]")
      setNotifications(allNotifications)

      // Load active users (mock data)
      const mockActiveUsers = [
        { id: 2, name: "John Doe", email: "user@example.com", lastActive: new Date().toISOString(), status: "online" },
        {
          id: 3,
          name: "Jane Smith",
          email: "jane@example.com",
          lastActive: new Date(Date.now() - 3600000).toISOString(),
          status: "offline",
        },
        { id: 4, name: "Bob Wilson", email: "bob@example.com", lastActive: new Date().toISOString(), status: "online" },
      ]
      setActiveUsers(mockActiveUsers)
    } catch (error) {
      console.warn("Some data failed to load:", error)
      // Don't show error toast since we have fallbacks
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price)
  }

  const handleCreateGame = () => {
    setEditingGame(null)
    setIsGameModalOpen(true)
  }

  const handleEditGame = (game: Game) => {
    setEditingGame(game)
    setIsGameModalOpen(true)
  }

  const handleDeleteGame = (game: Game) => {
    setDeletingGame(game)
  }

  const confirmDeleteGame = async () => {
    if (!deletingGame) return

    try {
      await apiClient.deleteGame(deletingGame.id)
      await loadData() // Refresh data
      toast({
        title: "Game deleted",
        description: "Game has been successfully deleted",
      })
    } catch (error) {
      toast({
        title: "Error deleting game",
        description: "Failed to delete the game",
        variant: "destructive",
      })
    } finally {
      setDeletingGame(null)
    }
  }

  const handleGameSaved = async () => {
    setIsGameModalOpen(false)
    setEditingGame(null)
    await loadData() // Refresh data
  }

  const approveOrder = (orderId: number) => {
    const allOrders = JSON.parse(localStorage.getItem("orders") || "[]")
    const updatedOrders = allOrders.map((order: any) =>
      order.id === orderId ? { ...order, status: "completed", approvedAt: new Date().toISOString() } : order,
    )
    localStorage.setItem("orders", JSON.stringify(updatedOrders))

    // Send message to user with game details
    const order = allOrders.find((o: any) => o.id === orderId)
    if (order) {
      const messages = JSON.parse(localStorage.getItem("messages") || "[]")
      const gameDetails = order.items
        .map(
          (item: any) =>
            `${item.title}: Username: game_user_${orderId}, Password: ${Math.random().toString(36).substring(7)}`,
        )
        .join("\n")

      messages.push({
        id: Date.now(),
        senderId: 1, // Admin ID
        senderName: "Admin",
        receiverId: order.userId,
        content: `Your order #${orderId} has been approved! Here are your game access details:\n\n${gameDetails}\n\nEnjoy your games!`,
        orderId: orderId,
        createdAt: new Date().toISOString(),
        read: false,
      })
      localStorage.setItem("messages", JSON.stringify(messages))
    }

    setOrders(updatedOrders)
    toast({
      title: "Order approved",
      description: "Game details sent to customer",
    })
  }

  const rejectOrder = (orderId: number) => {
    const allOrders = JSON.parse(localStorage.getItem("orders") || "[]")
    const updatedOrders = allOrders.map((order: any) =>
      order.id === orderId ? { ...order, status: "rejected", rejectedAt: new Date().toISOString() } : order,
    )
    localStorage.setItem("orders", JSON.stringify(updatedOrders))

    // Send message to user
    const order = allOrders.find((o: any) => o.id === orderId)
    if (order) {
      const messages = JSON.parse(localStorage.getItem("messages") || "[]")
      messages.push({
        id: Date.now(),
        senderId: 1, // Admin ID
        senderName: "Admin",
        receiverId: order.userId,
        content: `Your order #${orderId} payment could not be verified. Please contact support or try again with a valid payment proof.`,
        orderId: orderId,
        createdAt: new Date().toISOString(),
        read: false,
      })
      localStorage.setItem("messages", JSON.stringify(messages))
    }

    setOrders(updatedOrders)
    toast({
      title: "Order rejected",
      description: "Customer has been notified",
    })
  }

  const markNotificationRead = (notificationId: number) => {
    const allNotifications = JSON.parse(localStorage.getItem("admin_notifications") || "[]")
    const updatedNotifications = allNotifications.map((notif: any) =>
      notif.id === notificationId ? { ...notif, read: true } : notif,
    )
    localStorage.setItem("admin_notifications", JSON.stringify(updatedNotifications))
    setNotifications(updatedNotifications)
  }

  const pendingOrders = orders.filter((order: any) => order.status === "pending_verification")
  const unreadNotifications = notifications.filter((notif: any) => !notif.read)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              <p>Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="flex items-center">
              <Bell className="h-4 w-4 mr-1" />
              {unreadNotifications.length} New
            </Badge>
          </div>
        </div>

        {/* API Status Indicator */}
        <div className="mb-6">
          <div
            className={`flex items-center gap-2 p-3 rounded-lg border ${
              apiStatus
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-yellow-50 border-yellow-200 text-yellow-800"
            }`}
          >
            {apiStatus ? (
              <>
                <Wifi className="h-4 w-4" />
                <span className="text-sm font-medium">API Connected - Live data</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">API Offline - Using local data</span>
                <span className="text-xs opacity-75 ml-2">Start FastAPI backend to enable live sync</span>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Games</p>
                  <p className="text-2xl font-bold">{stats.total_games}</p>
                </div>
                <Gamepad2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Featured Games</p>
                  <p className="text-2xl font-bold">{stats.featured_games}</p>
                </div>
                <Eye className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold">{pendingOrders.length}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold">{activeUsers.filter((u) => u.status === "online").length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="games" className="space-y-6">
          <TabsList>
            <TabsTrigger value="games">Game Management</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Active Users</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="games">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Game Management</CardTitle>
                  <Button onClick={handleCreateGame} className="bg-black hover:bg-gray-800 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Game
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {games.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No games available</p>
                  ) : (
                    games.map((game) => (
                      <div key={game.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <img
                              src={game.image || "/placeholder.svg"}
                              alt={game.title}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div>
                              <h3 className="font-semibold text-lg">{game.title}</h3>
                              <p className="text-sm text-gray-600 line-clamp-1">{game.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className="bg-black text-white text-xs">{game.category}</Badge>
                                {game.featured && <Badge className="bg-yellow-500 text-black text-xs">Featured</Badge>}
                                <span className="text-sm text-gray-500">Rating: {game.rating}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right mr-4">
                              <p className="font-semibold text-lg">{formatPrice(game.price)}</p>
                              <p className="text-xs text-gray-500">
                                Created: {new Date(game.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditGame(game)}
                              className="border-gray-300 hover:bg-gray-100"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteGame(game)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No orders yet</p>
                  ) : (
                    orders.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">Order #{order.id}</h3>
                            <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleString()}</p>
                            <p className="text-lg font-semibold">{formatPrice(order.total)}</p>
                          </div>
                          <Badge
                            variant={
                              order.status === "completed"
                                ? "default"
                                : order.status === "pending_verification"
                                  ? "secondary"
                                  : order.status === "rejected"
                                    ? "destructive"
                                    : "outline"
                            }
                          >
                            {order.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          {order.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>
                                {item.title} x{item.quantity}
                              </span>
                              <span>{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        {order.status === "pending_verification" && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => approveOrder(order.id)}
                              className="bg-black hover:bg-gray-800 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => rejectOrder(order.id)}>
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeUsers.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            user.status === "online" ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={user.status === "online" ? "default" : "secondary"}>{user.status}</Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Last active: {new Date(user.lastActive).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No notifications</p>
                  ) : (
                    notifications.map((notification: any) => (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg ${!notification.read ? "bg-blue-50 border-blue-200" : ""}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{notification.message}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              From: {notification.userName} | {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markNotificationRead(notification.id)}
                              className="border-gray-300 hover:bg-gray-100"
                            >
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Game Management Modal */}
      <GameManagementModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
        game={editingGame}
        onSave={handleGameSaved}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deletingGame}
        onClose={() => setDeletingGame(null)}
        onConfirm={confirmDeleteGame}
        title="Delete Game"
        description={`Are you sure you want to delete "${deletingGame?.title}"? This action cannot be undone.`}
      />
    </div>
  )
}
