"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Copy } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import yaml from 'js-yaml'
import Papa from 'papaparse'

// Note: You'll need to install these packages:
// npm install js-yaml papaparse
// import yaml from 'js-yaml'
// import Papa from 'papaparse'

function JsonView({ data, level = 0 }: { data: any; level?: number }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const indent = "  ".repeat(level)

  if (Array.isArray(data)) {
    if (data.length === 0) return <span>[]</span>
    return (
      <div>
        <span
          className="cursor-pointer hover:text-blue-500"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? "▶ [...]" : "▼ ["}
        </span>
        {!isCollapsed && (
          <>
            <div className="ml-4">
              {data.map((item, index) => (
                <div key={index}>
                  <JsonView data={item} level={level + 1} />
                  {index < data.length - 1 && ","}
                </div>
              ))}
            </div>
            {indent}]
          </>
        )}
      </div>
    )
  }

  if (typeof data === "object" && data !== null) {
    const entries = Object.entries(data)
    if (entries.length === 0) return <span>{"{}"}</span>
    return (
      <div>
        <span
          className="cursor-pointer hover:text-blue-500"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? "▶ {...}" : "▼ {"}
        </span>
        {!isCollapsed && (
          <>
            <div className="ml-4">
              {entries.map(([key, value], index) => (
                <div key={key}>
                  <span className="text-blue-500">"{key}"</span>:{" "}
                  <JsonView data={value} level={level + 1} />
                  {index < entries.length - 1 && ","}
                </div>
              ))}
            </div>
            {indent}{"}"}
          </>
        )}
      </div>
    )
  }

  return (
    <span>
      {typeof data === "string"
        ? `"${data}"`
        : typeof data === "undefined"
          ? "undefined"
          : String(data)}
    </span>
  )
}

interface JsonError {
  line: number
  column: number
  message: string
}

function getJsonErrorDetails(jsonString: string, error: Error): JsonError {
  const lines = jsonString.split('\n')
  const match = error.message.match(/at position (\d+)/)

  if (!match) {
    return {
      line: 1,
      column: 1,
      message: error.message
    }
  }

  const position = parseInt(match[1])
  let line = 1
  let column = position

  for (let i = 0; i < lines.length; i++) {
    if (column > lines[i].length + 1) { // +1 for newline
      column -= lines[i].length + 1
      line++
    } else {
      break
    }
  }

  // Clean up the error message
  let message = error.message
    .replace(/at position \d+/, '')
    .replace('JSON.parse: ', '')
    .trim()

  return { line, column, message }
}

// Function to convert JSON to YAML
const jsonToYaml = (jsonData: any): string => {
  try {
    return yaml.dump(jsonData, { indent: 2 });
  } catch (error) {
    console.error('Error converting JSON to YAML:', error);
    return 'Error converting to YAML';
  }
};

// Function to convert JSON to CSV
const jsonToCsv = (jsonData: any): string => {
  try {
    // Handle non-array data by wrapping it in an array
    const data = Array.isArray(jsonData) ? jsonData : [jsonData];
    
    // Check if data is suitable for CSV conversion (array of objects)
    if (!data.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
      return 'Cannot convert to CSV: Data must be an array of objects';
    }
    
    return Papa.unparse(data);
  } catch (error) {
    console.error('Error converting JSON to CSV:', error);
    return 'Error converting to CSV';
  }
};

// Function to query JSON with path
const queryJsonPath = (jsonData: any, path: string): any => {
  try {
    if (!path) return jsonData;
    
    // Split the path by dots or brackets
    const segments = path.split(/\.|\[|\]/).filter(Boolean);
    let result = jsonData;
    
    for (const segment of segments) {
      // Handle array indices
      if (!isNaN(Number(segment))) {
        result = result[Number(segment)];
      } else {
        result = result[segment];
      }
      
      // Stop if we hit undefined
      if (result === undefined) break;
    }
    
    return result;
  } catch (error) {
    console.error('Error querying JSON path:', error);
    return 'Error querying JSON path';
  }
};

// 可编辑的JSON视图组件
const EditableJsonView = ({ 
  data, 
  onUpdate 
}: { 
  data: any; 
  onUpdate: (newData: any) => void 
}) => {
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [editingKeyPath, setEditingKeyPath] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);

  // 开始编辑值
  const startEditing = (path: string, value: any) => {
    setEditingPath(path);
    setEditingValue(JSON.stringify(value));
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  // 开始编辑键名
  const startEditingKey = (path: string, key: string) => {
    setEditingKeyPath(path);
    setEditingKey(key);
    setTimeout(() => {
      keyInputRef.current?.focus();
      keyInputRef.current?.select();
    }, 0);
  };

  // 完成编辑值
  const finishEditing = () => {
    if (!editingPath) return;

    try {
      // 解析编辑后的值
      const newValue = JSON.parse(editingValue);
      
      // 更新数据
      const pathParts = editingPath.split('.');
      const newData = JSON.parse(JSON.stringify(data)); // 深拷贝
      
      let current = newData;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (part.includes('[')) {
          // 处理数组
          const arrayName = part.split('[')[0];
          const index = parseInt(part.split('[')[1].replace(']', ''));
          current = current[arrayName][index];
        } else {
          current = current[part];
        }
      }
      
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart.includes('[')) {
        // 处理数组
        const arrayName = lastPart.split('[')[0];
        const index = parseInt(lastPart.split('[')[1].replace(']', ''));
        current[arrayName][index] = newValue;
      } else {
        current[lastPart] = newValue;
      }
      
      onUpdate(newData);
    } catch (e) {
      console.error('Invalid JSON value:', e);
    }
    
    setEditingPath(null);
  };

  // 完成编辑键名
  const finishEditingKey = () => {
    if (!editingKeyPath) return;

    try {
      // 不允许空键名
      if (!editingKey.trim()) {
        throw new Error("Key cannot be empty");
      }
      
      // 更新数据
      const pathParts = editingKeyPath.split('.');
      const oldKey = pathParts[pathParts.length - 1];
      const newData = JSON.parse(JSON.stringify(data)); // 深拷贝
      
      let current = newData;
      let parent = null;
      
      // 找到父对象
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        parent = current;
        if (part.includes('[')) {
          // 处理数组
          const arrayName = part.split('[')[0];
          const index = parseInt(part.split('[')[1].replace(']', ''));
          current = current[arrayName][index];
        } else {
          current = current[part];
        }
      }
      
      // 如果到达这里，current是父对象，oldKey是旧键名
      if (parent === null) {
        // 如果是根级别的键，保持顺序
        const orderedObj: Record<string, any> = {};
        const keys = Object.keys(newData);
        const oldKeyIndex = keys.indexOf(oldKey);
        
        // 按原顺序重建对象，但用新键名替换旧键名
        keys.forEach((key, index) => {
          if (index === oldKeyIndex) {
            orderedObj[editingKey] = newData[oldKey];
          } else {
            orderedObj[key] = newData[key];
          }
        });
        
        // 用保持顺序的新对象替换原对象
        onUpdate(orderedObj);
      } else {
        // 如果是嵌套对象，保持顺序
        const orderedObj: Record<string, any> = {};
        const keys = Object.keys(current);
        const oldKeyIndex = keys.indexOf(oldKey);
        
        // 按原顺序重建对象，但用新键名替换旧键名
        keys.forEach((key, index) => {
          if (index === oldKeyIndex) {
            orderedObj[editingKey] = current[oldKey];
          } else {
            orderedObj[key] = current[key];
          }
        });
        
        // 用保持顺序的新对象替换原对象
        if (parent === null) {
          onUpdate(orderedObj);
        } else {
          // 找到父对象中的正确位置
          const lastPathPart = pathParts[pathParts.length - 2];
          if (lastPathPart.includes('[')) {
            const arrayName = lastPathPart.split('[')[0];
            const index = parseInt(lastPathPart.split('[')[1].replace(']', ''));
            parent[arrayName][index] = orderedObj;
          } else {
            parent[lastPathPart] = orderedObj;
          }
          onUpdate(newData);
        }
      }
    } catch (e) {
      console.error('Error updating key:', e);
    }
    
    setEditingKeyPath(null);
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingPath(null);
    setEditingKeyPath(null);
  };

  // 处理值编辑的键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      finishEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // 处理键名编辑的键盘事件
  const handleKeyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      finishEditingKey();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // 渲染JSON值
  const renderValue = (value: any, path: string) => {
    if (editingPath === path) {
      return (
        <input
          ref={inputRef}
          type="text"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={finishEditing}
          onKeyDown={handleKeyDown}
          className="bg-blue-50 px-1 rounded border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{ width: `${Math.max(editingValue.length * 8, 60)}px` }}
        />
      );
    }

    if (typeof value === 'string') {
      return (
        <span 
          className="text-green-600 cursor-pointer hover:bg-blue-50" 
          onClick={() => startEditing(path, value)}
        >
          "{value}"
        </span>
      );
    }
    
    if (typeof value === 'number') {
      return (
        <span 
          className="text-blue-600 cursor-pointer hover:bg-blue-50" 
          onClick={() => startEditing(path, value)}
        >
          {value}
        </span>
      );
    }
    
    if (typeof value === 'boolean') {
      return (
        <span 
          className="text-purple-600 cursor-pointer hover:bg-blue-50" 
          onClick={() => startEditing(path, value)}
        >
          {String(value)}
        </span>
      );
    }
    
    if (value === null) {
      return (
        <span 
          className="text-gray-600 cursor-pointer hover:bg-blue-50" 
          onClick={() => startEditing(path, value)}
        >
          null
        </span>
      );
    }
    
    return null;
  };

  // 渲染键名
  const renderKey = (key: string, path: string) => {
    if (editingKeyPath === path) {
      return (
        <input
          ref={keyInputRef}
          type="text"
          value={editingKey}
          onChange={(e) => setEditingKey(e.target.value)}
          onBlur={finishEditingKey}
          onKeyDown={handleKeyKeyDown}
          className="bg-blue-50 px-1 rounded border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{ width: `${Math.max(editingKey.length * 8, 60)}px` }}
        />
      );
    }

    return (
      <span 
        className="text-blue-500 cursor-pointer hover:bg-blue-50" 
        onClick={() => startEditingKey(path, key)}
      >
        "{key}"
      </span>
    );
  };

  // 递归渲染JSON对象
  const renderJsonObject = (obj: any, path = "", level = 0) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const indent = "  ".repeat(level);
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return <span>[]</span>;
      
      return (
        <div>
          <span
            className="cursor-pointer hover:text-blue-500"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? "▶ [...]" : "▼ ["}
          </span>
          {!isCollapsed && (
            <>
              <div className="ml-4">
                {obj.map((item, index) => (
                  <div key={index}>
                    {typeof item === 'object' && item !== null ? (
                      renderJsonObject(item, `${path}[${index}]`, level + 1)
                    ) : (
                      renderValue(item, `${path}[${index}]`)
                    )}
                    {index < obj.length - 1 && ","}
                  </div>
                ))}
              </div>
              {indent}]
            </>
          )}
        </div>
      );
    }

    if (typeof obj === 'object' && obj !== null) {
      const entries = Object.entries(obj);
      if (entries.length === 0) return <span>{"{}"}</span>;
      
      return (
        <div>
          <span
            className="cursor-pointer hover:text-blue-500"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? "▶ {...}" : "▼ {"}
          </span>
          {!isCollapsed && (
            <>
              <div className="ml-4">
                {entries.map(([key, value], index) => (
                  <div key={key}>
                    {renderKey(key, path ? `${path}.${key}` : key)}:{" "}
                    {typeof value === 'object' && value !== null ? (
                      renderJsonObject(value, path ? `${path}.${key}` : key, level + 1)
                    ) : (
                      renderValue(value, path ? `${path}.${key}` : key)
                    )}
                    {index < entries.length - 1 && ","}
                  </div>
                ))}
              </div>
              {indent}{"}"}
            </>
          )}
        </div>
      );
    }

    return renderValue(obj, path);
  };

  return (
    <div className="font-mono text-sm">
      {renderJsonObject(data)}
    </div>
  );
};

export default function JsonFormatter() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState<any>(null)
  const [error, setError] = useState<JsonError | null>(null)
  const [activeTab, setActiveTab] = useState("format")
  const [jsonPath, setJsonPath] = useState("")
  const [yamlOutput, setYamlOutput] = useState("")
  const [csvOutput, setCsvOutput] = useState("")
  const [pathQueryResult, setPathQueryResult] = useState<any>(null)

  const formatJson = (value: string) => {
    if (!value.trim()) {
      setOutput(null)
      setError(null)
      setYamlOutput("")
      setCsvOutput("")
      setPathQueryResult(null)
      return
    }

    try {
      const parsed = JSON.parse(value)
      setOutput(parsed)
      setError(null)
      
      // 生成YAML和CSV
      setYamlOutput(jsonToYaml(parsed))
      setCsvOutput(jsonToCsv(parsed))
      
      // 更新路径查询结果
      if (jsonPath) {
        setPathQueryResult(queryJsonPath(parsed, jsonPath))
      }
    } catch (e) {
      if (e instanceof Error) {
        const errorDetails = getJsonErrorDetails(value, e)
        setError(errorDetails)
      }
      setOutput(null)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInput(newValue)
    formatJson(newValue)
  }

  // 处理JSON更新
  const handleJsonUpdate = (newData: any) => {
    try {
      const formatted = JSON.stringify(newData, null, 2)
      setInput(formatted)
      setOutput(newData)
      
      // 更新其他格式
      setYamlOutput(jsonToYaml(newData))
      setCsvOutput(jsonToCsv(newData))
      
      // 更新路径查询结果
      if (jsonPath) {
        setPathQueryResult(queryJsonPath(newData, jsonPath))
      }
    } catch (e) {
      console.error('Error updating JSON:', e)
    }
  }

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = e.target.value
    setJsonPath(newPath)
    
    // 更新查询结果
    if (output) {
      setPathQueryResult(queryJsonPath(output, newPath))
    }
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        alert('Copied to clipboard!')
      })
      .catch(err => {
        console.error('Failed to copy:', err)
      })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">JSON Formatter</h1>
        <p className="text-muted-foreground">Format, validate, and convert JSON data</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="mb-2 flex justify-between items-center">
            <Label>Input JSON</Label>
          </div>
          <Textarea
            placeholder="Paste your JSON here..."
            className="min-h-[700px] max-h-[700px] font-mono custom-scrollbar"
            value={input}
            onChange={handleInputChange}
          />
        </Card>
        <Card className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="format">Format</TabsTrigger>
              <TabsTrigger value="yaml">YAML</TabsTrigger>
              <TabsTrigger value="csv">CSV</TabsTrigger>
              <TabsTrigger value="query">Query</TabsTrigger>
            </TabsList>
            
            <TabsContent value="format">
              {error ? (
                <div className="space-y-2">
                  <p className="text-destructive font-medium">JSON Syntax Error</p>
                  <div className="text-sm space-y-1">
                    <p>Line {error.line}, Column {error.column}</p>
                    <p className="text-muted-foreground">{error.message}</p>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto custom-scrollbar">
                      {input.split('\n')[error.line - 1]}
                      {'\n'}
                      {' '.repeat(error.column - 1)}^
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Formatted JSON (click keys and values to edit)</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(JSON.stringify(output, null, 2))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="min-h-[650px] max-h-[650px] overflow-auto custom-scrollbar border rounded-md p-4">
                    {output && (
                      <EditableJsonView 
                        data={output} 
                        onUpdate={handleJsonUpdate} 
                      />
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="yaml">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-0 h-8 w-8"
                  onClick={() => copyToClipboard(yamlOutput)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Textarea
                  readOnly
                  value={yamlOutput}
                  className="min-h-[650px] max-h-[650px] font-mono custom-scrollbar"
                  placeholder="YAML output will appear here..."
                />
              </div>
            </TabsContent>
            
            <TabsContent value="csv">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-0 h-8 w-8"
                  onClick={() => copyToClipboard(csvOutput)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Textarea
                  readOnly
                  value={csvOutput}
                  className="min-h-[650px] max-h-[650px] font-mono custom-scrollbar"
                  placeholder="CSV output will appear here..."
                />
              </div>
            </TabsContent>
            
            <TabsContent value="query">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="json-path">JSON Path</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="json-path"
                      placeholder="e.g. data.users[0].name"
                      value={jsonPath}
                      onChange={handlePathChange}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use dot notation (e.g., user.address) or brackets (e.g., users[0]) to query JSON
                  </p>
                </div>
                
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-0 h-8 w-8"
                    onClick={() => copyToClipboard(JSON.stringify(pathQueryResult, null, 2))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <div className="font-mono min-h-[550px] max-h-[550px] text-sm overflow-auto custom-scrollbar border rounded-md p-4">
                    {pathQueryResult !== null && (
                      <EditableJsonView 
                        data={pathQueryResult} 
                        onUpdate={(newData) => setPathQueryResult(newData)} 
                      />
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}