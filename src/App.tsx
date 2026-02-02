import { useState, useEffect } from 'react';
import { Code2, Copy, Wand2, RotateCcw, Check, FileCode, Layers, Sparkles, Eye, Edit, FilePlus, AlertCircle, Menu, X, Sun, Moon, Save, Download, FolderOpen, LogIn, LogOut, User } from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { formatCode, FormatResult } from './utils/codeFormatter';
import { parseLogData, ParsedFile } from './utils/logParser';
import { FileTree } from './components/FileTree';
import { ResizableSidebar } from './components/ResizableSidebar';
import { supabase, ParsedProject } from './utils/supabase';
import { downloadAsZip } from './utils/zipDownloader';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import hljs from 'highlight.js';

type Mode = 'simple' | 'log-parser';
type Theme = 'light' | 'dark';

function AppContent() {
  const { user, signOut } = useAuth();
  const [mode, setMode] = useState<Mode>('log-parser');
  const [inputCode, setInputCode] = useState('');
  const [output, setOutput] = useState<FormatResult>({ formattedCode: '', language: 'Unknown' });
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');

  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ParsedFile | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [projectName, setProjectName] = useState('Untitled Project');
  const [savedProjects, setSavedProjects] = useState<ParsedProject[]>([]);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const link = document.getElementById('hljs-theme') as HTMLLinkElement;
    if (link) {
      link.href = theme === 'dark'
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
    } else {
      const newLink = document.createElement('link');
      newLink.id = 'hljs-theme';
      newLink.rel = 'stylesheet';
      newLink.href = theme === 'dark'
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
      document.head.appendChild(newLink);
    }
  }, [theme]);

  useEffect(() => {
    if (selectedFile) {
      setTimeout(() => {
        document.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block as HTMLElement);
        });
      }, 0);
    }
  }, [selectedFile]);

  useEffect(() => {
    if (output.formattedCode) {
      setTimeout(() => {
        document.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block as HTMLElement);
        });
      }, 0);
    }
  }, [output.formattedCode]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSaveProject = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (parsedFiles.length === 0) return;

    setIsSaving(true);
    try {
      const project = {
        name: projectName,
        user_id: user.id,
        files_data: parsedFiles.map(f => ({
          path: f.path,
          content: f.content,
          operation: f.operation,
          status: f.status,
          lineCount: f.lineCount,
          toolCallId: f.toolCallId
        }))
      };

      const { error } = await supabase
        .from('parsed_projects')
        .insert([project]);

      if (error) throw error;

      alert('Project saved successfully!');
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadProjects = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('parsed_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setSavedProjects(data || []);
      setShowProjectsModal(true);
    } catch (error) {
      console.error('Error loading projects:', error);
      alert('Failed to load projects');
    }
  };

  const handleSelectProject = (project: ParsedProject) => {
    const files = project.files_data.map(f => ({
      path: f.path,
      content: f.content,
      operation: f.operation as 'Read' | 'Write' | 'Edit',
      status: f.status,
      lineCount: f.lineCount,
      toolCallId: f.toolCallId
    }));

    setParsedFiles(files);
    setSelectedFile(files[0] || null);
    setProjectName(project.name);
    setShowProjectsModal(false);

    const initialExpanded = new Set<string>();
    files.forEach(file => {
      const parts = file.path.split('/').filter(p => p);
      let path = '';
      for (let i = 0; i < Math.min(parts.length - 1, 2); i++) {
        path = path ? `${path}/${parts[i]}` : parts[i];
        initialExpanded.add(path);
      }
    });
    setExpandedFolders(initialExpanded);
  };

  const handleDownloadZip = async () => {
    if (parsedFiles.length === 0) return;
    await downloadAsZip(parsedFiles, projectName);
  };

  const handleFormat = () => {
    const result = formatCode(inputCode);
    setOutput(result);
  };

  const handleParseLogs = () => {
    const result = parseLogData(inputCode);
    if (result.error) {
      setParseError(result.error);
      setParsedFiles([]);
      setSelectedFile(null);
      setExpandedFolders(new Set());
    } else {
      setParsedFiles(result.files);
      setSelectedFile(result.files[0] || null);
      setParseError('');

      const initialExpanded = new Set<string>();
      result.files.forEach(file => {
        const parts = file.path.split('/').filter(p => p);
        let path = '';
        for (let i = 0; i < Math.min(parts.length - 1, 2); i++) {
          path = path ? `${path}/${parts[i]}` : parts[i];
          initialExpanded.add(path);
        }
      });
      setExpandedFolders(initialExpanded);
    }
  };

  const handleCopy = async () => {
    const textToCopy = mode === 'simple' ? output.formattedCode : selectedFile?.content || '';
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setInputCode('');
    setOutput({ formattedCode: '', language: 'Unknown' });
    setParsedFiles([]);
    setSelectedFile(null);
    setParseError('');
    setExpandedFolders(new Set());
  };

  const handleToggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleLoadExample = () => {
    const example = mode === 'simple' ? exampleCode : exampleLog;
    setInputCode(example);
    if (mode === 'log-parser') {
      setTimeout(() => handleParseLogs(), 100);
    }
  };

  const exampleCode = 'function hello() {\\n    console.log(\\"Hello World\\");\\n    return true;\\n}';

  const exampleLog = `a:{"toolCallId":"toolu_01Write","toolName":"Write","args":{"file_path":"/components/exam/RecentResults.tsx","content":"'use client';\\n\\nimport { cn } from '@/lib/utils';\\nimport { Card, CardContent } from '@/components/ui/card';\\nimport { Button } from '@/components/ui/button';"},"result":"File created successfully"}
9:{"toolCallId":"toolu_01Edit1","toolName":"Edit","args":{"file_path":"/components/exam/index.ts","old_string":"export * from './PermissionFilteredTabs';","new_string":"export * from './PermissionFilteredTabs';\\nexport * from './RecentResults';"}}
a:{"toolCallId":"toolu_01Edit1","toolName":"Edit","args":{"file_path":"/components/exam/index.ts","old_string":"export * from './PermissionFilteredTabs';","new_string":"export * from './PermissionFilteredTabs';\\nexport * from './RecentResults';"},"result":{"type":"error","content":"File has not been read yet. Read it first before writing to it."}}
9:{"toolCallId":"toolu_01Read","toolName":"Read","args":{"file_path":"/components/exam/index.ts"}}
a:{"toolCallId":"toolu_01Read","toolName":"Read","result":"     1→export * from './PermissionFilteredTabs';\\n     2→"}
9:{"toolCallId":"toolu_01Edit2","toolName":"Edit","args":{"file_path":"/components/exam/index.ts","old_string":"export * from './PermissionFilteredTabs';","new_string":"export * from './PermissionFilteredTabs';\\nexport * from './RecentResults';"}}
a:{"toolCallId":"toolu_01Edit2","toolName":"Edit","args":{"file_path":"/components/exam/index.ts","old_string":"export * from './PermissionFilteredTabs';","new_string":"export * from './PermissionFilteredTabs';\\nexport * from './RecentResults';"},"result":"The file has been updated successfully."}`;

  const bgClass = theme === 'dark'
    ? 'bg-black'
    : 'bg-white';

  const textClass = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textMutedClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const cardBgClass = theme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50';
  const cardBorderClass = theme === 'dark' ? 'border-zinc-800' : 'border-gray-200';
  const inputBgClass = theme === 'dark' ? 'bg-zinc-950' : 'bg-white';
  const codeBgClass = theme === 'dark' ? 'bg-black' : 'bg-gray-50';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-[1800px]">
        <header className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex-1"></div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg">
                <Code2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Code Formatter
              </h1>
            </div>
            <div className="flex-1 flex justify-end gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-zinc-900 border border-zinc-800' : 'bg-gray-100 border border-gray-300'}`}>
                    <User className="w-4 h-4 text-blue-400" />
                    <span className={`text-sm ${textMutedClass}`}>{user.email}</span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className={`p-2 sm:p-3 rounded-lg transition-all ${
                      theme === 'dark'
                        ? 'bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-zinc-800'
                        : 'bg-gray-100 hover:bg-gray-200 text-red-600 border border-gray-300'
                    }`}
                    aria-label="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className={`p-2 sm:p-3 rounded-lg transition-all flex items-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-zinc-800'
                      : 'bg-gray-100 hover:bg-gray-200 text-blue-600 border border-gray-300'
                  }`}
                >
                  <LogIn className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-medium">Sign In</span>
                </button>
              )}
              <button
                onClick={toggleTheme}
                className={`p-2 sm:p-3 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-yellow-400 border border-zinc-800'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                }`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <p className={`${textMutedClass} text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 px-4`}>
            Transform raw code with escape characters or parse log files into readable code
          </p>

          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap px-2">
            <button
              onClick={() => setMode('simple')}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 text-sm sm:text-base ${
                mode === 'simple'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : theme === 'dark'
                  ? 'bg-zinc-900 text-gray-400 hover:bg-zinc-800 border border-zinc-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span className="hidden sm:inline">Simple Formatter</span>
              <span className="sm:hidden">Simple</span>
            </button>
            <button
              onClick={() => setMode('log-parser')}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 text-sm sm:text-base ${
                mode === 'log-parser'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : theme === 'dark'
                  ? 'bg-zinc-900 text-gray-400 hover:bg-zinc-800 border border-zinc-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Log Parser</span>
              <span className="sm:hidden">Parser</span>
            </button>
          </div>
        </header>

        {mode === 'simple' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className={`${cardBgClass} backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl border ${cardBorderClass} overflow-hidden`}>
              <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-zinc-900 to-zinc-800' : 'bg-gradient-to-r from-gray-100 to-gray-200'} px-4 sm:px-6 py-3 sm:py-4 border-b ${cardBorderClass}`}>
                <h2 className={`text-base sm:text-lg font-semibold ${textClass} flex items-center gap-2`}>
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Input Code
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <textarea
                  data-log-input
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder={`Paste your raw code here...\n\nExample:\n${exampleCode}`}
                  className={`w-full h-[300px] sm:h-[400px] lg:h-[500px] ${inputBgClass} ${textClass} font-mono text-xs sm:text-sm p-3 sm:p-4 rounded-xl border ${cardBorderClass} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none transition-all`}
                />
                <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={handleFormat}
                    disabled={!inputCode.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-50 text-sm sm:text-base"
                  >
                    <Wand2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    Format Code
                  </button>
                  <button
                    onClick={handleLoadExample}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-purple-500/25 text-sm sm:text-base"
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Example</span>
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={!inputCode && !output.formattedCode}
                    className={`${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-950' : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100'} ${textClass} font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 text-sm sm:text-base`}
                  >
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                </div>
              </div>
            </div>

            <div className={`${cardBgClass} backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl border ${cardBorderClass} overflow-hidden`}>
              <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-zinc-900 to-zinc-800' : 'bg-gradient-to-r from-gray-100 to-gray-200'} px-4 sm:px-6 py-3 sm:py-4 border-b ${cardBorderClass} flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0 sm:justify-between`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <h2 className={`text-base sm:text-lg font-semibold ${textClass}`}>Formatted Output</h2>
                  {output.language && output.language !== 'Unknown' && (
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full border border-cyan-500/30">
                      {output.language}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!output.formattedCode}
                  className={`w-full sm:w-auto ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-950' : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100'} ${textClass} font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 text-sm`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 sm:p-6 relative">
                {output.error ? (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 sm:p-4 rounded-xl">
                    <p className="font-medium text-sm sm:text-base">Error:</p>
                    <p className="text-xs sm:text-sm mt-1">{output.error}</p>
                  </div>
                ) : (
                  <>
                    <pre className={`w-full h-[300px] sm:h-[400px] lg:h-[500px] ${codeBgClass} ${textClass} font-mono text-xs sm:text-sm p-3 sm:p-4 rounded-xl border ${cardBorderClass} overflow-auto`}>
                      <code className="language-typescript">
                        {output.formattedCode || (
                          <span className={textMutedClass}>Your formatted code will appear here...</span>
                        )}
                      </code>
                    </pre>
                    {/* Floating Copy Button */}
                    {output.formattedCode && (
                      <button
                        onClick={handleCopy}
                        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-3 px-5 rounded-full flex items-center gap-2 shadow-2xl hover:shadow-blue-500/50 transition-all z-40"
                      >
                        {copied ? (
                          <>
                            <Check className="w-5 h-5" />
                            <span className="hidden sm:inline">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5" />
                            <span className="hidden sm:inline">Copy Code</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className={`${cardBgClass} backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl border ${cardBorderClass} overflow-hidden`}>
              <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-zinc-900 to-zinc-800' : 'bg-gradient-to-r from-gray-100 to-gray-200'} px-4 sm:px-6 py-3 sm:py-4 border-b ${cardBorderClass}`}>
                <h2 className={`text-base sm:text-lg font-semibold ${textClass} flex items-center gap-2`}>
                  <FileCode className="w-4 h-4 sm:w-5 sm:h-5" />
                  Paste Log Data
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <textarea
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder={`Paste your log data here...\n\nExample:\n${exampleLog}`}
                  className={`w-full h-32 sm:h-40 ${inputBgClass} ${textClass} font-mono text-xs sm:text-sm p-3 sm:p-4 rounded-xl border ${cardBorderClass} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none transition-all`}
                />
                <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    data-parse-btn
                    onClick={handleParseLogs}
                    disabled={!inputCode.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-50 text-sm sm:text-base"
                  >
                    <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                    Parse Logs
                  </button>
                  <button
                    onClick={handleLoadProjects}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-500/25 text-sm sm:text-base"
                  >
                    <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Load</span>
                  </button>
                  <button
                    onClick={handleLoadExample}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-purple-500/25 text-sm sm:text-base"
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Example</span>
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={!inputCode && parsedFiles.length === 0}
                    className={`${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-950' : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100'} ${textClass} font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 text-sm sm:text-base`}
                  >
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                </div>
              </div>
            </div>

            {parseError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 sm:p-4 rounded-xl">
                <p className="font-medium text-sm sm:text-base">Error:</p>
                <p className="text-xs sm:text-sm mt-1">{parseError}</p>
              </div>
            )}

            {parsedFiles.length === 0 && !parseError && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2 text-base sm:text-lg">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  How It Works
                </h3>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-300">
                  <div className="flex gap-2 sm:gap-3">
                    <div className="text-blue-400 font-bold flex-shrink-0">1.</div>
                    <p>Paste log data containing Read, Write, or Edit operations with file paths and code</p>
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <div className="text-blue-400 font-bold flex-shrink-0">2.</div>
                    <p>The parser extracts operations and shows them with color-coded badges (Read: blue, Write: green, Edit: amber)</p>
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <div className="text-blue-400 font-bold flex-shrink-0">3.</div>
                    <p>Edit operations show before/after code changes and error status if they failed</p>
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <div className="text-blue-400 font-bold flex-shrink-0">4.</div>
                    <p>Browse operations in the sidebar and copy clean, formatted code</p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-blue-500/20">
                  <p className="text-xs text-slate-400">
                    <strong>Tip:</strong> Click the "Example" button above to see it in action with sample data!
                  </p>
                </div>
              </div>
            )}

            {parsedFiles.length > 0 && (
              <>
                <div className={`flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between ${cardBgClass} backdrop-blur-sm rounded-xl p-4 border ${cardBorderClass}`}>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className={`${inputBgClass} ${textClass} px-3 py-2 rounded-lg border ${cardBorderClass} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-sm font-medium flex-1`}
                      placeholder="Project name"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={handleSaveProject}
                      disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-all text-sm disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleDownloadZip}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-all text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Zip
                    </button>
                  </div>
                </div>
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-auto lg:h-[calc(100vh-450px)] lg:min-h-[600px]">
                  {/* Mobile Sidebar Toggle */}
                  <button
                    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    className={`lg:hidden ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-200 hover:bg-gray-300'} ${textClass} font-medium py-3 px-4 rounded-xl flex items-center gap-2 transition-all`}
                  >
                    {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    {isMobileSidebarOpen ? 'Close' : 'Open'} File Explorer
                  </button>

                {/* Sidebar - Mobile Overlay / Desktop Resizable */}
                <div
                  className={`
                    ${isMobileSidebarOpen ? 'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden' : 'hidden lg:block'}
                  `}
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <div
                    className={`
                      ${isMobileSidebarOpen ? 'w-4/5 max-w-sm h-full' : 'h-full'}
                    `}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isMobileSidebarOpen ? (
                      <div className="bg-slate-800/95 backdrop-blur-sm shadow-2xl border-r border-slate-700/50 h-full overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
                          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            <FileCode className="w-4 h-4" />
                            File Explorer
                          </h2>
                          <button
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="p-1 hover:bg-slate-600 rounded"
                          >
                            <X className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                        <FileTree
                          files={parsedFiles}
                          selectedFile={selectedFile}
                          onFileSelect={(file) => {
                            setSelectedFile(file);
                            setIsMobileSidebarOpen(false);
                          }}
                          expandedFolders={expandedFolders}
                          onToggleFolder={handleToggleFolder}
                        />
                      </div>
                    ) : (
                      <ResizableSidebar minWidth={200} maxWidth={600} defaultWidth={300} theme={theme}>
                        <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-zinc-900 to-zinc-800' : 'bg-gradient-to-r from-gray-100 to-gray-200'} px-4 py-3 border-b ${cardBorderClass}`}>
                          <h2 className={`text-sm font-semibold ${textClass} flex items-center gap-2`}>
                            <FileCode className="w-4 h-4" />
                            File Explorer
                          </h2>
                        </div>
                        <FileTree
                          files={parsedFiles}
                          selectedFile={selectedFile}
                          onFileSelect={setSelectedFile}
                          expandedFolders={expandedFolders}
                          onToggleFolder={handleToggleFolder}
                        />
                      </ResizableSidebar>
                    )}
                  </div>
                </div>

                {/* Main Content Area */}
                <div className={`flex-1 ${cardBgClass} backdrop-blur-sm rounded-2xl shadow-2xl border ${cardBorderClass} overflow-hidden flex flex-col min-h-[400px] lg:min-h-0`}>
                  <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-zinc-900 to-zinc-800' : 'bg-gradient-to-r from-gray-100 to-gray-200'} px-4 lg:px-6 py-3 lg:py-4 border-b ${cardBorderClass} flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 sm:justify-between`}>
                    <div className="flex items-center gap-2 lg:gap-3 flex-wrap w-full sm:w-auto">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedFile?.status === 'error' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                      <h2 className={`text-sm lg:text-lg font-semibold ${textClass} truncate max-w-[200px] sm:max-w-md`}>
                        {selectedFile?.path || 'No file selected'}
                      </h2>
                      {selectedFile && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedFile.operation === 'Read' && (
                            <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30 flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              Read
                            </span>
                          )}
                          {selectedFile.operation === 'Write' && (
                            <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30 flex items-center gap-1">
                              <FilePlus className="w-3 h-3" />
                              Write
                            </span>
                          )}
                          {selectedFile.operation === 'Edit' && (
                            <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full border border-amber-500/30 flex items-center gap-1">
                              <Edit className="w-3 h-3" />
                              Edit
                            </span>
                          )}
                          {selectedFile.status === 'error' && (
                            <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full border border-red-500/30 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Error
                            </span>
                          )}
                          <span className={`px-2 lg:px-3 py-0.5 lg:py-1 ${theme === 'dark' ? 'bg-zinc-800 text-gray-300' : 'bg-gray-200 text-gray-700'} text-xs font-medium rounded-full`}>
                            {selectedFile.lineCount} lines
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleCopy}
                      disabled={!selectedFile}
                      className={`w-full sm:w-auto ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-950' : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100'} ${textClass} font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 text-sm`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                    <pre className={`h-full ${codeBgClass} ${textClass} font-mono text-xs lg:text-sm p-4 lg:p-6 overflow-auto`}>
                      <code className="language-typescript">
                        {selectedFile?.content || (
                          <span className={textMutedClass}>Select a file to view its contents...</span>
                        )}
                      </code>
                    </pre>
                    {/* Floating Copy Button - Visible on Scroll */}
                    {selectedFile && (
                      <button
                        onClick={handleCopy}
                        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-3 px-5 rounded-full flex items-center gap-2 shadow-2xl hover:shadow-blue-500/50 transition-all z-40"
                      >
                        {copied ? (
                          <>
                            <Check className="w-5 h-5" />
                            <span className="hidden sm:inline">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5" />
                            <span className="hidden sm:inline">Copy Code</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              </>
            )}
          </div>
        )}

        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} theme={theme} />
        )}

        {showProjectsModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProjectsModal(false)}>
            <div className={`${cardBgClass} rounded-2xl shadow-2xl border ${cardBorderClass} max-w-2xl w-full max-h-[80vh] overflow-hidden`} onClick={(e) => e.stopPropagation()}>
              <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-zinc-900 to-zinc-800' : 'bg-gradient-to-r from-gray-100 to-gray-200'} px-6 py-4 border-b ${cardBorderClass} flex items-center justify-between`}>
                <h2 className={`text-xl font-semibold ${textClass} flex items-center gap-2`}>
                  <FolderOpen className="w-5 h-5" />
                  Saved Projects
                </h2>
                <button
                  onClick={() => setShowProjectsModal(false)}
                  className={`p-2 ${theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-300'} rounded-lg transition-all`}
                >
                  <X className={`w-5 h-5 ${textMutedClass}`} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                {savedProjects.length === 0 ? (
                  <p className={`${textMutedClass} text-center py-8`}>No saved projects found</p>
                ) : (
                  <div className="space-y-3">
                    {savedProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleSelectProject(project)}
                        className={`w-full ${inputBgClass} hover:${theme === 'dark' ? 'bg-zinc-900' : 'bg-gray-100'} p-4 rounded-xl border ${cardBorderClass} hover:border-blue-500 transition-all text-left`}
                      >
                        <h3 className={`${textClass} font-semibold mb-2`}>{project.name}</h3>
                        <div className={`flex items-center gap-4 text-xs ${textMutedClass}`}>
                          <span>{project.files_data.length} files</span>
                          <span>{new Date(project.created_at || '').toLocaleDateString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {mode === 'simple' && (
          <div className={`${cardBgClass} backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border ${cardBorderClass} mt-4 sm:mt-6`}>
            <h3 className={`text-base sm:text-lg font-semibold ${textClass} mb-3 sm:mb-4`}>Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div className={`${inputBgClass} p-3 sm:p-4 rounded-xl border ${cardBorderClass}`}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                  <Code2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <h4 className={`font-medium ${textClass} mb-1 sm:mb-2 text-sm sm:text-base`}>Multi-Language Support</h4>
                <p className={`text-xs sm:text-sm ${textMutedClass}`}>Automatically detects JavaScript, Python, HTML, CSS, JSON, and more</p>
              </div>
              <div className={`${inputBgClass} p-3 sm:p-4 rounded-xl border ${cardBorderClass}`}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                  <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                </div>
                <h4 className={`font-medium ${textClass} mb-1 sm:mb-2 text-sm sm:text-base`}>Smart Formatting</h4>
                <p className={`text-xs sm:text-sm ${textMutedClass}`}>Converts escape characters and applies proper indentation</p>
              </div>
              <div className={`${inputBgClass} p-3 sm:p-4 rounded-xl border ${cardBorderClass} sm:col-span-2 md:col-span-1`}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                </div>
                <h4 className={`font-medium ${textClass} mb-1 sm:mb-2 text-sm sm:text-base`}>One-Click Copy</h4>
                <p className={`text-xs sm:text-sm ${textMutedClass}`}>Instantly copy formatted code to your clipboard</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <SpeedInsights />
    </AuthProvider>
  );
}

export default App;
