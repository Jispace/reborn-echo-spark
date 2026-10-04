import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { Bold, Italic, List, ListOrdered, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RichTextEditorProps {
  /** HTML content */
  value: string;
  /** Called with HTML and plain text */
  onChange: (html: string, text: string) => void;
  invalid?: boolean;
  placeholder?: string;
  id?: string;
}

export function RichTextEditor({ value, onChange, invalid, placeholder, id }: RichTextEditorProps) {
  const [activated, setActivated] = useState(false);
  const [, force] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: value,
    editorProps: {
      attributes: {
        id: id ?? '',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-required': 'true',
        class:
          'tiptap-contact min-h-32 w-full outline-none text-xs leading-relaxed text-[#2D241E] sm:text-sm [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5',
      },
    },
    onFocus: () => setActivated(true),
    onUpdate: ({ editor }) => {
      setActivated(true);
      const text = editor.getText().trim();
      onChange(text ? editor.getHTML() : '', text);
    },
    onTransaction: () => force((n) => n + 1),
  });

  // Reset content when parent clears the value
  useEffect(() => {
    if (editor && !value && !editor.isEmpty) editor.commands.clearContent();
  }, [value, editor]);

  const tools = editor
    ? [
        { title: 'Gras', icon: Bold, run: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
        { title: 'Italique', icon: Italic, run: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
        { title: 'Liste à puces', icon: List, run: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
        { title: 'Liste numérotée', icon: ListOrdered, run: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
        { title: 'Annuler', icon: Undo2, run: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo() },
        { title: 'Rétablir', icon: Redo2, run: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo() },
      ]
    : [];

  return (
    <div
      aria-invalid={invalid}
      className={`overflow-hidden rounded-2xl border bg-[#FAF7F2] transition-colors focus-within:bg-white ${invalid ? 'border-red-500' : 'border-[#E6DDD0] focus-within:border-[#7A583E]'}`}
    >
      {activated && editor && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-[#E6DDD0] px-2 py-1" role="toolbar" aria-label="Mise en forme du message">
          {tools.map(({ title, icon: Icon, run, active, disabled }) => (
            <Button
              key={title}
              type="button"
              variant="ghost"
              size="icon"
              title={title}
              aria-label={title}
              aria-pressed={active}
              disabled={disabled}
              className={`h-8 w-8 text-[#3E3228] hover:bg-[#F2ECE2] ${active ? 'bg-[#F2ECE2]' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={run}
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>
      )}
      <div className="px-4 py-3" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
