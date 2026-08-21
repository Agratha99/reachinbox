'use client';

import React, { useRef, useState } from 'react';
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
    X,
    FileText,
    FileImage,
    FileArchive,
    File
} from 'lucide-react';

interface AttachedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    dataUrl: string;
}

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachments, setAttachments] = useState<AttachedFile[]>([]);

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

    const handlePaperclipClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                const newFile: AttachedFile = {
                    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    dataUrl,
                };

                setAttachments((prev) => [...prev, newFile]);

                // If image file, insert inline img tag into editor HTML
                if (file.type.startsWith('image/')) {
                    const imgHtml = `<p><img src="${dataUrl}" alt="${file.name}" style="max-width: 100%; max-height: 400px; border-radius: 12px; margin: 8px 0; border: 1 border-gray-200;" /></p>`;
                    editor.chain().focus().insertContent(imgHtml).run();
                } else {
                    // For documents/other files, append download link to body
                    const linkHtml = `<p><a href="${dataUrl}" download="${file.name}" style="color: #2563eb; text-decoration: underline; font-weight: 500;">📎 Attachment: ${file.name} (${formatFileSize(file.size)})</a></p>`;
                    editor.chain().focus().insertContent(linkHtml).run();
                }
            };
            reader.readAsDataURL(file);
        });

        // Reset file input so same file can be picked again if needed
        if (e.target) e.target.value = '';
    };

    const removeAttachment = (id: string) => {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <FileImage className="w-4 h-4 text-emerald-600" />;
        if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text'))
            return <FileText className="w-4 h-4 text-blue-600" />;
        if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('tar'))
            return <FileArchive className="w-4 h-4 text-amber-600" />;
        return <File className="w-4 h-4 text-gray-600" />;
    };

    return (
        <div
            onClick={() => editor.chain().focus().run()}
            className="border border-gray-200/90 rounded-2xl overflow-hidden bg-white/90 flex flex-col min-h-[380px] focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all shadow-2xs cursor-text"
        >
            {/* Hidden Native File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
            />

            {/* Editor Main Content Area */}
            <div
                className="p-5 sm:p-6 flex-1 flex flex-col cursor-text min-h-[300px]"
                onClick={(e) => {
                    e.stopPropagation();
                    editor.chain().focus().run();
                }}
            >
                <EditorContent
                    editor={editor}
                    className="prose max-w-none text-sm sm:text-base text-gray-800 focus:outline-none flex-1 min-h-[300px] leading-relaxed [&_*]:outline-none [&_*]:shadow-none"
                />

                {/* Attachments Preview Container */}
                {attachments.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                            Attached Files ({attachments.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {attachments.map((att) => (
                                <div
                                    key={att.id}
                                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gray-100 border border-gray-200/80 text-xs text-gray-800 font-medium group hover:bg-gray-200/70 transition-all"
                                >
                                    {getFileIcon(att.type)}
                                    <span className="max-w-[150px] truncate">{att.name}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        ({formatFileSize(att.size)})
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeAttachment(att.id);
                                        }}
                                        className="p-0.5 rounded-full hover:bg-rose-100 hover:text-rose-600 text-gray-400 transition-colors ml-1"
                                        title="Remove file"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
                    onClick={handlePaperclipClick}
                    className="p-1.5 rounded-lg hover:bg-emerald-100 hover:text-emerald-700 transition-all text-gray-500 flex items-center space-x-1 border border-gray-200 hover:border-emerald-300"
                    title="Attach files (Images, PDFs, Docs)"
                >
                    <Paperclip className="w-4 h-4" />
                    <span className="text-xs font-semibold">Attach</span>
                </button>
            </div>
        </div>
    );
}

