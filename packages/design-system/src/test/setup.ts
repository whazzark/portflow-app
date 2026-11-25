import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom lacks what the Radix primitives call on open: pointer capture, scrolling an
// item into view, and observing the size of an element.
Element.prototype.hasPointerCapture = () => false
Element.prototype.setPointerCapture = () => {}
Element.prototype.releasePointerCapture = () => {}
Element.prototype.scrollIntoView = () => {}
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

afterEach(() => cleanup())
