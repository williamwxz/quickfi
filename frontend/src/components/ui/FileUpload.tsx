'use client';

import { ChangeEvent, useState } from 'react';
import Button from './Button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFileTypes?: string;
  maxFileSizeMB?: number;
  label?: string;
  className?: string;
}

export default function FileUpload({
  onFileSelect,
  acceptedFileTypes = '.pdf,.jpg,.jpeg,.png',
  maxFileSizeMB = 10,
  label = 'Upload Document',
  className = '',
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    validateAndSetFile(selectedFile);
  };
  
  const validateAndSetFile = (selectedFile: File | undefined) => {
    setError(null);
    
    if (!selectedFile) return;
    
    // Check file size
    const fileSizeInMB = selectedFile.size / (1024 * 1024);
    if (fileSizeInMB > maxFileSizeMB) {
      setError(`File size exceeds the maximum allowed size (${maxFileSizeMB}MB)`);
      return;
    }
    
    // Check file type if acceptedFileTypes is defined
    if (acceptedFileTypes && acceptedFileTypes !== '*') {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      const acceptedTypes = acceptedFileTypes.split(',').map(type => 
        type.trim().replace('.', '').toLowerCase()
      );
      
      if (fileExtension && !acceptedTypes.includes(fileExtension)) {
        setError(`Invalid file type. Accepted types: ${acceptedFileTypes}`);
        return;
      }
    }
    
    setFile(selectedFile);
    onFileSelect(selectedFile);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };
  
  return (
    <div className={`${className}`}>
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5' : 'border-base-300'}
          ${error ? 'border-error' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <input
          id="file-upload"
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center space-y-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          
          <div className="text-sm text-neutral-content">
            <p className="font-medium">{label}</p>
            <p className="mt-1">Drag and drop or click to browse</p>
          </div>
          
          {file && (
            <div className="mt-2 p-2 bg-base-200 rounded-md flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm truncate max-w-xs">{file.name}</span>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-error">{error}</p>
      )}
      
      {file && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
            }}
          >
            Remove
          </Button>
        </div>
      )}
    </div>
  );
} 