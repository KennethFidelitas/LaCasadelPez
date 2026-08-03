'use client'

import { useState } from 'react'

// Hook de estado puro (sin JSX, sin RHF) para el manejo granular de imágenes
// en los formularios de Editar (producto y animal). Cada formulario renderiza
// su propia UI (shadcn en uno, HTML nativo en el otro) sobre este mismo estado.
//
// keptImages: URLs existentes que el admin no eliminó (arranca = initialImages).
// newFiles: archivos nuevos seleccionados, agregados (no reemplazan keptImages).
// El payload final a guardar es siempre [...keptImages, ...urls de newFiles subidas].

const DEFAULT_MAX_IMAGES = 5
const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

interface UseGestionImagenesOptions {
  initialImages: string[]
  maxImages?: number
  maxSizeBytes?: number
  allowedTypes?: readonly string[]
}

export function useGestionImagenes({
  initialImages,
  maxImages = DEFAULT_MAX_IMAGES,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
}: UseGestionImagenesOptions) {
  const [keptImages, setKeptImages] = useState<string[]>(initialImages)
  const [newFiles, setNewFiles] = useState<File[]>([])

  const totalCount = keptImages.length + newFiles.length

  function removeExisting(url: string) {
    setKeptImages((current) => current.filter((img) => img !== url))
  }

  // Deshacer: reinserta respetando el orden original.
  function restoreExisting(url: string) {
    setKeptImages((current) => {
      if (current.includes(url)) return current
      const next = new Set([...current, url])
      return initialImages.filter((img) => next.has(img))
    })
  }

  function removeNewFile(index: number) {
    setNewFiles((current) => current.filter((_, i) => i !== index))
  }

  /** Agrega archivos nuevos (no reemplaza). Devuelve un mensaje de error o null si todo ok. */
  function addFiles(files: File[]): string | null {
    if (files.length === 0) return null

    const disponibles = maxImages - totalCount
    if (files.length > disponibles) {
      return disponibles > 0
        ? `Máximo ${maxImages} imágenes. Tenés ${totalCount}, podés agregar ${disponibles} más.`
        : `Ya tenés el máximo de ${maxImages} imágenes. Quitá alguna antes de agregar otra.`
    }

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return 'Las imágenes deben ser JPG, PNG o WEBP.'
      }
      if (file.size > maxSizeBytes) {
        return `Cada imagen puede pesar como máximo ${maxSizeBytes / 1024 / 1024} MB.`
      }
    }

    setNewFiles((current) => [...current, ...files])
    return null
  }

  function reset() {
    setKeptImages(initialImages)
    setNewFiles([])
  }

  return {
    keptImages,
    newFiles,
    totalCount,
    maxImages,
    /** true si el admin quitó al menos una existente o agregó al menos una nueva. */
    hasChanges: newFiles.length > 0 || keptImages.length !== initialImages.length,
    addFiles,
    removeExisting,
    restoreExisting,
    removeNewFile,
    reset,
  }
}
