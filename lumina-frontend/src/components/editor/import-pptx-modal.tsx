'use client'

import React, { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/ui/file-upload'
import { useImportPptx, type SlideImportado } from '@/hooks/api/use-import-pptx'

interface ImportPptxModalProps {
  classId: string
  onImport: (slides: SlideImportado[]) => void
  onClose: () => void
}

export function ImportPptxModal({ classId, onImport, onClose }: ImportPptxModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const { mutate: importPptx, isPending } = useImportPptx(classId)

  const handleImportar = useCallback(() => {
    if (!file) return
    importPptx(file, {
      onSuccess: (data) => {
        toast.success(`${data.slidesImportados} slides importados correctamente`)
        onImport(data.slides)
        onClose()
      },
      onError: () => {
        toast.error('Error al importar el archivo. Verifica que sea un .pptx válido.')
      },
    })
  }, [file, importPptx, onImport, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Importar presentación PowerPoint
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="size-5" />
          </button>
        </div>

        {/* Descripción */}
        <p className="text-sm text-gray-500 mb-4">
          Importa un archivo .pptx y cada slide se convertirá en un slide de Lumina.
          Se preservan textos, imágenes y posiciones (~70-80% de fidelidad).
        </p>

        {/* Upload */}
        <FileUpload
          accept=".pptx"
          maxSizeMB={50}
          label="Arrastra tu presentación aquí"
          sublabel="Solo archivos .pptx · máx 50 MB"
          onFile={setFile}
          onClear={() => setFile(null)}
          disabled={isPending}
        />

        {/* Advertencias */}
        <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            No se importan: animaciones, SmartArt, gráficos, transiciones, videos embebidos.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 mt-5">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending} className="flex-1">
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={!file || isPending}
            onClick={handleImportar}
            className="flex-1 gap-2"
          >
            {isPending ? (
              <><Loader2 className="size-4 animate-spin" /> Importando...</>
            ) : (
              <><Upload className="size-4" /> Importar</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
