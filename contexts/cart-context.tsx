"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface Game {
  id: number
  title: string
  description: string
  price: number
  image: string
  rating: number
  category: string
}

interface CartItem extends Game {
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addToCart: (game: Game) => void
  removeFromCart: (gameId: number) => void
  updateQuantity: (gameId: number, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addToCart = (game: Game) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === game.id)
      if (existingItem) {
        return prevItems.map((item) => (item.id === game.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prevItems, { ...game, quantity: 1 }]
    })
  }

  const removeFromCart = (gameId: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== gameId))
  }

  const updateQuantity = (gameId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(gameId)
      return
    }
    setItems((prevItems) => prevItems.map((item) => (item.id === gameId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
