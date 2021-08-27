import { PNG } from 'pngjs'
import jsQR from 'jsqr'

import { qrNotDetected } from '../types/errors'

const decodePNG = async (buf): Promise<PNG> => {
  return new Promise((resolve, reject) => {
    new PNG({
      filterType: 4,
    }).parse(buf, function (error, data) {
      if (error) {
        reject(error)
        return
      }
      resolve(data)
    })
  })
}

export async function extractQRFromImage(sourceImage: Buffer): Promise<string> {
  const image = await decodePNG(sourceImage)
  const qrObj = jsQR(
    image.data as unknown as Uint8ClampedArray,
    image.width,
    image.height
  )

  if (!qrObj?.data) {
    throw qrNotDetected()
  }

  return qrObj.data || Buffer.from(qrObj.binaryData).toString()
}
