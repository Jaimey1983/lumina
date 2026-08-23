import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface SlideImportado {
  titulo: string
  bloques: Record<string, unknown>[]
  fondo: { tipo: 'color'; valor: string }
  layout: string
}

export interface ImportPptxResult {
  classId: string
  slidesImportados: number
  slides: SlideImportado[]
}

export function useImportPptx(classId: string) {
  return useMutation({
    mutationFn: async (file: File): Promise<ImportPptxResult> => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post(
        `/classes/${classId}/import-pptx`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return data
    },
  })
}
