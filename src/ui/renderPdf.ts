import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const MAX_STORED_DIMENSION = 1600
const JPEG_QUALITY = 0.85
const MAX_PAGES = 30

export interface RenderedPage {
  src: string
  width: number
  height: number
}

export async function renderPdfPages(file: File): Promise<RenderedPage[]> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pageCount = Math.min(pdf.numPages, MAX_PAGES)
  const pages: RenderedPage[] = []

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i)
    const baseViewport = page.getViewport({ scale: 1 })
    const scale = Math.min(2, MAX_STORED_DIMENSION / Math.max(baseViewport.width, baseViewport.height))
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    const ctx = canvas.getContext('2d')!
    await page.render({ canvas, canvasContext: ctx, viewport }).promise

    pages.push({
      src: canvas.toDataURL('image/jpeg', JPEG_QUALITY),
      width: canvas.width,
      height: canvas.height,
    })
  }

  return pages
}
