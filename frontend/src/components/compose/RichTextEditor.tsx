'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import UnderlineExtension from '@tiptap/extension-underline';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    Link as LinkIcon,
    Quote,
    Code,
    Paperclip,
    Undo,
    Redo,
} from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            UnderlineExtension,
            LinkExtension.configure({
                openOnClick: false,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) return null;

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="border border-gray-200/90 rounded-2xl overflow-hidden bg-white/90 flex flex-col min-h-[380px] focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all shadow-2xs">
            {/* Editor Main Content Area */}
            <div className="p-5 sm:p-6 flex-1 overflow-y-auto cursor-text">
                <EditorContent
                    editor={editor}
                    className="prose max-w-none text-sm sm:text-base text-gray-800 focus:outline-none min-h-[300px] leading-relaxed"
                />
            </div>

            {/* Bottom Formatting Toolbar */}
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between text-gray-600 flex-wrap gap-1.5">
                <div className="flex items-center space-x-1 flex-wrap">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        className="p-1.5 rounded-lg hover:bg-gray-200/70 disabled:opacity-30 transition-colors"
                        title="Undo"
                    >
                        <Undo className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        className="p-1.5 rounded-lg hover:bg-gray-200/70 disabled:opacity-30 transition-colors"
                        title="Redo"
                    >
                        <Redo className="w-4 h-4" />
                    </button>

                    <div className="w-px h-4 bg-gray-300 mx-1.5" />

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-gray-200 font-bold text-gray-900' : 'hover:bg-gray-200/70'
                            }`}
                        title="Bold"
                    >
                        <Bold className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-1.5 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-gray-200 italic text-gray-900' : 'hover:bg-gray-200/70'
                            }`}
                        title="Italic"
                    >
                        <Italic className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`p-1.5 rounded-lg transition-colors ${editor.isActive('underline') ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200/70'
                            }`}
                        title="Underline"
                    >
                        <UnderlineIcon className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={`p-1.5 rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200/70'
                            }`}
                        title="Strikethrough"
                    >
                        <Strikethrough className="w-4 h-4" />
                    </button>

                    <div className="w-px h-4 bg-gray-300 mx-1.5" />

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200/70'
                            }`}
                        title="Bullet List"
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`p-1.5 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200/70'
                            }`}
                        title="Numbered List"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </button>

                    <div className="w-px h-4 bg-gray-300 mx-1.5" />

                    <button
                        type="button"
                        onClick={setLink}
                        className={`p-1.5 rounded-lg transition-colors ${editor.isActive('link') ? 'bg-gray-200 text-emerald-700' : 'hover:bg-gray-200/70'
                            }`}
                        title="Insert Link"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`p-1.5 rounded-lg transition-colors ${editor.isActive('blockquote') ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200/70'
                            }`}
                        title="Quote"
                    >
                        <Quote className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        className={`p-1.5 rounded-lg transition-colors ${editor.isActive('codeBlock') ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200/70'
                            }`}
                        title="Code Block"
                    >
                        <Code className="w-4 h-4" />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => alert('Attachments feature ready')}
                    className="p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors text-gray-500 hover:text-gray-800"
                    title="Attach files"
                >
                    <Paperclip className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
