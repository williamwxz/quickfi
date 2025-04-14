'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  onUpload: (file: File) => void;
  className?: string;
}

export function FileUpload({
  accept,
  maxSize = 5 * 1024 * 1024, // 5MB default
  onUpload,
  className,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.size > maxSize) {
          setError(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
          return;
        }
        setFile(file);
        setError(null);
        onUpload(file);
      }
    },
    [maxSize, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    maxSize,
    multiple: false,
  });

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
        isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
        error && 'border-destructive',
        className
      )}
    >
      <input {...getInputProps()} />
      {file ? (
        <div className="flex items-center justify-between">
          <span className="text-sm">{file.name}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeFile();
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <div className="text-sm">
            {isDragActive ? (
              <p>Drop the file here</p>
            ) : (
              <p>
                Drag and drop a file here, or click to select
                {accept && <span className="text-muted-foreground"> ({accept})</span>}
              </p>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
} 