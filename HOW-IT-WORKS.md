# How the Log Parser Works

## Supported Operations

The parser handles three types of file operations:

1. **Read** - Reading existing file content (blue badge)
2. **Write** - Creating new files or overwriting content (green badge)
3. **Edit** - Modifying specific parts of files (amber badge)

Each operation is displayed with:
- Color-coded icon and badge
- Success/error status indicator
- Line count or change summary

---

## Operation Types

### 1. Read Operations

**Input Format:**
```
a:{"toolCallId":"toolu_xxx","toolName":"Read","args":{"file_path":"/path/to/file"},"result":"     1→code\n     2→more code"}
```

**Features:**
- Extracts code from the `result` field
- Removes line number prefixes (1→, 2→, etc.)
- Unescapes special characters (\n, \t, \", etc.)
- Shows exactly what was in the log (doesn't add missing lines)

**Example:**
```
a:{"toolCallId":"toolu_01ABC","toolName":"Read","args":{"file_path":"/src/App.tsx"},"result":"     1→function App() {\n     2→  return <div>Hello</div>;\n     3→}"}
```

**Output:** Clean formatted code with Read badge

---

### 2. Write Operations

**Input Format:**
```
a:{"toolCallId":"toolu_xxx","toolName":"Write","args":{"file_path":"/path/to/file","content":"code content here"},"result":"File created successfully"}
```

**Features:**
- Extracts code from `args.content` field
- Shows complete file content as written
- No line numbers (full content provided)
- Displays success status

**Example:**
```
a:{"toolCallId":"toolu_01WRITE","toolName":"Write","args":{"file_path":"/src/types.ts","content":"export interface User {\n  id: string;\n  name: string;\n}"},"result":"File created successfully"}
```

**Output:** Full file content with Write badge

---

### 3. Edit Operations (Successful)

**Input Format:**
```
a:{"toolCallId":"toolu_xxx","toolName":"Edit","args":{"file_path":"/path","old_string":"old code","new_string":"new code"},"result":"File updated successfully"}
```

**Features:**
- Shows before/after comparison
- Displays old code → new code
- Clear visual separation
- Success indicator

**Example:**
```
a:{"toolCallId":"toolu_01EDIT","toolName":"Edit","args":{"file_path":"/src/config.ts","old_string":"const PORT = 3000;","new_string":"const PORT = 8080;"},"result":"File updated successfully"}
```

**Output:**
```
EDIT OPERATION:

--- OLD CODE ---
const PORT = 3000;

--- NEW CODE ---
const PORT = 8080;

File: /src/config.ts
Status: Success
```

---

### 4. Edit Operations (Failed)

**Input Format:**
```
a:{"toolCallId":"toolu_xxx","toolName":"Edit","args":{"file_path":"/path","old_string":"...","new_string":"..."},"result":{"type":"error","content":"Error message"}}
```

**Features:**
- Displays error message prominently
- Shows attempted changes
- Red error badge
- Helps debug what went wrong

**Example:**
```
a:{"toolCallId":"toolu_01FAIL","toolName":"Edit","args":{"file_path":"/src/index.ts","old_string":"export * from './old';","new_string":"export * from './new';"},"result":{"type":"error","content":"File has not been read yet. Read it first before writing to it."}}
```

**Output:**
```
ERROR: File has not been read yet. Read it first before writing to it.

Attempted to edit:
export * from './old';

With:
export * from './new';
```

---

## Complete Workflow Example

A typical development workflow with multiple operations:

```
a:{"toolCallId":"toolu_01W","toolName":"Write","args":{"file_path":"/src/types.ts","content":"export interface User {\n  id: string;\n}"},"result":"File created"}
9:{"toolCallId":"toolu_01R","toolName":"Read","args":{"file_path":"/src/types.ts"}}
a:{"toolCallId":"toolu_01R","toolName":"Read","result":"     1→export interface User {\n     2→  id: string;\n     3→}"}
9:{"toolCallId":"toolu_01E","toolName":"Edit","args":{"file_path":"/src/types.ts","old_string":"export interface User {\n  id: string;\n}","new_string":"export interface User {\n  id: string;\n  name: string;\n}"}}
a:{"toolCallId":"toolu_01E","toolName":"Edit","args":{"file_path":"/src/types.ts","old_string":"export interface User {\n  id: string;\n}","new_string":"export interface User {\n  id: string;\n  name: string;\n}"},"result":"Updated successfully"}
```

**File Tree Shows:**
- `/src/types.ts` appears 3 times (Write, Read, Edit)
- Each with appropriate colored badge
- Click any to see that specific operation's details

---

## Visual Indicators

### File Tree Icons:
- 👁️ **Blue Eye** - Read operation
- ➕ **Green Plus** - Write operation
- ✏️ **Amber Pencil** - Edit operation
- ✅ **Green Check** - Successful operation (Write/Edit)
- ⚠️ **Red Alert** - Failed operation

### Header Badges:
- **Read** - Blue badge
- **Write** - Green badge
- **Edit** - Amber badge
- **Error** - Red badge

### Status Indicators:
- Green dot - Success
- Red dot - Error

---

## Important Notes

### What the Parser Does:
✅ Extracts all operation types (Read, Write, Edit)
✅ Shows operation-specific formatting
✅ Displays success/error status
✅ Provides before/after for edits
✅ Organizes by directory structure
✅ Color-codes by operation type

### What the Parser Does NOT Do:
❌ Execute the operations
❌ Apply edits to actual files
❌ Merge multiple operations on same file
❌ Reconstruct missing content
❌ Reorder or modify the code

### Key Principle:
**"Visual representation of logged operations"** - The parser shows you exactly what operations were performed and their results, helping you understand the development workflow.
