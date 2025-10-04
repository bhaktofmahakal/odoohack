'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { 
  Receipt, 
  Upload, 
  Camera,
  CalendarIcon,
  DollarSign,
  FileText,
  Tag,
  ArrowLeft,
  Loader2,
  X,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
]

const categories = [
  'Travel',
  'Meals',
  'Office Supplies',
  'Software',
  'Equipment', 
  'Training',
  'Marketing',
  'Other'
]

interface OCRResult {
  amount?: number
  date?: Date
  merchant?: string
  description?: string
  category?: string
}

export default function NewExpensePage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    category: '',
    description: '',
    date: new Date(),
  })
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [isOCRProcessing, setIsOCRProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      setReceiptFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setReceiptPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // Process OCR
      processOCR(file)
    }
  }

  const processOCR = async (file: File) => {
    setIsOCRProcessing(true)
    try {
      // Mock OCR processing - in real app, this would call your OCR API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock OCR results
      const mockResult: OCRResult = {
        amount: 45.99,
        date: new Date('2024-01-15'),
        merchant: 'Coffee Shop',
        description: 'Business meeting lunch',
        category: 'Meals'
      }
      
      setOcrResult(mockResult)
      
      // Auto-fill form with OCR results
      setFormData(prev => ({
        ...prev,
        amount: mockResult.amount?.toString() || prev.amount,
        description: mockResult.description || prev.description,
        category: mockResult.category || prev.category,
        date: mockResult.date || prev.date,
      }))
      
      toast.success('Receipt processed successfully! Form auto-filled with extracted data.')
    } catch (error) {
      toast.error('Failed to process receipt. Please fill the form manually.')
    } finally {
      setIsOCRProcessing(false)
    }
  }

  const removeReceipt = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
    setOcrResult(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.amount || !formData.category || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Mock API call - replace with real API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success('Expense submitted successfully!')
      router.push('/dashboard/expenses')
    } catch (error) {
      toast.error('Failed to submit expense. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCurrency = currencies.find(c => c.code === formData.currency)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/expenses">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Submit New Expense</h1>
          <p className="text-muted-foreground">Upload a receipt and fill in the expense details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Receipt Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Receipt Upload
              </CardTitle>
              <CardDescription>
                Upload a receipt image for automatic data extraction via OCR
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!receiptPreview ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Click to upload receipt</p>
                    <p className="text-sm text-muted-foreground">
                      Supports JPG, PNG up to 5MB
                    </p>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img 
                      src={receiptPreview} 
                      alt="Receipt preview" 
                      className="w-full max-h-64 object-contain rounded-lg bg-muted"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeReceipt}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {isOCRProcessing && (
                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <div>
                        <p className="font-medium">Processing receipt...</p>
                        <p className="text-sm text-muted-foreground">Extracting expense data using OCR</p>
                      </div>
                    </div>
                  )}
                  
                  {ocrResult && (
                    <div className="flex items-center gap-3 p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-green-600">Receipt processed successfully!</p>
                        <p className="text-sm text-muted-foreground">Form has been auto-filled with extracted data</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Expense Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Expense Details
              </CardTitle>
              <CardDescription>
                Fill in the expense information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(value: string) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, category: value }))}
                  required
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the expense..."
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1"
                  rows={3}
                  required
                />
              </div>

              {/* Date */}
              <div>
                <Label>Expense Date *</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date: Date | undefined) => {
                        if (date) {
                          setFormData(prev => ({ ...prev, date }))
                          setShowCalendar(false)
                        }
                      }}
                      disabled={(date: Date) => 
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Converted Amount Display */}
              {formData.amount && selectedCurrency && formData.currency !== 'USD' && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Amount in USD:</span>
                    <span className="font-medium">
                      ~${(parseFloat(formData.amount) * 0.82).toFixed(2)} {/* Mock conversion rate */}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    *Converted at current exchange rates
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4"
        >
          <Link href="/dashboard/expenses" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            className="flex-1 gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Receipt className="h-4 w-4" />
                Submit Expense
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </div>
  )
}