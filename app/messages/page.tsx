"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, MessageSquare } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: number
  senderId: number
  senderName: string
  receiverId: number
  content: string
  orderId?: number
  createdAt: string
  read: boolean
}

export default function MessagesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null)

  useEffect(() => {
    if (user) {
      loadMessages()
    }
  }, [user])

  const loadMessages = () => {
    const allMessages = JSON.parse(localStorage.getItem("messages") || "[]")
    const userMessages = allMessages.filter((msg: Message) => msg.senderId === user?.id || msg.receiverId === user?.id)
    setMessages(userMessages)
  }

  const getConversations = () => {
    const conversations = new Map()

    messages.forEach((msg) => {
      const otherUserId = msg.senderId === user?.id ? msg.receiverId : msg.senderId
      const otherUserName = msg.senderId === user?.id ? "Admin" : msg.senderName

      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          userId: otherUserId,
          userName: otherUserName,
          lastMessage: msg,
          unreadCount: 0,
        })
      }

      const conv = conversations.get(otherUserId)
      if (msg.createdAt > conv.lastMessage.createdAt) {
        conv.lastMessage = msg
      }

      if (!msg.read && msg.receiverId === user?.id) {
        conv.unreadCount++
      }
    })

    return Array.from(conversations.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime(),
    )
  }

  const getConversationMessages = (userId: number) => {
    return messages
      .filter(
        (msg) =>
          (msg.senderId === user?.id && msg.receiverId === userId) ||
          (msg.senderId === userId && msg.receiverId === user?.id),
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: Message = {
      id: Date.now(),
      senderId: user!.id,
      senderName: user!.name,
      receiverId: selectedConversation,
      content: newMessage.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    }

    const allMessages = JSON.parse(localStorage.getItem("messages") || "[]")
    allMessages.push(message)
    localStorage.setItem("messages", JSON.stringify(allMessages))

    setMessages((prev) => [...prev, message])
    setNewMessage("")

    toast({
      title: "Message sent",
      description: "Your message has been sent successfully",
    })
  }

  const markAsRead = (conversationUserId: number) => {
    const allMessages = JSON.parse(localStorage.getItem("messages") || "[]")
    const updatedMessages = allMessages.map((msg: Message) =>
      msg.senderId === conversationUserId && msg.receiverId === user?.id ? { ...msg, read: true } : msg,
    )
    localStorage.setItem("messages", JSON.stringify(updatedMessages))
    loadMessages()
  }

  const conversations = getConversations()
  const selectedMessages = selectedConversation ? getConversationMessages(selectedConversation) : []

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No conversations yet</div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.userId}
                      className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                        selectedConversation === conv.userId ? "bg-blue-50" : ""
                      }`}
                      onClick={() => {
                        setSelectedConversation(conv.userId)
                        markAsRead(conv.userId)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{conv.userName.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{conv.userName}</p>
                            <p className="text-sm text-gray-600 truncate">{conv.lastMessage.content}</p>
                          </div>
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge variant="default" className="rounded-full">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedConversation
                  ? conversations.find((c) => c.userId === selectedConversation)?.userName || "Chat"
                  : "Select a conversation"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[500px]">
              {selectedConversation ? (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {selectedMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderId === user?.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"
                          }`}
                        >
                          <p>{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.senderId === user?.id ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button onClick={sendMessage} className="bg-black hover:bg-gray-800 text-white">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a conversation to start messaging
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
