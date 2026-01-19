'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Button from '../../../../../components/ui/Button'
import Surface from '../../../../../components/ui/Surface'

interface ProductModel {
  id: string
  brand: string
  model: string
  slug: string
}

interface CSVRow {
  id: string
  brand: string
  model: string
  size: string
  condition: string
  price: string
  stock: string
  source?: string
  confidence?: number
  errors: string[]
  status: 'valid' | 'error' | 'imported'
}

interface GeneratedVariant {
  id: string
  size: string
  condition: string
  price: number
  stock: number
}

type ImportResult = { success: number; errors: number }

const CONDITION_PRESETS = [
  { code: 'DS', label: 'Deadstock (New)', multiplier: 1.0 },
  { code: 'VNDS', label: 'Very Near Deadstock', multiplier: 0.9 },
  { code: 'PADS', label: 'Pass as Deadstock', multiplier: 0.85 },
  { code: 'USED', label: 'Used - Good', multiplier: 0.7 },
  { code: 'BEATER', label: 'Beater', multiplier: 0.5 },
]

const SIZE_RUNS = {
  mens: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '14'],
  womens: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'],
  kids: ['3Y', '3.5Y', '4Y', '4.5Y', '5Y', '5.5Y', '6Y', '6.5Y', '7Y'],
  apparel: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  oneSize: ['OS'],
}

const validateRow = (row: Pick<CSVRow, 'brand' | 'model' | 'size' | 'condition' | 'price' | 'stock'>): string[] => {
  const errors: string[] = []

  if (!row.brand?.trim()) errors.push('Brand required')
  if (!row.model?.trim()) errors.push('Model required')
  if (!row.size?.trim()) errors.push('Size required')
  if (!row.condition?.trim()) errors.push('Condition required')

  const price = parseFloat(row.price)
  if (Number.isNaN(price) || price <= 0) errors.push('Invalid price')

  const stock = parseInt(row.stock, 10)
  if (Number.isNaN(stock) || stock < 0) errors.push('Invalid stock')

  const validConditions = CONDITION_PRESETS.map(c => c.code)
  if (row.condition && !validConditions.includes(row.condition.toUpperCase())) {
    errors.push(`Invalid condition. Use: ${validConditions.join(', ')}`)
  }

  return errors
}

export default function InventoryIntakePage() {
  const [activeTab, setActiveTab] = useState<'csv' | 'generator' | 'screenshots' | 'photos'>('generator')
  const [models, setModels] = useState<ProductModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/admin/models')
      if (response.ok) {
        const data = await response.json()
        setModels(data.models || [])
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <Link href="/admin/inventory" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            Back to inventory
          </Link>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mt-2">Inventory intake</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Create variants, import CSVs, and attach photos in one flow.
          </p>
        </div>
        <div className="flex gap-2">
          <Button href="/admin/models" variant="secondary" size="sm">View models</Button>
          <Button href="/admin/products/new" variant="ghost" size="sm">New product</Button>
        </div>
      </div>

      <Surface padding="md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Step 1</p>
            <p className="text-[var(--text-primary)] font-medium mt-1">Select or create model</p>
            <p className="text-[var(--text-muted)] mt-1">Search by brand and model, then save.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Step 2</p>
            <p className="text-[var(--text-primary)] font-medium mt-1">Add sizes and pricing</p>
            <p className="text-[var(--text-muted)] mt-1">Use the generator, CSV import, or screenshots.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Step 3</p>
            <p className="text-[var(--text-primary)] font-medium mt-1">Attach photos</p>
            <p className="text-[var(--text-muted)] mt-1">Upload images and set a primary shot.</p>
          </div>
        </div>
      </Surface>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('generator')}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            activeTab === 'generator'
              ? 'bg-[var(--accent)] text-white border-transparent'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
          }`}
        >
          Variant generator
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            activeTab === 'csv'
              ? 'bg-[var(--accent)] text-white border-transparent'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
          }`}
        >
          CSV import
        </button>
        <button
          onClick={() => setActiveTab('screenshots')}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            activeTab === 'screenshots'
              ? 'bg-[var(--accent)] text-white border-transparent'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
          }`}
        >
          Screenshot import
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            activeTab === 'photos'
              ? 'bg-[var(--accent)] text-white border-transparent'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
          }`}
        >
          Photo upload
        </button>
      </div>

      {loading ? (
        <Surface padding="lg" className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </Surface>
      ) : (
        <>
          {activeTab === 'generator' && (
            <VariantGenerator models={models} onModelsUpdate={fetchModels} />
          )}
          {activeTab === 'csv' && (
            <CSVImport models={models} onModelsUpdate={fetchModels} />
          )}
          {activeTab === 'screenshots' && (
            <ScreenshotImport onModelsUpdate={fetchModels} />
          )}
          {activeTab === 'photos' && (
            <PhotoUpload models={models} />
          )}
        </>
      )}
    </div>
  )
}

// Variant Generator Component
function VariantGenerator({ models, onModelsUpdate }: { models: ProductModel[]; onModelsUpdate: () => void }) {
  const [selectedModel, setSelectedModel] = useState<ProductModel | null>(null)
  const [modelSearch, setModelSearch] = useState('')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [showCreateModel, setShowCreateModel] = useState(false)
  const [sizeRun, setSizeRun] = useState<string>('mens')
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set())
  const [selectedConditions, setSelectedConditions] = useState<Set<string>>(new Set(['DS']))
  const [basePrice, setBasePrice] = useState('')
  const [defaultStock, setDefaultStock] = useState('1')
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null)

  const filteredModels = models.filter(m => 
    `${m.brand} ${m.model}`.toLowerCase().includes(modelSearch.toLowerCase())
  )

  const generateVariants = () => {
    if (!selectedModel || selectedSizes.size === 0 || selectedConditions.size === 0 || !basePrice) {
      return
    }

    const variants: GeneratedVariant[] = []
    const basePriceCents = Math.round(parseFloat(basePrice) * 100)

    selectedSizes.forEach(size => {
      selectedConditions.forEach(condCode => {
        const condition = CONDITION_PRESETS.find(c => c.code === condCode)
        const price = Math.round(basePriceCents * (condition?.multiplier || 1))
        variants.push({
          id: `${size}-${condCode}`,
          size,
          condition: condCode,
          price,
          stock: parseInt(defaultStock) || 1
        })
      })
    })

    setGeneratedVariants(variants)
  }

  const updateVariantPrice = (id: string, price: number) => {
    setGeneratedVariants(prev => prev.map(v => 
      v.id === id ? { ...v, price } : v
    ))
  }

  const updateVariantStock = (id: string, stock: number) => {
    setGeneratedVariants(prev => prev.map(v => 
      v.id === id ? { ...v, stock } : v
    ))
  }

  const removeVariant = (id: string) => {
    setGeneratedVariants(prev => prev.filter(v => v.id !== id))
  }

  const importVariants = async () => {
    if (!selectedModel || generatedVariants.length === 0) return

    setImporting(true)
    setImportResult(null)

    try {
      const response = await fetch('/api/admin/inventory/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel.id,
          brand: selectedModel.brand,
          model: selectedModel.model,
          variants: generatedVariants.map(v => ({
            size: v.size,
            condition: v.condition,
            priceCents: v.price,
            stock: v.stock
          }))
        })
      })

      const data = await response.json()

      if (response.ok) {
        setImportResult({ success: data.imported || generatedVariants.length, errors: [] })
        setGeneratedVariants([])
      } else {
        setImportResult({ success: 0, errors: [data.error || 'Import failed'] })
      }
    } catch {
      setImportResult({ success: 0, errors: ['Network error'] })
    } finally {
      setImporting(false)
    }
  }

  const selectAllSizes = () => {
    setSelectedSizes(new Set(SIZE_RUNS[sizeRun as keyof typeof SIZE_RUNS]))
  }

  const clearSizes = () => {
    setSelectedSizes(new Set())
  }

  return (
    <div className="space-y-6">
      {/* Model Picker */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">1. Select Product Model</h2>
        
        <div className="relative">
          <input
            type="text"
            value={selectedModel ? `${selectedModel.brand} ${selectedModel.model}` : modelSearch}
            onChange={(e) => {
              setModelSearch(e.target.value)
              setSelectedModel(null)
              setShowModelDropdown(true)
            }}
            onFocus={() => setShowModelDropdown(true)}
            placeholder="Search brand or model..."
            className="w-full"
          />
          
          {showModelDropdown && modelSearch && (
            <div className="absolute z-10 w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredModels.length > 0 ? (
                filteredModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model)
                      setModelSearch('')
                      setShowModelDropdown(false)
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <span className="font-medium text-[var(--text-primary)]">{model.brand}</span>
                    <span className="text-[var(--text-secondary)]"> {model.model}</span>
                  </button>
                ))
              ) : (
                <div className="p-4">
                  <p className="text-[var(--text-muted)] mb-3">No models found for &ldquo;{modelSearch}&rdquo;</p>
                  <button
                    onClick={() => {
                      setShowCreateModel(true)
                      setShowModelDropdown(false)
                    }}
                    className="btn-primary text-sm w-full"
                  >
                    + Create New Model
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedModel && (
          <div className="mt-4 p-3 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-between">
            <div>
              <span className="font-medium text-[var(--text-primary)]">{selectedModel.brand}</span>
              <span className="text-[var(--text-secondary)]"> {selectedModel.model}</span>
            </div>
            <button
              onClick={() => setSelectedModel(null)}
              className="text-[var(--text-muted)] hover:text-[var(--error)]"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Size Run Selector */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">2. Select Sizes</h2>
        
        <div className="flex gap-2 mb-4">
          {Object.keys(SIZE_RUNS).map(run => (
            <button
              key={run}
              onClick={() => {
                setSizeRun(run)
                setSelectedSizes(new Set())
              }}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                sizeRun === run
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {run.charAt(0).toUpperCase() + run.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={selectAllSizes} className="text-sm text-[var(--accent)] hover:underline">
            Select All
          </button>
          <button onClick={clearSizes} className="text-sm text-[var(--text-muted)] hover:underline">
            Clear
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {SIZE_RUNS[sizeRun as keyof typeof SIZE_RUNS].map(size => (
            <button
              key={size}
              onClick={() => {
                const newSizes = new Set(selectedSizes)
                if (newSizes.has(size)) {
                  newSizes.delete(size)
                } else {
                  newSizes.add(size)
                }
                setSelectedSizes(newSizes)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSizes.has(size)
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)]'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Condition Selector */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">3. Select Conditions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CONDITION_PRESETS.map(condition => (
            <button
              key={condition.code}
              onClick={() => {
                const newConditions = new Set(selectedConditions)
                if (newConditions.has(condition.code)) {
                  newConditions.delete(condition.code)
                } else {
                  newConditions.add(condition.code)
                }
                setSelectedConditions(newConditions)
              }}
              className={`p-3 rounded-lg text-left transition-colors border-2 ${
                selectedConditions.has(condition.code)
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
              }`}
            >
              <p className="font-medium text-[var(--text-primary)]">{condition.code}</p>
              <p className="text-sm text-[var(--text-muted)]">{condition.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Price modifier: {condition.multiplier === 1 ? 'Base' : `${Math.round(condition.multiplier * 100)}%`}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">4. Set Base Price & Stock</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label>Base Price (for DS condition)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder=""
                className="pl-8 min-h-[44px]"
              />
            </div>
          </div>
          <div>
            <label>Default Stock Per Variant</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={defaultStock}
              onChange={(e) => setDefaultStock(e.target.value)}
              placeholder=""
              className="min-h-[44px]"
            />
          </div>
        </div>

        <button
          onClick={generateVariants}
          disabled={!selectedModel || selectedSizes.size === 0 || selectedConditions.size === 0 || !basePrice}
          className="btn-primary mt-4"
        >
          Generate {selectedSizes.size * selectedConditions.size} Variants
        </button>
      </div>

      {/* Generated Variants Preview */}
      {generatedVariants.length > 0 && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
            <h2 className="font-semibold text-[var(--text-primary)]">
              Preview ({generatedVariants.length} variants)
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => setGeneratedVariants([])}
                className="btn-secondary text-sm"
              >
                Clear All
              </button>
              <button
                onClick={importVariants}
                disabled={importing}
                className="btn-primary text-sm"
              >
                {importing ? 'Importing...' : 'Import All'}
              </button>
            </div>
          </div>

          {importResult && (
            <div className={`p-4 ${importResult.errors.length > 0 ? 'bg-[var(--error)]/10' : 'bg-[var(--success)]/10'}`}>
              {importResult.errors.length > 0 ? (
                <p className="text-[var(--error)]">Error: {importResult.errors.join(', ')}</p>
              ) : (
                <p className="text-[var(--success)]">✓ Successfully imported {importResult.success} variants</p>
              )}
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-tertiary)] sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Condition</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {generatedVariants.map(variant => (
                  <tr key={variant.id} className="hover:bg-[var(--bg-tertiary)]">
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{variant.size}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{variant.condition}</td>
                    <td className="px-4 py-3">
                      <div className="relative w-full min-w-[80px] max-w-[120px]">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none">$</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={(variant.price / 100).toFixed(2)}
                          onChange={(e) => updateVariantPrice(variant.id, Math.round(parseFloat(e.target.value) * 100))}
                          className="w-full pl-6 pr-2 py-2 text-sm min-h-[40px]"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={variant.stock}
                        onChange={(e) => updateVariantStock(variant.id, parseInt(e.target.value) || 0)}
                        className="w-full min-w-[60px] max-w-[80px] py-2 text-sm min-h-[40px]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeVariant(variant.id)}
                        className="text-[var(--text-muted)] hover:text-[var(--error)]"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Model Modal */}
      {showCreateModel && (
        <CreateModelModal
          initialBrand={modelSearch.split(' ')[0] || ''}
          initialModel={modelSearch.split(' ').slice(1).join(' ') || ''}
          onClose={() => setShowCreateModel(false)}
          onSuccess={(newModel) => {
            setSelectedModel(newModel)
            setShowCreateModel(false)
            onModelsUpdate()
          }}
        />
      )}
    </div>
  )
}

// CSV Import Component
function CSVImport({ onModelsUpdate }: { models: ProductModel[]; onModelsUpdate: () => void }) {
  const [rows, setRows] = useState<CSVRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      // Skip header row
      const dataLines = lines.slice(1)
      
      const parsedRows: CSVRow[] = dataLines.map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const row = {
          brand: values[0] || '',
          model: values[1] || '',
          size: values[2] || '',
          condition: values[3]?.toUpperCase() || '',
          price: values[4] || '',
          stock: values[5] || '1',
        }
        const errors = validateRow(row)
        return {
          id: `row-${index}`,
          ...row,
          errors,
          status: errors.length > 0 ? 'error' as const : 'valid' as const
        }
      })

      setRows(parsedRows)
      setImportResult(null)
    }
    reader.readAsText(file)
  }

  const importRows = async () => {
    const validRows = rows.filter(r => r.status === 'valid')
    if (validRows.length === 0) return

    setImporting(true)
    setImportResult(null)

    try {
      const response = await fetch('/api/admin/inventory/intake/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows })
      })

      const data = await response.json()

      if (response.ok) {
        // Mark imported rows
        setRows(prev => prev.map(row => 
          row.status === 'valid' ? { ...row, status: 'imported' as const } : row
        ))
        setImportResult({ success: data.imported || validRows.length, errors: data.errors || 0 })
        onModelsUpdate()
      } else {
        setImportResult({ success: 0, errors: validRows.length })
      }
    } catch {
      setImportResult({ success: 0, errors: validRows.length })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">Upload CSV File</h2>
        
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
          >
            Choose CSV File
          </button>
          <span className="text-sm text-[var(--text-muted)]">
            Format: brand, model, size, condition, price, stock
          </span>
        </div>

        <div className="mt-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-2">CSV Template:</p>
          <code className="text-xs text-[var(--text-muted)] block">
            brand,model,size,condition,price,stock<br/>
            Nike,Air Jordan 1 High OG,10,DS,250.00,1<br/>
            Nike,Air Jordan 1 High OG,10.5,VNDS,220.00,1
          </code>
        </div>
      </div>

      <ImportPreviewTable
        rows={rows}
        setRows={setRows}
        importRows={importRows}
        importing={importing}
        importResult={importResult}
      />
    </div>
  )
}

function ScreenshotImport({ onModelsUpdate }: { onModelsUpdate: () => void }) {
  const [rows, setRows] = useState<CSVRow[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [sources, setSources] = useState<Array<{ name: string; text: string; error?: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []).filter(file =>
      file.type.startsWith('image/')
    )
    setFiles(selected)
    setRows([])
    setSources([])
    setImportResult(null)
    setError(null)
  }

  const processScreenshots = async () => {
    if (files.length === 0) return
    setProcessing(true)
    setError(null)
    setRows([])
    setSources([])
    setImportResult(null)

    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file, file.name)
      })

      const response = await fetch('/api/admin/inventory/intake/screenshots', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data?.error || 'Failed to process screenshots')
        return
      }

      const parsedRows = (data.rows || []).map((row: Partial<CSVRow>, index: number) => {
        const baseRow: Omit<CSVRow, 'errors' | 'status'> = {
          id: `ocr-${Date.now()}-${index}`,
          brand: row.brand || '',
          model: row.model || '',
          size: row.size || '',
          condition: row.condition || '',
          price: row.price || '',
          stock: row.stock || '',
          source: row.source,
          confidence: row.confidence,
        }
        const errors = validateRow(baseRow)
        return {
          ...baseRow,
          errors,
          status: errors.length > 0 ? 'error' : 'valid',
        }
      })

      setRows(parsedRows)
      setSources(data.sources || [])
    } catch (err) {
      console.error('Screenshot OCR failed:', err)
      setError('Failed to process screenshots')
    } finally {
      setProcessing(false)
    }
  }

  const importRows = async () => {
    const validRows = rows.filter(r => r.status === 'valid')
    if (validRows.length === 0) return

    setImporting(true)
    setImportResult(null)

    try {
      const response = await fetch('/api/admin/inventory/intake/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows })
      })

      const data = await response.json()

      if (response.ok) {
        setRows(prev => prev.map(row =>
          row.status === 'valid' ? { ...row, status: 'imported' as const } : row
        ))
        setImportResult({ success: data.imported || validRows.length, errors: data.errors || 0 })
        onModelsUpdate()
      } else {
        setImportResult({ success: 0, errors: validRows.length })
      }
    } catch {
      setImportResult({ success: 0, errors: validRows.length })
    } finally {
      setImporting(false)
    }
  }

  const clearAll = () => {
    setFiles([])
    setRows([])
    setSources([])
    setImportResult(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-[var(--text-primary)]">Upload screenshots</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            OCR works best with clear tables. Review and edit rows before importing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary"
          >
            Choose screenshots
          </button>
          <span className="text-sm text-[var(--text-muted)]">
            PNG or JPG, up to 12 images.
          </span>
        </div>

        {files.length > 0 && (
          <div className="bg-[var(--bg-tertiary)] rounded-lg p-3 text-sm text-[var(--text-secondary)]">
            {files.length} screenshot(s) selected.
            <div className="mt-2 flex flex-wrap gap-2">
              {files.map((file) => (
                <span key={file.name} className="px-2 py-1 bg-[var(--bg-secondary)] rounded">
                  {file.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button onClick={clearAll} className="btn-secondary text-sm">
            Clear
          </button>
          <button
            onClick={processScreenshots}
            disabled={processing || files.length === 0}
            className="btn-primary text-sm"
          >
            {processing ? 'Processing...' : 'Extract rows'}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}
      </div>

      <ImportPreviewTable
        rows={rows}
        setRows={setRows}
        importRows={importRows}
        importing={importing}
        importResult={importResult}
        title="Preview extracted rows"
      />

      {sources.length > 0 && (
        <Surface padding="md">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-3">OCR output</p>
          <div className="space-y-2">
            {sources.map((source) => (
              <details key={source.name} className="border border-[var(--border-primary)] rounded-lg">
                <summary className="cursor-pointer px-4 py-2 text-sm text-[var(--text-secondary)]">
                  {source.name}
                  {source.error ? ` - ${source.error}` : ''}
                </summary>
                <pre className="whitespace-pre-wrap text-xs text-[var(--text-muted)] p-4 border-t border-[var(--border-primary)]">
                  {source.text || 'No text detected.'}
                </pre>
              </details>
            ))}
          </div>
        </Surface>
      )}
    </div>
  )
}

function ImportPreviewTable({
  rows,
  setRows,
  importRows,
  importing,
  importResult,
  title = 'Preview',
}: {
  rows: CSVRow[]
  setRows: (value: CSVRow[] | ((prev: CSVRow[]) => CSVRow[])) => void
  importRows: () => void
  importing: boolean
  importResult: ImportResult | null
  title?: string
}) {
  if (rows.length === 0) return null

  const validCount = rows.filter(r => r.status === 'valid').length
  const errorCount = rows.filter(r => r.status === 'error').length
  const importedCount = rows.filter(r => r.status === 'imported').length
  const showSource = rows.some(row => row.source)
  const showConfidence = rows.some(row => typeof row.confidence === 'number')

  const updateRow = (id: string, field: keyof Pick<CSVRow, 'brand' | 'model' | 'size' | 'condition' | 'price' | 'stock'>, value: string) => {
    setRows(prev => prev.map(row => {
      if (row.id !== id) return row
      const updated = { ...row, [field]: value }
      const errors = validateRow(updated)
      return { ...updated, errors, status: errors.length > 0 ? 'error' as const : 'valid' as const }
    }))
  }

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(row => row.id !== id))
  }

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[var(--border-primary)] flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-[var(--text-primary)]">{title}</h2>
          <div className="flex gap-2 text-sm">
            <span className="px-2 py-1 bg-[var(--success)]/20 text-[var(--success)] rounded">{validCount} valid</span>
            {errorCount > 0 && (
              <span className="px-2 py-1 bg-[var(--error)]/20 text-[var(--error)] rounded">{errorCount} errors</span>
            )}
            {importedCount > 0 && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">{importedCount} imported</span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setRows([])} className="btn-secondary text-sm">Clear</button>
          <button
            onClick={importRows}
            disabled={importing || validCount === 0}
            className="btn-primary text-sm"
          >
            {importing ? 'Importing...' : `Import ${validCount} Valid Rows`}
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`p-4 ${importResult.errors > 0 ? 'bg-[var(--warning)]/10' : 'bg-[var(--success)]/10'}`}>
          <p className={importResult.errors > 0 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}>
            ✓ Imported {importResult.success} rows
            {importResult.errors > 0 && `, ${importResult.errors} failed`}
          </p>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-[var(--bg-tertiary)] sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
              {showSource && (
                <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Source</th>
              )}
              {showConfidence && (
                <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Conf</th>
              )}
              <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Brand</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Model</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Size</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Cond</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Price</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Stock</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-primary)]">
            {rows.map(row => (
              <tr key={row.id} className={`${row.status === 'error' ? 'bg-[var(--error)]/5' : row.status === 'imported' ? 'bg-[var(--success)]/5' : ''}`}>
                <td className="px-3 py-2">
                  {row.status === 'valid' && <span className="text-[var(--success)]">✓</span>}
                  {row.status === 'error' && (
                    <span className="text-[var(--error)]" title={row.errors.join(', ')}>✕</span>
                  )}
                  {row.status === 'imported' && <span className="text-blue-400">✓✓</span>}
                </td>
                {showSource && (
                  <td className="px-3 py-2 text-xs text-[var(--text-muted)]">
                    {row.source || '—'}
                  </td>
                )}
                {showConfidence && (
                  <td className="px-3 py-2 text-xs text-[var(--text-muted)]">
                    {typeof row.confidence === 'number' ? `${Math.round(row.confidence * 100)}%` : '—'}
                  </td>
                )}
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.brand}
                    onChange={(e) => updateRow(row.id, 'brand', e.target.value)}
                    className={`w-full min-w-[70px] max-w-[100px] py-2 text-sm min-h-[40px] ${row.errors.some(e => e.includes('Brand')) ? 'border-[var(--error)]' : ''}`}
                    disabled={row.status === 'imported'}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.model}
                    onChange={(e) => updateRow(row.id, 'model', e.target.value)}
                    className={`w-full min-w-[80px] max-w-[140px] py-2 text-sm min-h-[40px] ${row.errors.some(e => e.includes('Model')) ? 'border-[var(--error)]' : ''}`}
                    disabled={row.status === 'imported'}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.size}
                    onChange={(e) => updateRow(row.id, 'size', e.target.value)}
                    className={`w-full min-w-[50px] max-w-[70px] py-2 text-sm min-h-[40px] ${row.errors.some(e => e.includes('Size')) ? 'border-[var(--error)]' : ''}`}
                    disabled={row.status === 'imported'}
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={row.condition}
                    onChange={(e) => updateRow(row.id, 'condition', e.target.value)}
                    className={`w-full min-w-[60px] max-w-[80px] py-2 text-sm min-h-[40px] ${row.errors.some(e => e.includes('condition')) ? 'border-[var(--error)]' : ''}`}
                    disabled={row.status === 'imported'}
                  >
                    <option value="">--</option>
                    {CONDITION_PRESETS.map(c => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={row.price}
                    onChange={(e) => updateRow(row.id, 'price', e.target.value)}
                    className={`w-full min-w-[60px] max-w-[80px] py-2 text-sm min-h-[40px] ${row.errors.some(e => e.includes('price')) ? 'border-[var(--error)]' : ''}`}
                    disabled={row.status === 'imported'}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={row.stock}
                    onChange={(e) => updateRow(row.id, 'stock', e.target.value)}
                    className={`w-full min-w-[50px] max-w-[70px] py-2 text-sm min-h-[40px] ${row.errors.some(e => e.includes('stock')) ? 'border-[var(--error)]' : ''}`}
                    disabled={row.status === 'imported'}
                  />
                </td>
                <td className="px-3 py-2">
                  {row.status !== 'imported' && (
                    <button onClick={() => removeRow(row.id)} className="text-[var(--text-muted)] hover:text-[var(--error)]">
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {errorCount > 0 && (
        <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
          <p className="text-sm text-[var(--text-muted)]">
            <strong>Fix errors inline</strong> by editing the fields above, or remove invalid rows.
          </p>
        </div>
      )}
    </div>
  )
}

// Photo Upload Component  
function PhotoUpload({ models }: { models: ProductModel[] }) {
  const [selectedModel, setSelectedModel] = useState<ProductModel | null>(null)
  const [modelSearch, setModelSearch] = useState('')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [images, setImages] = useState<Array<{ id: string; url: string; isPrimary: boolean; file?: File }>>([])
  const [modelImages, setModelImages] = useState<Array<{ id: string; url: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const filteredModels = models.filter(m => 
    `${m.brand} ${m.model}`.toLowerCase().includes(modelSearch.toLowerCase())
  )

  // Fetch existing model images when model is selected
  useEffect(() => {
    if (selectedModel) {
      fetchModelImages(selectedModel.id)
    } else {
      setModelImages([])
    }
  }, [selectedModel])

  const fetchModelImages = async (modelId: string) => {
    try {
      const response = await fetch(`/api/admin/models/${modelId}/images`)
      if (response.ok) {
        const data = await response.json()
        setModelImages(data.images || [])
      }
    } catch (error) {
      console.error('Error fetching model images:', error)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    addFiles(files)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    addFiles(files)
  }

  const addFiles = (files: File[]) => {
    const newImages = files.map((file, i) => ({
      id: `upload-${Date.now()}-${i}`,
      url: URL.createObjectURL(file),
      isPrimary: images.length === 0 && i === 0,
      file
    }))
    setImages(prev => [...prev, ...newImages])
  }

  const selectModelImage = (image: { id: string; url: string }) => {
    setImages(prev => [...prev, {
      id: `model-${image.id}`,
      url: image.url,
      isPrimary: prev.length === 0
    }])
  }

  const setPrimary = (id: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      isPrimary: img.id === id
    })))
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id)
      // If removed image was primary, make first one primary
      if (filtered.length > 0 && !filtered.some(img => img.isPrimary)) {
        filtered[0].isPrimary = true
      }
      return filtered
    })
  }

  const uploadImages = async () => {
    if (!selectedModel || images.length === 0) return

    setUploading(true)
    setUploadError(null)

    try {
      const entries = images.map((img, index) => ({
        kind: img.file ? 'file' : 'existing',
        position: index,
        isPrimary: img.isPrimary,
        url: img.file ? null : img.url,
      }))

      const formData = new FormData()
      formData.append('modelId', selectedModel.id)
      formData.append('entries', JSON.stringify(entries))

      images.forEach((img) => {
        if (img.file) {
          formData.append('files', img.file, img.file.name)
        }
      })

      const response = await fetch('/api/admin/inventory/intake/photos', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Images attached: ${data.attached ?? images.length}`)
        setImages([])
      } else {
        const data = await response.json().catch(() => null)
        setUploadError(data?.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Model Picker */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">Select Product</h2>
        
        <div className="relative">
          <input
            type="text"
            value={selectedModel ? `${selectedModel.brand} ${selectedModel.model}` : modelSearch}
            onChange={(e) => {
              setModelSearch(e.target.value)
              setSelectedModel(null)
              setShowModelDropdown(true)
            }}
            onFocus={() => setShowModelDropdown(true)}
            placeholder="Search brand or model..."
            className="w-full"
          />
          
          {showModelDropdown && modelSearch && filteredModels.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredModels.map(model => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model)
                    setModelSearch('')
                    setShowModelDropdown(false)
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <span className="font-medium text-[var(--text-primary)]">{model.brand}</span>
                  <span className="text-[var(--text-secondary)]"> {model.model}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedModel && (
        <>
          {/* Existing Model Images */}
          {modelImages.length > 0 && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
              <h2 className="font-semibold text-[var(--text-primary)] mb-4">
                Available Model Images
                <span className="text-sm font-normal text-[var(--text-muted)] ml-2">Click to use</span>
              </h2>
              
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {modelImages.map(img => (
                  <button
                    key={img.id}
                    onClick={() => selectModelImage(img)}
                    className="aspect-square rounded-lg overflow-hidden border-2 border-[var(--border-primary)] hover:border-[var(--accent)] transition-colors"
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Drag & Drop Upload */}
          <div
            ref={dropRef}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`bg-[var(--bg-secondary)] border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragOver ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border-primary)]'
            }`}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[var(--text-primary)] font-medium mb-2">Drag & drop images here</p>
            <p className="text-[var(--text-muted)] text-sm mb-4">or</p>
            <label className="btn-primary cursor-pointer">
              Browse Files
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>

          {/* Selected Images Preview */}
          {images.length > 0 && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-[var(--text-primary)]">
                  Selected Images ({images.length})
                </h2>
                <button
                  onClick={uploadImages}
                  disabled={uploading}
                  className="btn-primary"
                >
                  {uploading ? 'Uploading...' : 'Attach to product'}
                </button>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {images.map(img => (
                  <div key={img.id} className="relative group">
                    <div className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      img.isPrimary ? 'border-[var(--accent)]' : 'border-[var(--border-primary)]'
                    }`}>
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </div>
                    
                    {img.isPrimary && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-[var(--accent)] text-white text-xs font-medium rounded">
                        Primary
                      </span>
                    )}

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!img.isPrimary && (
                        <button
                          onClick={() => setPrimary(img.id)}
                          className="px-2 py-1 bg-white text-black text-xs font-medium rounded hover:bg-gray-200"
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        onClick={() => removeImage(img.id)}
                        className="px-2 py-1 bg-[var(--error)] text-white text-xs font-medium rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {uploadError && (
                <div className="mt-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
                  <p className="text-sm text-[var(--error)]">{uploadError}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Create Model Modal
function CreateModelModal({ 
  initialBrand, 
  initialModel, 
  onClose, 
  onSuccess 
}: { 
  initialBrand: string
  initialModel: string
  onClose: () => void
  onSuccess: (model: ProductModel) => void 
}) {
  const [brand, setBrand] = useState(initialBrand)
  const [model, setModel] = useState(initialModel)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, model })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create model')
      }

      const data = await response.json()
      onSuccess(data.model)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create model')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Create New Model</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Brand</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., Nike"
              required
            />
          </div>
          <div>
            <label>Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g., Air Jordan 1 High OG"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Model'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
