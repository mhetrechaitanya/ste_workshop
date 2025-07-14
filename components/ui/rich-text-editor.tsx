import { useEffect, useRef, useState } from 'react'
import { FormControl } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder = "Enter description...", className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInitialized = useRef(false)
  const [currentFontSize, setCurrentFontSize] = useState("14")
  const [currentFontColor, setCurrentFontColor] = useState("#000000")
  const [currentFontFamily, setCurrentFontFamily] = useState("Arial")

  const fontSizes = [
    { value: "10", label: "10px" },
    { value: "12", label: "12px" },
    { value: "14", label: "14px" },
    { value: "16", label: "16px" },
    { value: "18", label: "18px" },
    { value: "20", label: "20px" },
    { value: "24", label: "24px" },
    { value: "28", label: "28px" },
    { value: "32", label: "32px" },
    { value: "36", label: "36px" },
  ]

  const fontColors = [
    { value: "#000000", label: "Black", color: "#000000" },
    { value: "#dc2626", label: "Red", color: "#dc2626" },
    { value: "#ea580c", label: "Orange", color: "#ea580c" },
    { value: "#ca8a04", label: "Yellow", color: "#ca8a04" },
    { value: "#16a34a", label: "Green", color: "#16a34a" },
    { value: "#2563eb", label: "Blue", color: "#2563eb" },
    { value: "#7c3aed", label: "Purple", color: "#7c3aed" },
    { value: "#be185d", label: "Pink", color: "#be185d" },
    { value: "#374151", label: "Gray", color: "#374151" },
    { value: "#0891b2", label: "Cyan", color: "#0891b2" },
  ]

  const fontFamilies = [
    { value: "Arial", label: "Arial", family: "Arial, sans-serif" },
    { value: "Helvetica", label: "Helvetica", family: "Helvetica, sans-serif" },
    { value: "Times New Roman", label: "Times New Roman", family: "'Times New Roman', serif" },
    { value: "Georgia", label: "Georgia", family: "Georgia, serif" },
    { value: "Verdana", label: "Verdana", family: "Verdana, sans-serif" },
    { value: "Courier New", label: "Courier New", family: "'Courier New', monospace" },
    { value: "Trebuchet MS", label: "Trebuchet MS", family: "'Trebuchet MS', sans-serif" },
    { value: "Comic Sans MS", label: "Comic Sans MS", family: "'Comic Sans MS', cursive" },
    { value: "Impact", label: "Impact", family: "Impact, sans-serif" },
    { value: "Lucida Console", label: "Lucida Console", family: "'Lucida Console', monospace" },
    { value: "Tahoma", label: "Tahoma", family: "Tahoma, sans-serif" },
    { value: "Palatino", label: "Palatino", family: "Palatino, serif" },
  ]

  useEffect(() => {
    if (!editorRef.current || isInitialized.current) return

    // Initialize the editor content
    if (value) {
      editorRef.current.innerHTML = value
    }
    isInitialized.current = true
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      onChange(content)
    }
  }

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const handleFontSizeChange = (size: string) => {
    setCurrentFontSize(size)
    executeCommand('fontSize', '7') // Set to largest size first
    
    // Apply custom font size using CSS
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (!range.collapsed) {
        const span = document.createElement('span')
        span.style.fontSize = `${size}px`
        try {
          range.surroundContents(span)
        } catch (e) {
          // If range.surroundContents fails, use insertNode
          span.appendChild(range.extractContents())
          range.insertNode(span)
        }
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }
    handleInput()
  }

  const handleFontColorChange = (color: string) => {
    setCurrentFontColor(color)
    executeCommand('foreColor', color)
  }

  const handleFontFamilyChange = (fontFamily: string) => {
    setCurrentFontFamily(fontFamily)
    const fontObj = fontFamilies.find(f => f.value === fontFamily)
    if (fontObj) {
      executeCommand('fontName', fontObj.family)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          executeCommand('bold')
          break
        case 'i':
          e.preventDefault()
          executeCommand('italic')
          break
        case 'u':
          e.preventDefault()
          executeCommand('underline')
          break
      }
    }
  }

  return (
    <div className="border rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50 flex-wrap">
        {/* Font Family Selector */}
        <div className="flex items-center gap-1 mr-2">
          <span className="text-xs text-gray-600 whitespace-nowrap">Font:</span>
          <Select value={currentFontFamily} onValueChange={handleFontFamilyChange}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map((font) => (
                <SelectItem key={font.value} value={font.value} className="text-xs">
                  <span style={{ fontFamily: font.family }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size Selector */}
        <div className="flex items-center gap-1 mr-2">
          <span className="text-xs text-gray-600 whitespace-nowrap">Size:</span>
          <Select value={currentFontSize} onValueChange={handleFontSizeChange}>
            <SelectTrigger className="w-20 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontSizes.map((size) => (
                <SelectItem key={size.value} value={size.value} className="text-xs">
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Color Selector */}
        <div className="flex items-center gap-1 mr-2">
          <span className="text-xs text-gray-600 whitespace-nowrap">Color:</span>
          <Select value={currentFontColor} onValueChange={handleFontColorChange}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue>
                <div className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded border"
                    style={{ backgroundColor: currentFontColor }}
                  />
                  <span className="text-xs">Color</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {fontColors.map((color) => (
                <SelectItem key={color.value} value={color.value} className="text-xs">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color.color }}
                    />
                    {color.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className="p-2 hover:bg-gray-200 rounded text-sm font-bold"
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className="p-2 hover:bg-gray-200 rounded text-sm italic"
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => executeCommand('underline')}
          className="p-2 hover:bg-gray-200 rounded text-sm underline"
          title="Underline (Ctrl+U)"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => executeCommand('strikeThrough')}
          className="p-2 hover:bg-gray-200 rounded text-sm line-through"
          title="Strikethrough"
        >
          S
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
          title="Numbered List"
        >
          1.
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button
          type="button"
          onClick={() => executeCommand('justifyLeft')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
          title="Align Left"
        >
          ⬅
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyCenter')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
          title="Align Center"
        >
          ↔
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyRight')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
          title="Align Right"
        >
          ➡
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button
          type="button"
          onClick={() => executeCommand('createLink', prompt('Enter URL:') || '')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
          title="Insert Link"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={() => executeCommand('unlink')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
          title="Remove Link"
        >
          🔗❌
        </button>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={`min-h-[200px] p-4 focus:outline-none ${className}`}
        style={{ 
          minHeight: '200px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />
      
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}