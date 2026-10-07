import React, { useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Palette,
  Highlighter,
  Type,
  RemoveFormatting,
  List,
  ListOrdered,
  Save,
  Check
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  savedIndicator?: boolean;
}

const FONT_FAMILIES = [
  { label: 'Padrão (Inter)', value: "'Inter', sans-serif" },
  { label: 'Datilografia (Courier)', value: "'Courier Prime', 'Courier New', monospace" },
  { label: 'Elegante (Serif)', value: "'Playfair Display', Georgia, serif" },
  { label: 'Condensada (Oswald)', value: "'Oswald', sans-serif" },
  { label: 'Sistema (Arial)', value: "Arial, sans-serif" },
];

const FONT_SIZES = [
  { label: 'Muito Pequeno (10px)', value: '1' },
  { label: 'Pequeno (12px)', value: '2' },
  { label: 'Normal (14px)', value: '3' },
  { label: 'Médio (16px)', value: '4' },
  { label: 'Grande (18px)', value: '5' },
  { label: 'Muito Grande (24px)', value: '6' },
];

const COLOR_PALETTE = [
  '#0f172a', // Slate 900
  '#1e40af', // Blue 800
  '#047857', // Emerald 700
  '#b91c1c', // Red 700
  '#b45309', // Amber 700
  '#6b21a8', // Purple 800
  '#475569', // Slate 600
];

const HIGHLIGHT_PALETTE = [
  'transparent',
  '#fef08a', // Yellow
  '#bbf7d0', // Green
  '#bfdbfe', // Blue
  '#fbcfe8', // Pink
  '#fed7aa', // Orange
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  onSave,
  readOnly = false,
  placeholder = 'Digite aqui as informações...',
  minHeight = '110px',
  maxHeight = '140px',
  savedIndicator = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromProps = useRef(false);
  const savedRangeRef = useRef<Range | null>(null);

  // Initialize and sync content
  useEffect(() => {
    if (editorRef.current && !isUpdatingFromProps.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isUpdatingFromProps.current = false;
  }, [value]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingFromProps.current = true;
      onChange(editorRef.current.innerHTML);
    }
    saveSelection();
  };

  const executeCommand = (command: string, valueArgument: string = '') => {
    if (readOnly) return;
    restoreSelection();
    document.execCommand(command, false, valueArgument);
    handleInput();
    saveSelection();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 flex flex-col">
      {/* Formatting Toolbar */}
      {!readOnly && (
        <div className="bg-slate-50 border-b border-slate-200 p-1.5 sm:p-2 flex flex-wrap items-center gap-1 text-xs select-none shrink-0">
          {/* Bold */}
          <button
            type="button"
            title="Negrito (Ctrl+B)"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('bold');
            }}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic */}
          <button
            type="button"
            title="Itálico (Ctrl+I)"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('italic');
            }}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 italic flex items-center justify-center transition-colors cursor-pointer"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Underline */}
          <button
            type="button"
            title="Sublinhado (Ctrl+U)"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('underline');
            }}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 underline flex items-center justify-center transition-colors cursor-pointer"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          {/* StrikeThrough */}
          <button
            type="button"
            title="Riscado"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('strikeThrough');
            }}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-300 mx-1" />

          {/* Font Family Selector */}
          <div className="flex items-center gap-1">
            <Type className="w-3.5 h-3.5 text-slate-500" />
            <select
              title="Tipo de Fonte"
              onFocus={saveSelection}
              onChange={(e) => executeCommand('fontName', e.target.value)}
              className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-700 outline-none hover:border-slate-400 focus:border-blue-500 cursor-pointer"
              defaultValue="'Inter', sans-serif"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-1">
            <select
              title="Tamanho da Fonte"
              onFocus={saveSelection}
              onChange={(e) => executeCommand('fontSize', e.target.value)}
              className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-700 outline-none hover:border-slate-400 focus:border-blue-500 cursor-pointer"
              defaultValue="3"
            >
              {FONT_SIZES.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-[1px] h-4 bg-slate-300 mx-1" />

          {/* Text Color Picker */}
          <div className="flex items-center gap-1" title="Cor da Fonte">
            <Palette className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="color"
              defaultValue="#0f172a"
              onFocus={saveSelection}
              onChange={(e) => executeCommand('foreColor', e.target.value)}
              className="w-5 h-5 p-0 border border-slate-300 rounded cursor-pointer"
            />
            {/* Quick color dots */}
            <div className="hidden sm:flex items-center gap-1">
              {COLOR_PALETTE.slice(0, 4).map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    executeCommand('foreColor', c);
                  }}
                  style={{ backgroundColor: c }}
                  className="w-3.5 h-3.5 rounded-full border border-slate-300 hover:scale-110 transition-transform cursor-pointer"
                  title={`Cor ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Background / Highlight Color */}
          <div className="flex items-center gap-1 ml-1" title="Cor de Fundo da Fonte">
            <Highlighter className="w-3.5 h-3.5 text-slate-500" />
            <div className="flex items-center gap-0.5">
              {HIGHLIGHT_PALETTE.map((bg, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    executeCommand('hiliteColor', bg);
                  }}
                  style={{ backgroundColor: bg === 'transparent' ? '#ffffff' : bg }}
                  className={`w-3.5 h-3.5 rounded border border-slate-300 hover:scale-110 transition-transform cursor-pointer ${
                    bg === 'transparent' ? 'relative after:content-["/"] after:text-[9px] after:text-red-500 after:absolute after:inset-0 after:flex after:items-center after:justify-center' : ''
                  }`}
                  title={bg === 'transparent' ? 'Sem destaque' : `Fundo ${bg}`}
                />
              ))}
            </div>
          </div>

          <div className="w-[1px] h-4 bg-slate-300 mx-1" />

          {/* Lists */}
          <button
            type="button"
            title="Lista com Marcadores"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('insertUnorderedList');
            }}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Lista Numerada"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('insertOrderedList');
            }}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          {/* Clear formatting */}
          <button
            type="button"
            title="Limpar Formatação"
            onMouseDown={(e) => {
              e.preventDefault();
              executeCommand('removeFormat');
            }}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>

          {/* Save trigger if provided */}
          {onSave && (
            <div className="ml-auto flex items-center gap-1.5">
              {savedIndicator && (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Salvo!
                </span>
              )}
              <button
                type="button"
                onClick={onSave}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Salvar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Editable Area with Scroll Function */}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onBlur={saveSelection}
        style={{ minHeight, maxHeight }}
        data-placeholder={placeholder}
        className="p-3 text-slate-800 text-sm focus:outline-none overflow-y-auto leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:italic font-sans scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100"
      />
    </div>
  );
};
