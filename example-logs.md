# Example Log Data for Testing

## Example 1: Read Operation (Complete File)
```
a:{"toolCallId":"toolu_01ABC","toolName":"Read","args":{"file_path":"/src/components/Button.tsx"},"result":"     1→import React from 'react';\n     2→\n     3→export function Button({ text }: { text: string }) {\n     4→  return <button>{text}</button>;\n     5→}"}
```

**Badge:** Read (Blue)
**Output:** All 5 lines preserved in correct order with proper formatting.

---

## Example 2: Write Operation (Creating New File)
```
a:{"toolCallId":"toolu_01WRITE","toolName":"Write","args":{"file_path":"/src/components/Card.tsx","content":"import React from 'react';\n\nexport function Card({ children }: { children: React.ReactNode }) {\n  return (\n    <div className='card'>\n      {children}\n    </div>\n  );\n}"},"result":"File created successfully at: /src/components/Card.tsx"}
```

**Badge:** Write (Green)
**Output:** New file content shown exactly as written. No line numbers needed since it's the full content.

---

## Example 3: Edit Operation (Successful)
```
a:{"toolCallId":"toolu_01EDIT","toolName":"Edit","args":{"file_path":"/src/config.ts","old_string":"export const VERSION = '1.0.0';","new_string":"export const VERSION = '2.0.0';"},"result":"The file /src/config.ts has been updated successfully."}
```

**Badge:** Edit (Amber)
**Output:** Shows both old and new code with clear before/after sections.

---

## Example 4: Edit Operation (Failed - File Not Read)
```
a:{"toolCallId":"toolu_01EDITFAIL","toolName":"Edit","args":{"file_path":"/components/index.ts","old_string":"export * from './Button';","new_string":"export * from './Button';\nexport * from './Card';"},"result":{"type":"error","content":"File has not been read yet. Read it first before writing to it."}}
```

**Badge:** Edit (Amber) + Error (Red)
**Output:** Error message with attempted changes shown.

---

## Example 5: Complete Workflow (Read → Edit)
```
9:{"toolCallId":"toolu_01READ","toolName":"Read","args":{"file_path":"/src/utils/constants.ts"}}
a:{"toolCallId":"toolu_01READ","toolName":"Read","result":"     1→export const API_URL = 'https://api.example.com';\n     2→export const TIMEOUT = 3000;"}
9:{"toolCallId":"toolu_01EDIT","toolName":"Edit","args":{"file_path":"/src/utils/constants.ts","old_string":"export const TIMEOUT = 3000;","new_string":"export const TIMEOUT = 5000;"}}
a:{"toolCallId":"toolu_01EDIT","toolName":"Edit","args":{"file_path":"/src/utils/constants.ts","old_string":"export const TIMEOUT = 3000;","new_string":"export const TIMEOUT = 5000;"},"result":"The file has been updated successfully."}
```

**Output:**
- First entry: Read operation showing original file
- Second entry: Edit operation showing the change from 3000 to 5000

---

## Example 6: Multiple Operations on Different Files
```
a:{"toolCallId":"toolu_01W1","toolName":"Write","args":{"file_path":"/src/types.ts","content":"export interface User {\n  id: string;\n  name: string;\n}"},"result":"File created successfully"}
a:{"toolCallId":"toolu_01W2","toolName":"Write","args":{"file_path":"/src/api.ts","content":"export async function fetchUser(id: string) {\n  return fetch(`/api/users/${id}`);\n}"},"result":"File created successfully"}
9:{"toolCallId":"toolu_01R1","toolName":"Read","args":{"file_path":"/src/config.ts"}}
a:{"toolCallId":"toolu_01R1","toolName":"Read","result":"     1→export const API_URL = 'https://api.example.com';"}
```

**Output:** Three separate files in the tree with appropriate badges (Write, Write, Read)
