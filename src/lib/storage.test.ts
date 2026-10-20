import { describe, expect, it } from 'vitest'
import { extensionOf, UPLOAD_RULES, validateFile } from './storage'

function makeFile(name: string, size = 1024, type = 'application/octet-stream') {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size, configurable: true })
  return file
}

describe('extensionOf', () => {
  it('lowercases the extension', () => {
    expect(extensionOf('Report.PDF')).toBe('pdf')
  })

  it('returns an empty string when there is no extension', () => {
    expect(extensionOf('README')).toBe('')
  })

  it('treats a leading-dot name as having no extension', () => {
    expect(extensionOf('.env')).toBe('')
  })

  it('takes the last extension when a name contains several dots', () => {
    expect(extensionOf('archive.tar.gz')).toBe('gz')
  })
})

describe('validateFile', () => {
  it('accepts an allowed document type', () => {
    expect(validateFile(makeFile('notes.pdf'))).toBeNull()
    expect(validateFile(makeFile('slides.pptx'))).toBeNull()
  })

  it('accepts an allowed image type', () => {
    expect(validateFile(makeFile('avatar.png'))).toBeNull()
  })

  it('rejects a disallowed extension', () => {
    // The message should name what IS allowed, not just say no.
    const message = validateFile(makeFile('payload.exe'))
    expect(message).toContain('Allowed types')
    expect(message).toContain('pdf')
  })

  it('rejects a file with no extension at all', () => {
    expect(validateFile(makeFile('Makefile'))).toBe('That file has no extension.')
  })

  it('rejects a dotfile such as .env', () => {
    expect(validateFile(makeFile('.env'))).toBe('That file has no extension.')
  })

  it('rejects anything over the size limit', () => {
    const tooBig = makeFile('huge.pdf', UPLOAD_RULES.maxBytes + 1)
    expect(validateFile(tooBig)).toBe(`Files must be under ${UPLOAD_RULES.maxLabel}.`)
  })

  it('accepts a file exactly at the size limit', () => {
    expect(validateFile(makeFile('exact.pdf', UPLOAD_RULES.maxBytes))).toBeNull()
  })

  it('rejects a non-image in images-only mode', () => {
    const message = validateFile(makeFile('notes.pdf'), { imagesOnly: true })
    expect(message).toContain('PNG')
  })

  it('accepts an image in images-only mode', () => {
    expect(validateFile(makeFile('photo.webp'), { imagesOnly: true })).toBeNull()
  })

  it('is case-insensitive about extensions', () => {
    expect(validateFile(makeFile('SCAN.PDF'))).toBeNull()
    expect(validateFile(makeFile('PAYLOAD.EXE'))).not.toBeNull()
  })
})
