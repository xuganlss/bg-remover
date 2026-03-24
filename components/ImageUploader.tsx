'use client';

import { useRef, useState, useCallback } from 'react';

interface ImageUploaderProps {
  onImageSelect: (file: File, previewUrl: string) => void;
  disabled?: boolean;
}

export default function ImageUploader({ onImageSelect, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    onImageSelect(file, url);
  }, [onImageSelect]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`
        relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
        ${isDragging
          ? 'border-purple-500 bg-purple-50 scale-[1.01]'
          : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
      />

      {/* Upload icon */}
      <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>

      <p className="text-lg font-semibold text-gray-700 mb-1">
        {isDragging ? 'Drop your image here' : 'Upload an image'}
      </p>
      <p className="text-sm text-gray-500">
        Drag & drop or <span className="text-purple-600 font-medium">browse</span>
      </p>
      <p className="text-xs text-gray-400 mt-2">JPG, PNG, WebP · Max 10MB</p>
    </div>
  );
}
