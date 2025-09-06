import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link, Image, Code, Quote, Undo, Redo, Type, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import MediaLibrary from './MediaLibrary';

interface WYSIWYGEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  className?: string;
}

const WYSIWYGEditor: React.FC<WYSIWYGEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing...',
  height = '300px',
  className = ''
}) => {
  const [content, setContent] = useState(value);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);

  useEffect(() => {
    setContent(value);
  }, [value]);

  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
      onChange(newContent);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentChange();
  };

  const insertHTML = (html: string) => {
    if (selectedRange) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(selectedRange);
        document.execCommand('insertHTML', false, html);
        handleContentChange();
      }
    } else {
      document.execCommand('insertHTML', false, html);
      handleContentChange();
    }
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSelectedRange(selection.getRangeAt(0));
    }
  };

  const handleMediaSelect = (media: any) => {
    const imageHtml = `<img src="${media.file_url}" alt="${media.alt_text || media.filename}" style="max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0;" />`;
    insertHTML(imageHtml);
    setShowMediaLibrary(false);
  };

  const insertLink = () => {
    if (linkUrl) {
      const text = linkText || linkUrl;
      const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${text}</a>`;
      insertHTML(linkHtml);
    }
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  };

  const formatBlock = (tag: string) => {
    execCommand('formatBlock', tag);
  };

  const insertList = (ordered: boolean) => {
    execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
  };

  const setAlignment = (align: string) => {
    execCommand(`justify${align}`);
  };

  const insertQuote = () => {
    const quoteHtml = `<blockquote style="border-left: 4px solid #e5e7eb; padding-left: 16px; margin: 16px 0; font-style: italic; color: #6b7280;">Quote text here</blockquote>`;
    insertHTML(quoteHtml);
  };

  const insertCodeBlock = () => {
    const codeHtml = `<pre style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; font-family: 'Courier New', monospace; margin: 16px 0;"><code>Code here</code></pre>`;
    insertHTML(codeHtml);
  };

  const toolbarButtons = [
    {
      icon: <Type className="w-4 h-4" />,
      title: 'Heading',
      action: () => formatBlock('h3'),
      dropdown: [
        { label: 'Paragraph', action: () => formatBlock('p') },
        { label: 'Heading 1', action: () => formatBlock('h1') },
        { label: 'Heading 2', action: () => formatBlock('h2') },
        { label: 'Heading 3', action: () => formatBlock('h3') },
        { label: 'Heading 4', action: () => formatBlock('h4') }
      ]
    },
    { icon: <Bold className="w-4 h-4" />, title: 'Bold', action: () => execCommand('bold') },
    { icon: <Italic className="w-4 h-4" />, title: 'Italic', action: () => execCommand('italic') },
    { icon: <Underline className="w-4 h-4" />, title: 'Underline', action: () => execCommand('underline') },
    { type: 'separator' },
    { icon: <AlignLeft className="w-4 h-4" />, title: 'Align Left', action: () => setAlignment('Left') },
    { icon: <AlignCenter className="w-4 h-4" />, title: 'Align Center', action: () => setAlignment('Center') },
    { icon: <AlignRight className="w-4 h-4" />, title: 'Align Right', action: () => setAlignment('Right') },
    { type: 'separator' },
    { icon: <List className="w-4 h-4" />, title: 'Bullet List', action: () => insertList(false) },
    { icon: <ListOrdered className="w-4 h-4" />, title: 'Numbered List', action: () => insertList(true) },
    { type: 'separator' },
    { 
      icon: <Link className="w-4 h-4" />, 
      title: 'Insert Link', 
      action: () => {
        saveSelection();
        setShowLinkDialog(true);
      }
    },
    { 
      icon: <Image className="w-4 h-4" />, 
      title: 'Insert Image', 
      action: () => {
        saveSelection();
        setShowMediaLibrary(true);
      }
    },
    { icon: <Quote className="w-4 h-4" />, title: 'Quote', action: insertQuote },
    { icon: <Code className="w-4 h-4" />, title: 'Code Block', action: insertCodeBlock },
    { type: 'separator' },
    { icon: <Undo className="w-4 h-4" />, title: 'Undo', action: () => execCommand('undo') },
    { icon: <Redo className="w-4 h-4" />, title: 'Redo', action: () => execCommand('redo') }
  ];

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2">
        <div className="flex items-center space-x-1 flex-wrap">
          {toolbarButtons.map((button, index) => {
            if (button.type === 'separator') {
              return <div key={index} className="w-px h-6 bg-gray-300 mx-1" />;
            }

            if (button.dropdown) {
              return (
                <div key={index} className="relative group">
                  <button
                    type="button"
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                    title={button.title}
                  >
                    {button.icon}
                  </button>
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    {button.dropdown.map((item, itemIndex) => (
                      <button
                        key={itemIndex}
                        type="button"
                        onClick={item.action}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <button
                key={index}
                type="button"
                onClick={button.action}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                title={button.title}
              >
                {button.icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onBlur={handleContentChange}
        className="p-4 focus:outline-none"
        style={{ 
          minHeight: height,
          maxHeight: '500px',
          overflowY: 'auto'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Insert Link</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Text (optional)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Link text"
                />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end space-x-2">
              <button
                onClick={() => setShowLinkDialog(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={insertLink}
                disabled={!linkUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Select Image</h3>
              <button
                onClick={() => setShowMediaLibrary(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="h-[70vh] overflow-y-auto">
              <MediaLibrary
                onSelectMedia={handleMediaSelect}
                selectionMode={true}
                allowMultiple={false}
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
        
        [contenteditable] h1 {
          font-size: 2rem;
          font-weight: bold;
          margin: 1rem 0;
        }
        
        [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0.875rem 0;
        }
        
        [contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.75rem 0;
        }
        
        [contenteditable] h4 {
          font-size: 1.125rem;
          font-weight: bold;
          margin: 0.625rem 0;
        }
        
        [contenteditable] p {
          margin: 0.5rem 0;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          margin: 0.5rem 0;
          padding-left: 2rem;
        }
        
        [contenteditable] li {
          margin: 0.25rem 0;
        }
        
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        [contenteditable] a:hover {
          color: #1d4ed8;
        }
      `}</style>
    </div>
  );
};

export default WYSIWYGEditor;