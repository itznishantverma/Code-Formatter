export interface FormatResult {
  formattedCode: string;
  language: string;
  error?: string;
}

export function detectLanguage(code: string): string {
  const trimmedCode = code.trim();

  if (trimmedCode.startsWith('{') || trimmedCode.startsWith('[')) {
    try {
      JSON.parse(trimmedCode);
      return 'JSON';
    } catch {
      return 'JavaScript';
    }
  }

  if (trimmedCode.startsWith('<!DOCTYPE') || trimmedCode.startsWith('<html') || /<[a-z][\s\S]*>/i.test(trimmedCode)) {
    return 'HTML';
  }

  if (trimmedCode.includes('def ') || trimmedCode.includes('import ') && trimmedCode.includes('from ')) {
    return 'Python';
  }

  if (trimmedCode.includes('function ') || trimmedCode.includes('=>') || trimmedCode.includes('const ') || trimmedCode.includes('let ')) {
    return 'JavaScript';
  }

  if (trimmedCode.includes('@media') || trimmedCode.includes('px') || /\.[a-z-]+\s*\{/.test(trimmedCode)) {
    return 'CSS';
  }

  return 'Unknown';
}

export function unescapeString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');
}

export function formatCode(rawCode: string): FormatResult {
  if (!rawCode.trim()) {
    return {
      formattedCode: '',
      language: 'Unknown',
      error: 'Please enter some code to format'
    };
  }

  try {
    const unescapedCode = unescapeString(rawCode);
    const language = detectLanguage(unescapedCode);

    let formattedCode = unescapedCode;

    if (language === 'JSON') {
      try {
        const parsed = JSON.parse(unescapedCode);
        formattedCode = JSON.stringify(parsed, null, 2);
      } catch {
        formattedCode = unescapedCode;
      }
    } else if (language === 'HTML') {
      formattedCode = formatHTML(unescapedCode);
    } else if (language === 'CSS') {
      formattedCode = formatCSS(unescapedCode);
    } else {
      formattedCode = formatGenericCode(unescapedCode);
    }

    return {
      formattedCode,
      language
    };
  } catch (error) {
    return {
      formattedCode: rawCode,
      language: 'Unknown',
      error: 'Error formatting code: ' + (error as Error).message
    };
  }
}

function formatHTML(code: string): string {
  let formatted = '';
  let indentLevel = 0;
  const indentSize = 2;
  const indent = () => ' '.repeat(indentLevel * indentSize);

  const tags = code.match(/<[^>]+>|[^<]+/g) || [];

  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('</')) {
      indentLevel = Math.max(0, indentLevel - 1);
      formatted += indent() + trimmed + '\n';
    } else if (trimmed.startsWith('<')) {
      formatted += indent() + trimmed + '\n';
      if (!trimmed.endsWith('/>') && !trimmed.match(/<(br|img|input|hr|meta|link)[^>]*>/i)) {
        indentLevel++;
      }
    } else {
      formatted += indent() + trimmed + '\n';
    }
  }

  return formatted.trim();
}

function formatCSS(code: string): string {
  let formatted = '';
  let indentLevel = 0;
  const indentSize = 2;
  const indent = () => ' '.repeat(indentLevel * indentSize);

  const lines = code.split(/[{;}]/).filter(line => line.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (code.indexOf(line) < code.indexOf('{', code.indexOf(line))) {
      formatted += indent() + line + ' {\n';
      indentLevel++;
    } else {
      formatted += indent() + line + ';\n';
      if (i === lines.length - 1 || code.indexOf('}', code.indexOf(line)) < code.indexOf(lines[i + 1])) {
        indentLevel = Math.max(0, indentLevel - 1);
        formatted += indent() + '}\n';
      }
    }
  }

  return formatted.trim();
}

function formatGenericCode(code: string): string {
  const lines = code.split('\n');
  let indentLevel = 0;
  const indentSize = 4;
  const indent = () => ' '.repeat(indentLevel * indentSize);

  const formatted = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';

    if (trimmed.endsWith('}') || trimmed.endsWith(']') || trimmed.endsWith(')')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const formattedLine = indent() + trimmed;

    if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
      indentLevel++;
    }

    return formattedLine;
  }).filter(line => line).join('\n');

  return formatted;
}
