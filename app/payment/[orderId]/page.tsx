"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, QrCode, Building2, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [order, setOrder] = useState<any>(null)
  const [isPaid, setIsPaid] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }

    const orders = JSON.parse(localStorage.getItem("orders") || "[]")
    const foundOrder = orders.find((o: any) => o.id.toString() === params.orderId)

    if (foundOrder) {
      setOrder(foundOrder)
      setIsPaid(foundOrder.status === "paid")
    } else {
      router.push("/orders")
    }
  }, [params.orderId, user, router])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "Payment information copied successfully",
    })
  }

  const handleAlreadyPaid = () => {
    // Update order status
    const orders = JSON.parse(localStorage.getItem("orders") || "[]")
    const updatedOrders = orders.map((o: any) =>
      o.id.toString() === params.orderId
        ? { ...o, status: "pending_verification", paidAt: new Date().toISOString() }
        : o,
    )
    localStorage.setItem("orders", JSON.stringify(updatedOrders))

    // Create notification for admin
    const notifications = JSON.parse(localStorage.getItem("admin_notifications") || "[]")
    notifications.push({
      id: Date.now(),
      type: "payment_confirmation",
      orderId: params.orderId,
      userId: user?.id,
      userName: user?.name,
      message: `Payment confirmation received for Order #${params.orderId}`,
      createdAt: new Date().toISOString(),
      read: false,
    })
    localStorage.setItem("admin_notifications", JSON.stringify(notifications))

    setIsPaid(true)
    toast({
      title: "Payment confirmation sent",
      description: "Admin will verify your payment and send game details soon",
    })
  }

  if (!order) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-gray-600">Order #{order.id}</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Payment Details
                <Badge variant={isPaid ? "default" : "secondary"}>
                  {isPaid ? "Confirmation Sent" : "Pending Payment"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{formatPrice(order.total)}</div>
                <p className="text-gray-600">Total Amount</p>
              </div>

              {order.paymentMethod === "qris" && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <QrCode className="h-5 w-5" />
                    <span className="font-medium">QRIS Payment</span>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 rounded-lg mx-auto flex items-center justify-center mb-4">
                      <QrCode className="h-16 w-16 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">Scan this QR code with your mobile banking app</p>
                  </div>
                </div>
              )}

              {order.paymentMethod === "bank" && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span className="font-medium">Bank Transfer</span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Bank BCA</p>
                          <p className="text-lg font-mono">1234567890</p>
                          <p className="text-sm text-gray-600">GameHub Marketplace</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard("1234567890")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Bank Mandiri</p>
                          <p className="text-lg font-mono">0987654321</p>
                          <p className="text-sm text-gray-600">GameHub Marketplace</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard("0987654321")}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                {!isPaid ? (
                  <Button className="w-full bg-black hover:bg-gray-800 text-white" onClick={handleAlreadyPaid}>
                    <CheckCircle className="h-4 w-4 mr-2" />I Have Already Paid
                  </Button>
                ) : (
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-medium text-green-800">Payment Confirmation Sent</p>
                    <p className="text-sm text-green-600 mt-1">
                      Admin will verify your payment and send game access details via messages
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
