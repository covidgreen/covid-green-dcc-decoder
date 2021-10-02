// eslint-disable-next-line
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
// import workerEntry from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import Canvas from 'canvas'

import { qrNotDetected } from '../types/errors'

import { extractQRFromImage } from './'

// Some PDFs need external cmaps.
const CMAP_URL = '../../node_modules/pdfjs-dist/cmaps'
const CMAP_PACKED = true

type CanvasAndContext = {
  canvas: Canvas.Canvas
  context: Canvas.NodeCanvasRenderingContext2D
}

// pdfjsLib.GlobalWorkerOptions.workerSrc = workerEntry

// eslint-disable-next-line
function NodeCanvasFactory() {}
NodeCanvasFactory.prototype = {
  create: function NodeCanvasFactory_create(
    width: number,
    height: number
  ): CanvasAndContext {
    const canvas = Canvas.createCanvas(width, height)
    const context = canvas.getContext('2d')
    return {
      canvas,
      context,
    }
  },

  reset: function NodeCanvasFactory_reset(
    canvasAndContext: CanvasAndContext,
    width: number,
    height: number
  ) {
    canvasAndContext.canvas.width = width
    canvasAndContext.canvas.height = height
  },

  destroy: function NodeCanvasFactory_destroy(
    canvasAndContext: CanvasAndContext
  ) {
    // Zeroing the width and height cause Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
    canvasAndContext.canvas.width = 0
    canvasAndContext.canvas.height = 0
    canvasAndContext.canvas = null
    canvasAndContext.context = null
  },
}

export async function extractQRFromPDF(pdf: Buffer): Promise<string[]> {
  // covert p[df to image
  // eslint-disable-next-line
  const pdfDoc = await pdfjsLib.getDocument({
    data: pdf,
    cMapUrl: CMAP_URL,
    cMapPacked: CMAP_PACKED,
  }).promise

  // we will read max 3 pages from a pdf
  const pageMax = Math.min(pdfDoc.numPages, 1)
  let pageCount = 1
  let qrData

  while (!qrData && pageCount <= pageMax) {
    const page = await pdfDoc.getPage(pageCount)

    // Render the page on a Node canvas with 100% scale.
    const viewport = page.getViewport({ scale: 1.4 })
    const canvasFactory = new NodeCanvasFactory()
    const canvasAndContext = canvasFactory.create(
      viewport.width,
      viewport.height
    )
    const renderContext = {
      canvasContext: canvasAndContext.context,
      viewport,
      canvasFactory,
    }

    await page.render(renderContext).promise

    const image = canvasAndContext.canvas.toBuffer()

    try {
      qrData = await extractQRFromImage(image)
    } catch (e) {
      // no image in page
      console.log(e, 'Decode Image Exception')
    }
    pageCount += 1
  }
  if (!qrData || qrData.length === 0) {
    throw qrNotDetected()
  }

  return qrData
}
