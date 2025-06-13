"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, Send } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function SupportPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!user) {
    router.push("/auth")
    return null
  }

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const handleSubmitTicket = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsSubmitting(true)

  const form = e.currentTarget as HTMLFormElement
  const formData = new FormData(form)
  
  const ticket = {
    id: Date.now(),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    subject: formData.get("subject"),
    category: formData.get("category"),
    priority: formData.get("priority"),
    description: formData.get("description"),
    status: "open",
    createdAt: new Date().toISOString(),
  }

    // Save ticket
    const tickets = JSON.parse(localStorage.getItem("support_tickets") || "[]")
    tickets.push(ticket)
    localStorage.setItem("support_tickets", JSON.stringify(tickets))

    // Create admin notification
    const notifications = JSON.parse(localStorage.getItem("admin_notifications") || "[]")
    notifications.push({
      id: Date.now(),
      type: "support_ticket",
      ticketId: ticket.id,
      userId: user.id,
      userName: user.name,
      message: `New support ticket: ${ticket.subject}`,
      createdAt: new Date().toISOString(),
      read: false,
    })
    localStorage.setItem("admin_notifications", JSON.stringify(notifications))

    // Send auto-reply message
    const messages = JSON.parse(localStorage.getItem("messages") || "[]")
    messages.push({
      id: Date.now(),
      senderId: 1, // Admin ID
      senderName: "Support Team",
      receiverId: user.id,
      content: `Thank you for contacting GameHub Support! We've received your ticket #${ticket.id} regarding "${ticket.subject}". Our team will review your request and respond within 24 hours. If you have any urgent concerns, please don't hesitate to reach out.`,
      createdAt: new Date().toISOString(),
      read: false,
    })
    localStorage.setItem("messages", JSON.stringify(messages))

    setIsSubmitting(false)
    toast({
      title: "Support ticket submitted",
      description: "We'll get back to you within 24 hours",
    })

    // Reset form
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <HelpCircle className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold mb-2">Uap Market Support</h1>
          <p className="text-gray-600">Need help? We're here to assist you with any questions or issues.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submit a Support Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitTicket} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">Payment Issues</SelectItem>
                      <SelectItem value="game_access">Game Access</SelectItem>
                      <SelectItem value="account">Account Issues</SelectItem>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="refund">Refund Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" placeholder="Brief description of your issue" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Please provide detailed information about your issue..."
                  rows={6}
                  required
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Before submitting:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Check our FAQ section for common solutions</li>
                  <li>• Include your order number if related to a purchase</li>
                  <li>• Provide screenshots if experiencing visual issues</li>
                  <li>• Be as detailed as possible to help us assist you better</li>
                </ul>
              </div>

              <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white" disabled={isSubmitting}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">How do I access my purchased games?</h3>
              <p className="text-sm text-gray-600">
                After payment verification, you'll receive game access details via our messaging system. Check your
                messages for login credentials and download links.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">How long does payment verification take?</h3>
              <p className="text-sm text-gray-600">
                Manual payment verification typically takes 1-24 hours during business hours. You'll be notified once
                your payment is confirmed.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Can I get a refund?</h3>
              <p className="text-sm text-gray-600">
                Refunds are available within 7 days of purchase if you haven't accessed the game content. Please contact
                support with your order details.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-gray-600">
                We accept QRIS payments and bank transfers to BCA and Mandiri accounts. All payments are verified
                manually by our team.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
}

