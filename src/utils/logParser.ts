export interface ParsedFile {
  path: string;
  content: string;
  lineCount: number;
  operation: 'Read' | 'Write' | 'Edit' | 'Other';
  toolName?: string;
  editDetails?: {
    oldString: string;
    newString: string;
  };
  status?: 'success' | 'error';
  errorMessage?: string;
}

export interface ParsedLogResult {
  files: ParsedFile[];
  error?: string;
}

export function parseLogData(logData: string): ParsedLogResult {
  try {
    const files: ParsedFile[] = [];
    const lines = logData.split('\n');

    for (const line of lines) {
      if (line.startsWith('a:')) {
        try {
          const jsonStr = line.substring(2);
          const parsed = JSON.parse(jsonStr);

          const toolName = parsed.toolName || 'Unknown';
          const filePath = parsed.args?.file_path || 'Unknown File';

          if (toolName === 'Read' && parsed.result && typeof parsed.result === 'string') {
            const cleanedContent = cleanLogContent(parsed.result);
            files.push({
              path: filePath,
              content: cleanedContent,
              lineCount: cleanedContent.split('\n').length,
              operation: 'Read',
              toolName,
              status: 'success'
            });
          } else if (toolName === 'Write' && parsed.args?.content) {
            const cleanedContent = cleanLogContent(parsed.args.content);
            files.push({
              path: filePath,
              content: cleanedContent,
              lineCount: cleanedContent.split('\n').length,
              operation: 'Write',
              toolName,
              status: 'success'
            });
          } else if (toolName === 'Edit') {
            if (parsed.result?.type === 'error') {
              const errorContent = parsed.result.content || 'Edit operation failed';
              files.push({
                path: filePath,
                content: `ERROR: ${errorContent}\n\nAttempted to edit:\n${parsed.args?.old_string || 'N/A'}\n\nWith:\n${parsed.args?.new_string || 'N/A'}`,
                lineCount: 5,
                operation: 'Edit',
                toolName,
                status: 'error',
                errorMessage: errorContent,
                editDetails: {
                  oldString: parsed.args?.old_string || '',
                  newString: parsed.args?.new_string || ''
                }
              });
            } else {
              const changeDescription = `EDIT OPERATION:\n\n--- OLD CODE ---\n${parsed.args?.old_string || 'N/A'}\n\n--- NEW CODE ---\n${parsed.args?.new_string || 'N/A'}\n\nFile: ${filePath}\nStatus: Success`;
              files.push({
                path: filePath,
                content: changeDescription,
                lineCount: changeDescription.split('\n').length,
                operation: 'Edit',
                toolName,
                status: 'success',
                editDetails: {
                  oldString: parsed.args?.old_string || '',
                  newString: parsed.args?.new_string || ''
                }
              });
            }
          }
        } catch (e) {
          continue;
        }
      }
    }

    if (files.length === 0) {
      return {
        files: [],
        error: 'No files found in the log data. Please paste log output containing Read, Write, or Edit operations.'
      };
    }

    return { files };
  } catch (error) {
    return {
      files: [],
      error: 'Error parsing log data: ' + (error as Error).message
    };
  }
}

function cleanLogContent(content: string): string {
  let cleaned = content.replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');

  const lines = cleaned.split('\n');
  const processedLines = lines.map(line => {
    const match = line.match(/^\s*\d+→(.*)$/);
    if (match) {
      return match[1];
    }
    return line;
  });

  return processedLines.join('\n').trim();
}

export function getFileName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

export function getFileExtension(path: string): string {
  const fileName = getFileName(path);
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

export function organizeFilesByDirectory(files: ParsedFile[]): Map<string, ParsedFile[]> {
  const organized = new Map<string, ParsedFile[]>();

  for (const file of files) {
    const parts = file.path.split('/');
    const directory = parts.length > 1 ? parts.slice(0, -1).join('/') : 'Root';

    if (!organized.has(directory)) {
      organized.set(directory, []);
    }
    organized.get(directory)!.push(file);
  }

  return organized;
}
