"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import styles from "./RichTextEditor.module.css";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const COLORS = [
  "#1e293b", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899",
];

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
    ],
    content: value || "",
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class: styles.editorContent,
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
    },
  });

  // Sync external value changes (e.g. when editing an existing product)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value || "";
    if (current !== incoming && incoming !== (current === "<p></p>" ? "" : current)) {
      editor.commands.setContent(incoming || "");
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <button type="button" title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? styles.active : ""}>
          <strong>B</strong>
        </button>
        <button type="button" title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? styles.active : ""}>
          <em>I</em>
        </button>
        <button type="button" title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive("underline") ? styles.active : ""}>
          <u>U</u>
        </button>
        <button type="button" title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive("strike") ? styles.active : ""}>
          <s>S</s>
        </button>

        <span className={styles.divider} />

        <button type="button" title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive("heading", { level: 1 }) ? styles.active : ""}>
          H1
        </button>
        <button type="button" title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive("heading", { level: 2 }) ? styles.active : ""}>
          H2
        </button>
        <button type="button" title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive("heading", { level: 3 }) ? styles.active : ""}>
          H3
        </button>

        <span className={styles.divider} />

        <button type="button" title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? styles.active : ""}>
          ≡
        </button>
        <button type="button" title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive("orderedList") ? styles.active : ""}>
          1.
        </button>

        <span className={styles.divider} />

        <div className={styles.colorGroup} title="Text color">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              title={c}
              className={`${styles.colorDot} ${editor.isActive("textStyle", { color: c }) ? styles.colorDotActive : ""}`}
              style={{ background: c }}
              onClick={() => editor.chain().focus().setColor(c).run()}
            />
          ))}
        </div>

        <span className={styles.divider} />

        <button type="button" title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} className={styles.clearBtn}>
          ✕
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
