import jsQR from 'jsqr'
import Jimp from 'jimp'

// import path from 'path'
import { qrNotDetected } from '../types/errors'

const splitImage = async (source: Buffer): Promise<Jimp[]> => {
  // Parse the image using Jimp.read() method
  const uncroppedLeft = await Jimp.read(source)
  const uncroppedRight = await Jimp.read(source)
  await uncroppedLeft.crop(
    0,
    0,
    Math.ceil(uncroppedLeft.bitmap.width / 2),
    uncroppedLeft.bitmap.height
  )
  // uncroppedLeft.write(path.join(__dirname, 'myimage1.png'))

  const width = Math.floor(uncroppedRight.bitmap.width / 2)
  const offset = Math.floor(width * 0.2)
  await uncroppedRight.crop(
    width - offset,
    0,
    width + offset,
    uncroppedRight.bitmap.height
  )
  // uncroppedRight.write(path.join(__dirname, 'myimage2.png'))

  return [uncroppedRight, uncroppedLeft]
}

const findQR = (images: Jimp[]): string[] => {
  const qrCodes: string[] = []

  for (const image of images) {
    const qrObj = jsQR(
      image.bitmap.data as unknown as Uint8ClampedArray,
      image.bitmap.width,
      image.bitmap.height
    )
    if (qrObj?.data) {
      qrCodes.push(qrObj.data || Buffer.from(qrObj.binaryData).toString())
    }
  }
  return qrCodes
}

export async function extractQRFromImage(
  sourceImage: Buffer
): Promise<string[]> {
  const image: Jimp = await Jimp.read(sourceImage)

  let qrs = findQR([image])

  if (qrs.length === 0) {
    // half image vertically
    const parts = await splitImage(sourceImage)
    qrs = findQR(parts)
  }

  if (qrs.length === 0) {
    throw qrNotDetected()
  }
  return qrs
}
