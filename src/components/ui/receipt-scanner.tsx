'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from './card'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { Upload, Camera, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { scaleIn, fadeInUp } from '@/lib/animations'

interface OCRResult {
  amount?: number
  currency?: string
  date?: string
  merchant?: string
  category?: string
  confidence: number
}

interface ReceiptScannerProps {
  onScanComplete: (result: OCRResult) => void
  className?: string
}

export function ReceiptScanner({ onScanComplete, className }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<OCRResult | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsScanning(true)
    setError(null)
    
    // Create preview
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    try {
      // Simulate OCR processing (in real app, this would call the Cloud Vision API)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock OCR result
      const mockResult: OCRResult = {
        amount: Math.floor(Math.random() * 500) + 20,
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
        merchant: ['Starbucks', 'McDonald\'s', 'Uber Eats', 'Amazon', 'Office Depot'][Math.floor(Math.random() * 5)],
        category: ['MEALS', 'TRAVEL', 'OFFICE_SUPPLIES'][Math.floor(Math.random() * 3)],
        confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
      }

      setScanResult(mockResult)
      onScanComplete(mockResult)
    } catch (err) {
      setError('Failed to scan receipt. Please try again.')
    } finally {
      setIsScanning(false)
    }
  }, [onScanComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    disabled: isScanning
  })

  const reset = () => {
    setPreview(null)
    setScanResult(null)
    setError(null)
    setIsScanning(false)
  }

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Receipt Scanner</h3>
            <p className="text-sm text-muted-foreground">
              Upload a receipt image and we'll extract the expense details automatically
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!preview && !scanResult && (
              <motion.div
                key="upload"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                {...(getRootProps() as any)}
                className={cn(
                  'dropzone cursor-pointer',
                  isDragActive && 'active',
                  isScanning && 'opacity-50 cursor-not-allowed'
                )}
              >
                <input {...getInputProps()} />
                <motion.div
                  variants={scaleIn}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center gap-4"
                >
                  <div className="p-4 rounded-full bg-primary/10 text-primary">
                    {isDragActive ? (
                      <Upload className="h-8 w-8" />
                    ) : (
                      <Camera className="h-8 w-8" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium">
                      {isDragActive ? 'Drop your receipt here' : 'Upload Receipt'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Drag & drop or click to select • PNG, JPG up to 10MB
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {(preview || isScanning) && (
              <motion.div
                key="processing"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-4"
              >
                {preview && (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Receipt preview"
                      className="w-full max-h-64 object-contain rounded-lg border"
                    />
                    {isScanning && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Loader2 className="h-8 w-8 text-primary" />
                          </motion.div>
                          <p className="text-sm font-medium">Scanning receipt...</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Extracting expense details</span>
                            <motion.div
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              •••
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {scanResult && (
              <motion.div
                key="result"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Receipt scanned successfully!</span>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-success/5 border border-success/20">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Amount
                    </label>
                    <p className="text-lg font-mono font-semibold">
                      {scanResult.currency} {scanResult.amount}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Date
                    </label>
                    <p className="text-lg font-semibold">{scanResult.date}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Merchant
                    </label>
                    <p className="text-lg font-semibold">{scanResult.merchant}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Category
                    </label>
                    <p className="text-lg font-semibold">{scanResult.category}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Confidence: {Math.round(scanResult.confidence * 100)}%
                  </div>
                  <Button onClick={reset} variant="outline" size="sm">
                    Scan Another
                  </Button>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="flex items-center gap-2 p-4 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive"
              >
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
                <Button onClick={reset} variant="ghost" size="sm" className="ml-auto">
                  Try Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}