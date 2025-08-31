'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

interface TableSchema {
  name: string
  type: string
  mode: string
}

interface TableData {
  [key: string]: any
}

interface TableInfo {
  name: string
  rowCount: number
  schema: TableSchema[]
}

export default function AdminPage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [tableData, setTableData] = useState<TableData[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<TableData>({})
  const [newRowForm, setNewRowForm] = useState<TableData>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage] = useState(50)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchTables()
  }, [])

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable)
    }
  }, [selectedTable, currentPage])

  const fetchTables = async () => {
    try {
      setError(null)
      const response = await fetch('/api/admin/tables')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setTables(data)
      if (data.length > 0) {
        setSelectedTable(data[0].name)
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
      setError('Failed to fetch tables. Please check your BigQuery connection.')
    }
  }

  const fetchTableData = async (tableName: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/tables/${tableName}?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setTableData(data.rows)
      setTotalPages(Math.ceil(data.total / itemsPerPage))
      setSelectedRows(new Set()) // Clear selection when changing tables
    } catch (error) {
      console.error('Error fetching table data:', error)
      setError(`Failed to fetch data from ${tableName} table.`)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (index: number) => {
    setEditingRow(index)
    setEditForm({ ...tableData[index] })
  }

  const handleSave = async () => {
    if (editingRow === null) return

    try {
      setError(null)
      const response = await fetch(`/api/admin/tables/${selectedTable}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          where: { id: editForm.id },
          data: editForm
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setTableData(prev => prev.map((row, index) => 
        index === editingRow ? editForm : row
      ))
      setEditingRow(null)
      setEditForm({})
      setSuccess('Row updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error updating row:', error)
      setError('Failed to update row. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this row?')) return

    try {
      setError(null)
      const response = await fetch(`/api/admin/tables/${selectedTable}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ where: { id } })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setTableData(prev => prev.filter(row => row.id !== id))
      setSuccess('Row deleted successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error deleting row:', error)
      setError('Failed to delete row. Please try again.')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedRows.size} selected rows?`)) return

    try {
      setError(null)
      setLoading(true)
      
      // Delete each selected row
      for (const id of selectedRows) {
        const response = await fetch(`/api/admin/tables/${selectedTable}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ where: { id } })
        })

        if (!response.ok) {
          throw new Error(`Failed to delete row ${id}`)
        }
      }

      // Refresh table data
      await fetchTableData(selectedTable)
      setSelectedRows(new Set())
      setSuccess(`${selectedRows.size} rows deleted successfully!`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error bulk deleting rows:', error)
      setError('Failed to delete some rows. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddRow = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/admin/tables/${selectedTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRowForm)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const newRow = await response.json()
      setTableData(prev => [newRow, ...prev])
      setNewRowForm({})
      setSuccess('New row added successfully!')
      setTimeout(() => setSuccess(null), 3000)
      fetchTableData(selectedTable)
    } catch (error) {
      console.error('Error adding row:', error)
      setError('Failed to add new row. Please check required fields.')
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchTableData(selectedTable)
  }

  const handleSelectAll = () => {
    if (selectedRows.size === tableData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(tableData.map(row => row.id)))
    }
  }

  const handleSelectRow = (id: string) => {
    const newSelection = new Set(selectedRows)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedRows(newSelection)
  }

  const renderFieldEditor = (field: TableSchema, value: any, onChange: (value: any) => void) => {
    const fieldName = field.name

    switch (field.type) {
      case 'BOOL':
        return (
          <Select value={value?.toString()} onValueChange={(val) => onChange(val === 'true')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        )
      case 'INT64':
      case 'FLOAT64':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            placeholder={fieldName}
          />
        )
      case 'TIMESTAMP':
        return (
          <Input
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
            placeholder={fieldName}
          />
        )
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder={fieldName}
          />
        )
    }
  }

  const getTableSchema = () => {
    return tables.find(t => t.name === selectedTable)?.schema || []
  }

  const clearForms = () => {
    setNewRowForm({})
    setEditForm({})
    setEditingRow(null)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">BigQuery Admin Panel</h1>
          <p className="text-muted-foreground mt-1">
            Manage your BigQuery tables and data
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary">
            {tables.length} Tables
          </Badge>
          <Button onClick={fetchTables} variant="outline">
            Refresh Tables
          </Button>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map((table) => (
          <Card key={table.name} className="p-4 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{table.rowCount}</div>
              <div className="text-sm text-muted-foreground capitalize">{table.name}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Table Tabs */}
      <Tabs value={selectedTable} onValueChange={(table) => {
        setSelectedTable(table)
        clearForms()
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {tables.map((table) => (
            <TabsTrigger key={table.name} value={table.name} className="text-xs">
              {table.name}
              <Badge variant="outline" className="ml-2">
                {table.rowCount}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {tables.map((table) => (
          <TabsContent key={table.name} value={table.name} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <span>{table.name} Table</span>
                  <Button onClick={() => fetchTableData(table.name)}>
                    Refresh Data
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Pagination */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch}>Search</Button>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>

                {/* Bulk Operations */}
                {selectedRows.size > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <span className="text-blue-700 font-medium">
                        {selectedRows.size} row(s) selected
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={loading}
                      >
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                )}

                {/* Add New Row Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Row</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getTableSchema().map((field) => (
                        <div key={field.name} className="space-y-2">
                          <Label htmlFor={`new-${field.name}`}>
                            {field.name}
                            {field.mode === 'REQUIRED' && <span className="text-red-500">*</span>}
                          </Label>
                          {renderFieldEditor(
                            field,
                            newRowForm[field.name],
                            (value) => setNewRowForm(prev => ({ ...prev, [field.name]: value }))
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleAddRow}>
                        Add Row
                      </Button>
                      <Button variant="outline" onClick={() => setNewRowForm({})}>
                        Clear Form
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Table Data */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-lg text-muted-foreground">Loading...</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="px-4 py-3 text-left text-sm font-medium">
                            <input
                              type="checkbox"
                              checked={selectedRows.size === tableData.length && tableData.length > 0}
                              onChange={handleSelectAll}
                              className="rounded"
                            />
                          </th>
                          {getTableSchema().map((field) => (
                            <th key={field.name} className="px-4 py-3 text-left text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <span>{field.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {field.type}
                                </Badge>
                              </div>
                            </th>
                          ))}
                          <th className="px-4 py-3 text-left text-sm font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, index) => (
                          <tr key={row.id || index} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedRows.has(row.id)}
                                onChange={() => handleSelectRow(row.id)}
                                className="rounded"
                              />
                            </td>
                            {getTableSchema().map((field) => (
                              <td key={field.name} className="px-4 py-3">
                                {editingRow === index ? (
                                  <div className="min-w-[120px]">
                                    {renderFieldEditor(
                                      field,
                                      editForm[field.name],
                                      (value) => setEditForm(prev => ({ ...prev, [field.name]: value }))
                                    )}
                                  </div>
                                ) : (
                                  <div className="max-w-[200px] truncate" title={String(row[field.name] || '')}>
                                    {field.type === 'TIMESTAMP' && row[field.name]
                                      ? new Date(row[field.name]).toLocaleString()
                                      : String(row[field.name] || '')}
                                  </div>
                                )}
                              </td>
                            ))}
                            <td className="px-4 py-3">
                              {editingRow === index ? (
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleSave}>
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingRow(null)
                                      setEditForm({})
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleEdit(index)}>
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(row.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {tableData.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    No data found in this table
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
