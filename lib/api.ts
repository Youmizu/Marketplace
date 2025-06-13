const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface Game {
  id: number
  title: string
  description: string
  price: number
  category: string
  image: string
  rating: number
  tags: string[]
  featured: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  email: string
  name: string
  role: string
  is_active: boolean
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export interface GameCreate {
  title: string
  description: string
  price: number
  category: string
  image?: string
  rating?: number
  tags?: string[]
  featured?: boolean
}

export interface GameUpdate extends Partial<GameCreate> {}

// Mock data fallback
const mockGames: Game[] = [
  {
    id: 1,
    title: "Epic Adventure RPG",
    description: "Immersive fantasy role-playing game with stunning graphics and epic storylines",
    price: 299000,
    category: "RPG",
    image: "/RPG.jpg?height=200&width=300",
    rating: 4.8,
    tags: ["Fantasy", "Adventure", "Multiplayer"],
    featured: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    title: "Speed Racing Championship",
    description: "High-octane racing game with realistic physics and stunning visuals",
    price: 199000,
    category: "Racing",
    image: "/placeholder.svg?height=200&width=300",
    rating: 4.6,
    tags: ["Racing", "Sports", "Simulation"],
    featured: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

class ApiClient {
  private isApiAvailable = true
  private localGames: Game[] = []
  private authToken: string | null = null
  private currentUser: User | null = null

  constructor() {
    // Load games from localStorage on initialization
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("games_data")
      this.localGames = stored ? JSON.parse(stored) : [...mockGames]

      // Load auth token and user data
      this.authToken = localStorage.getItem("auth_token")
      const userData = localStorage.getItem("user_data")
      this.currentUser = userData ? JSON.parse(userData) : null
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`
    }

    return headers
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    // Add debugging
    console.log(`API Request: ${options.method || 'GET'} ${url}`)
    console.log('Auth headers:', this.getAuthHeaders())

    const config: RequestInit = {
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      console.log(`API Response: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        if (response.status === 401) {
          console.warn("Token expired or invalid, logging out")
          this.logout()
          throw new Error("Authentication required")
        }
        if (response.status === 403) {
          console.error("Forbidden: User doesn't have permission")
          // Check if user is actually admin
          if (this.currentUser?.role !== 'admin') {
            throw new Error("Admin access required")
          }
          throw new Error("Access forbidden")
        }
        
        // Try to get error details from response
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorBody = await response.text()
          if (errorBody) {
            const errorData = JSON.parse(errorBody)
            errorMessage = errorData.detail || errorMessage
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
        
        throw new Error(errorMessage)
      }

      this.isApiAvailable = true
      return await response.json()
    } catch (error) {
      console.warn("API request failed:", error)
      this.isApiAvailable = false
      throw error
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.request<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      // Store token and user data
      this.authToken = response.access_token
      this.currentUser = response.user
      
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", response.access_token)
        localStorage.setItem("user_data", JSON.stringify(response.user))
      }

      console.log("Login successful:", response.user)
      return response
    } catch (error) {
      console.warn("API login failed, trying fallback authentication")
      
      // Fallback to mock authentication for demo
      const mockUsers = [
        { id: 1, email: "admin@uapmarket.com", name: "Admin User", role: "admin", password: "admin123" },
        { id: 2, email: "user@example.com", name: "John Doe", role: "user", password: "password" },
      ]

      const user = mockUsers.find((u) => u.email === email)
      if (user && user.password === password) {
        const mockResponse: AuthResponse = {
          access_token: "mock_token_" + Date.now(),
          token_type: "bearer",
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            is_active: true,
            created_at: new Date().toISOString(),
          },
        }

        this.authToken = mockResponse.access_token
        this.currentUser = mockResponse.user
        
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_token", mockResponse.access_token)
          localStorage.setItem("user_data", JSON.stringify(mockResponse.user))
        }

        console.log("Fallback login successful:", mockResponse.user)
        return mockResponse
      }

      throw new Error("Invalid credentials")
    }
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      const response = await this.request<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      })

      // Store token and user data
      this.authToken = response.access_token
      this.currentUser = response.user
      
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", response.access_token)
        localStorage.setItem("user_data", JSON.stringify(response.user))
      }

      return response
    } catch (error) {
      // Fallback to mock registration for demo
      const mockResponse: AuthResponse = {
        access_token: "mock_token_" + Date.now(),
        token_type: "bearer",
        user: {
          id: Date.now(),
          email,
          name,
          role: "user",
          is_active: true,
          created_at: new Date().toISOString(),
        },
      }

      this.authToken = mockResponse.access_token
      this.currentUser = mockResponse.user
      
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", mockResponse.access_token)
        localStorage.setItem("user_data", JSON.stringify(mockResponse.user))
      }

      return mockResponse
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const user = await this.request<User>("/api/auth/me")
      this.currentUser = user
      return user
    } catch (error) {
      // Fallback to stored user data
      if (this.currentUser) {
        return this.currentUser
      }
      
      if (typeof window !== "undefined") {
        const userData = localStorage.getItem("user_data")
        if (userData) {
          const user = JSON.parse(userData)
          this.currentUser = user
          return user
        }
      }
      throw error
    }
  }

  logout(): void {
    this.authToken = null
    this.currentUser = null
    
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_data")
    }
  }

  // Check if user is admin
  isUserAdmin(): boolean {
    return this.currentUser?.role === 'admin'
  }

  // Existing game methods with better error handling
  private saveLocalGames() {
    if (typeof window !== "undefined") {
      localStorage.setItem("games_data", JSON.stringify(this.localGames))
    }
  }

  private getNextId(): number {
    return Math.max(...this.localGames.map((g) => g.id), 0) + 1
  }

  private filterGames(
    games: Game[],
    params?: {
      category?: string
      search?: string
      featured?: boolean
    },
  ): Game[] {
    let filtered = [...games]

    if (params?.category && params.category !== "All") {
      filtered = filtered.filter((game) => game.category === params.category)
    }

    if (params?.search) {
      const searchLower = params.search.toLowerCase()
      filtered = filtered.filter(
        (game) =>
          game.title.toLowerCase().includes(searchLower) ||
          game.description.toLowerCase().includes(searchLower) ||
          game.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
      )
    }

    if (params?.featured !== undefined) {
      filtered = filtered.filter((game) => game.featured === params.featured)
    }

    return filtered
  }

  // Games endpoints with fallback
  async getGames(params?: {
    category?: string
    search?: string
    featured?: boolean
  }): Promise<Game[]> {
    try {
      return await this.request<Game[]>(`/api/games${this.buildQueryString(params)}`)
    } catch (error) {
      console.warn("Using local games data due to API error:", error)
      return this.filterGames(this.localGames, params)
    }
  }

  async getGame(id: number): Promise<Game> {
    try {
      return await this.request<Game>(`/api/games/${id}`)
    } catch (error) {
      // Fallback to local data
      const game = this.localGames.find((g) => g.id === id)
      if (!game) {
        throw new Error("Game not found")
      }
      return game
    }
  }

  async createGame(game: GameCreate): Promise<Game> {
    // Check admin permissions first
    if (!this.isUserAdmin()) {
      throw new Error("Admin access required")
    }

    try {
      const newGame = await this.request<Game>("/api/games", {
        method: "POST",
        body: JSON.stringify(game),
      })
      
      // Also update local storage for consistency
      this.localGames.push(newGame)
      this.saveLocalGames()
      
      return newGame
    } catch (error) {
      console.warn("API create failed, using local storage:", error)
      
      // Fallback to local storage
      const newGame: Game = {
        id: this.getNextId(),
        ...game,
        image: game.image || "/placeholder.svg?height=200&width=300",
        rating: game.rating || 4.0,
        tags: game.tags || [],
        featured: game.featured || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      this.localGames.push(newGame)
      this.saveLocalGames()
      return newGame
    }
  }

  async updateGame(id: number, game: GameUpdate): Promise<Game> {
    // Check admin permissions first
    if (!this.isUserAdmin()) {
      throw new Error("Admin access required")
    }

    try {
      const updatedGame = await this.request<Game>(`/api/games/${id}`, {
        method: "PUT",
        body: JSON.stringify(game),
      })
      
      // Also update local storage for consistency
      const gameIndex = this.localGames.findIndex((g) => g.id === id)
      if (gameIndex !== -1) {
        this.localGames[gameIndex] = updatedGame
        this.saveLocalGames()
      }
      
      return updatedGame
    } catch (error) {
      console.warn("API update failed, using local storage:", error)
      
      // Fallback to local storage
      const gameIndex = this.localGames.findIndex((g) => g.id === id)
      if (gameIndex === -1) {
        throw new Error("Game not found")
      }

      const updatedGame = {
        ...this.localGames[gameIndex],
        ...game,
        updated_at: new Date().toISOString(),
      }
      this.localGames[gameIndex] = updatedGame
      this.saveLocalGames()
      return updatedGame
    }
  }

  async deleteGame(id: number): Promise<{ message: string }> {
    // Check admin permissions first
    if (!this.isUserAdmin()) {
      throw new Error("Admin access required")
    }

    try {
      const result = await this.request<{ message: string }>(`/api/games/${id}`, {
        method: "DELETE",
      })
      
      // Also update local storage for consistency
      const gameIndex = this.localGames.findIndex((g) => g.id === id)
      if (gameIndex !== -1) {
        this.localGames.splice(gameIndex, 1)
        this.saveLocalGames()
      }
      
      return result
    } catch (error) {
      console.warn("API delete failed, using local storage:", error)
      
      // Fallback to local storage
      const gameIndex = this.localGames.findIndex((g) => g.id === id)
      if (gameIndex === -1) {
        throw new Error("Game not found")
      }

      this.localGames.splice(gameIndex, 1)
      this.saveLocalGames()
      return { message: "Game deleted successfully" }
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      return await this.request<string[]>("/api/categories")
    } catch (error) {
      // Fallback to local data
      const categories = [...new Set(this.localGames.map((game) => game.category))]
      return categories.sort()
    }
  }

  async getStats(): Promise<{
    total_games: number
    featured_games: number
    categories: number
    average_rating: number
    total_users?: number
    active_users?: number
  }> {
    try {
      return await this.request("/api/stats")
    } catch (error) {
      // Fallback to local data
      const games = this.localGames
      return {
        total_games: games.length,
        featured_games: games.filter((g) => g.featured).length,
        categories: new Set(games.map((g) => g.category)).size,
        average_rating: games.length > 0 ? games.reduce((sum, g) => sum + g.rating, 0) / games.length : 0,
      }
    }
  }

  private buildQueryString(params?: Record<string, any>): string {
    if (!params) return ""

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const query = searchParams.toString()
    return query ? `?${query}` : ""
  }

  // Check if API is available
  getApiStatus(): boolean {
    return this.isApiAvailable
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.authToken && !!this.currentUser
  }

  // Get current user info
  getCurrentUserInfo(): User | null {
    return this.currentUser
  }
}

export const apiClient = new ApiClient()