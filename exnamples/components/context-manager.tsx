'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Copy, 
  Check, 
  BookOpen, 
  Code, 
  FileText, 
  Lightbulb, 
  Link,
  Calendar,
  Tag,
  Star,
  Download,
  Upload,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'
import { ContextItem, ContextSearchFilters, ContextExport } from '@/lib/context-types'

interface ContextManagerProps {
  onContextSelect?: (context: ContextItem) => void
}

export function ContextManager({ onContextSelect }: ContextManagerProps) {
  const [contexts, setContexts] = useState<ContextItem[]>([])
  const [filteredContexts, setFilteredContexts] = useState<ContextItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<ContextSearchFilters>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContext, setEditingContext] = useState<ContextItem | null>(null)
  const [copied, setCopied] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  // フォーム状態
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'note' as ContextItem['type'],
    category: '',
    tags: '',
    priority: 'medium' as ContextItem['priority'],
    relatedFiles: ''
  })

  useEffect(() => {
    loadContexts()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [contexts, searchTerm, filters])

  const loadContexts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/context')
      const data = await response.json()
      setContexts(data.items || [])
    } catch (error) {
      console.error('Error loading contexts:', error)
      toast.error('Failed to load contexts')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = contexts

    // 検索語フィルター
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(term) ||
        item.content.toLowerCase().includes(term) ||
        item.tags.some(tag => tag.toLowerCase().includes(term))
      )
    }

    // その他のフィルター
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(item => filters.type!.includes(item.type))
    }

    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(item => filters.category!.includes(item.category))
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(item => filters.priority!.includes(item.priority))
    }

    if (filters.isActive !== undefined) {
      filtered = filtered.filter(item => item.isActive === filters.isActive)
    }

    setFilteredContexts(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required')
      return
    }

    try {
      const contextData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        relatedFiles: formData.relatedFiles.split(',').map(file => file.trim()).filter(Boolean)
      }

      const url = editingContext ? `/api/context/${editingContext.id}` : '/api/context'
      const method = editingContext ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contextData)
      })

      if (response.ok) {
        toast.success(editingContext ? 'Context updated successfully!' : 'Context created successfully!')
        setIsDialogOpen(false)
        resetForm()
        loadContexts()
      } else {
        throw new Error('Failed to save context')
      }
    } catch (error) {
      console.error('Error saving context:', error)
      toast.error('Failed to save context')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this context?')) return

    try {
      const response = await fetch(`/api/context/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Context deleted successfully!')
        loadContexts()
      } else {
        throw new Error('Failed to delete context')
      }
    } catch (error) {
      console.error('Error deleting context:', error)
      toast.error('Failed to delete context')
    }
  }

  const handleEdit = (context: ContextItem) => {
    setEditingContext(context)
    setFormData({
      title: context.title,
      content: context.content,
      type: context.type,
      category: context.category,
      tags: context.tags.join(', '),
      priority: context.priority,
      relatedFiles: context.relatedFiles?.join(', ') || ''
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'note',
      category: '',
      tags: '',
      priority: 'medium',
      relatedFiles: ''
    })
    setEditingContext(null)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Content copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const exportContexts = async () => {
    try {
      const response = await fetch('/api/context/export')
      const data: ContextExport = await response.json()
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `context-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Context data exported successfully!')
    } catch (error) {
      console.error('Error exporting contexts:', error)
      toast.error('Failed to export context data')
    }
  }

  const importContexts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data: ContextExport = JSON.parse(text)
      
      const response = await fetch('/api/context/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Imported ${result.imported} new contexts!`)
        loadContexts()
      } else {
        throw new Error('Failed to import context data')
      }
    } catch (error) {
      console.error('Error importing contexts:', error)
      toast.error('Failed to import context data')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rule': return <Code className="h-4 w-4" />
      case 'documentation': return <FileText className="h-4 w-4" />
      case 'snippet': return <Code className="h-4 w-4" />
      case 'note': return <Lightbulb className="h-4 w-4" />
      case 'reference': return <Link className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Context Manager</h1>
          <p className="text-muted-foreground">Manage your development context and knowledge base</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Import/Export
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import/Export Context Data</DialogTitle>
                <DialogDescription>
                  Export your context data or import from a backup file
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Export Context Data</h3>
                  <Button onClick={exportContexts} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export All Contexts
                  </Button>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Import Context Data</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept=".json"
                      onChange={importContexts}
                      className="hidden"
                      id="import-file"
                    />
                    <label htmlFor="import-file" className="cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to select JSON file</p>
                    </label>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Context
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingContext ? 'Edit Context' : 'Add New Context'}
                </DialogTitle>
                <DialogDescription>
                  Create or edit a context item to store important information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter title"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as ContextItem['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rule">Rule</SelectItem>
                        <SelectItem value="documentation">Documentation</SelectItem>
                        <SelectItem value="snippet">Snippet</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                        <SelectItem value="reference">Reference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Enter category"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value as ContextItem['priority'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Tags (comma-separated)</label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Enter tags"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Related Files (comma-separated)</label>
                  <Input
                    value={formData.relatedFiles}
                    onChange={(e) => setFormData({ ...formData, relatedFiles: e.target.value })}
                    placeholder="Enter related files"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter content"
                    rows={8}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingContext ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search contexts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={filters.type?.[0] || ''}
              onValueChange={(value) => setFilters({ ...filters, type: value ? [value] : undefined })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="rule">Rule</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="snippet">Snippet</SelectItem>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="reference">Reference</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.priority?.[0] || ''}
              onValueChange={(value) => setFilters({ ...filters, priority: value ? [value] : undefined })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Context List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredContexts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No contexts found</h3>
                <p className="text-muted-foreground">Create your first context item to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredContexts.map((context) => (
              <Card key={context.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(context.type)}
                      <div>
                        <CardTitle className="text-lg">{context.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{context.type}</Badge>
                          <Badge variant="outline">{context.category}</Badge>
                          <Badge className={getPriorityColor(context.priority)}>
                            {context.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(context.content)}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(context)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(context.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {context.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(context.updatedAt).toLocaleDateString()}
                      </div>
                      {context.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {context.tags.slice(0, 3).join(', ')}
                          {context.tags.length > 3 && ` +${context.tags.length - 3}`}
                        </div>
                      )}
                    </div>
                    {onContextSelect && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onContextSelect(context)}
                      >
                        Use Context
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 