import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Undo,
  Redo,
} from "lucide-react";

import CharacterCount from "@tiptap/extension-character-count";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  limit?: number;
}

const MenuBar = ({
  editor,
}: {
  editor: import("@tiptap/core").Editor | null;
}) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive("bold")
            ? "bg-gray-200 text-blue-600"
            : "text-gray-600"
        }`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive("italic")
            ? "bg-gray-200 text-blue-600"
            : "text-gray-600"
        }`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive("strike")
            ? "bg-gray-200 text-blue-600"
            : "text-gray-600"
        }`}
        title="Strike"
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive("heading", { level: 1 })
            ? "bg-gray-200 text-blue-600"
            : "text-gray-600"
        }`}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive("heading", { level: 2 })
            ? "bg-gray-200 text-blue-600"
            : "text-gray-600"
        }`}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive("bulletList")
            ? "bg-gray-200 text-blue-600"
            : "text-gray-600"
        }`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
          editor.isActive("orderedList")
            ? "bg-gray-200 text-blue-600"
            : "text-gray-600"
        }`}
        title="Ordered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 disabled:opacity-50"
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600 disabled:opacity-50"
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className,
  limit,
}) => {
  const [charCount, setCharCount] = React.useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount.configure({
        limit,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      // Fallback to textContent length if extension fails or returns 0 unexpectedly
      const count =
        editor.storage.characterCount?.characters() ||
        editor.state.doc.textContent.length;
      setCharCount(count);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base focus:outline-none min-h-[150px] p-4 max-w-none",
      },
    },
  });

  // Update content if value changes externally (e.g. reset form)
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
      const count =
        editor.storage.characterCount?.characters() ||
        editor.state.doc.textContent.length;
      setCharCount(count);
    }
  }, [value, editor]);

  return (
    <div
      className={`rich-text-editor border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${
        className || ""
      }`}
    >
      <MenuBar editor={editor} />
      <EditorContent editor={editor} placeholder={placeholder} />
      {limit && editor && (
        <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100 flex justify-end">
          {charCount} / {limit} characters
        </div>
      )}
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
