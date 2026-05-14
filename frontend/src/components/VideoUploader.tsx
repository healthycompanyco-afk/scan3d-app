'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

export default function VideoUploader({ onFile }: { onFile: (file: File) => void }) {
  const [fileName, setFileName] = useState('')

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) { onFile(accepted[0]); setFileName(accepted[0].name) }
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.mov', '.avi', '.webm'] },
    multiple: false,
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
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
        <p className="text-4xl mb-3">🎥</p>
        <p className="font-semibold text-gray-700">
          {isDragActive ? 'Solta o vídeo aqui' : 'Arrasta o vídeo ou clica para selecionar'}
        </p>
        <p className="text-sm text-gray-400 mt-1">MP4, MOV, AVI, WEBM · Máximo 2GB</p>
      </div>
      {fileName && (
        <p className="text-sm text-green-600 mt-2 text-center">✓ {fileName}</p>
      )}
    </div>
  )
}
