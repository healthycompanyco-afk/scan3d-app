'use client'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

export default function PhotoUploader({ onFiles }: { onFiles: (files: File[]) => void }) {
  const onDrop = useCallback((accepted: File[]) => onFiles(accepted), [onFiles])

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: true,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${
          isDragActive ? 'border-brand-600 bg-brand-50' : 'border-gray-300 hover:border-brand-400'
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-4xl mb-3">📷</p>
        <p className="font-semibold text-gray-700">
          {isDragActive ? 'Solta as fotos aqui' : 'Arrasta as fotos ou clica para selecionar'}
        </p>
        <p className="text-sm text-gray-400 mt-1">JPG, PNG, WEBP · Mínimo 30 fotos recomendado</p>
      </div>
      {acceptedFiles.length > 0 && (
        <p className="text-sm text-green-600 mt-2 text-center">
          ✓ {acceptedFiles.length} foto{acceptedFiles.length !== 1 ? 's' : ''} selecionada{acceptedFiles.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
