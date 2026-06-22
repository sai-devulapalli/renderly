export type { PdfError, PdfErrorCode } from './errors.js';
export { PDF_ERROR_CODES } from './errors.js';
export type { PdfNodeRenderer, PdfRegistry, RenderChildrenFn, PdfDoc } from './types.js';
export {
  renderContainer, renderHeading, renderText,
  renderInputText, renderInputNumber, renderInputDate, renderInputChoice,
  renderSubmit, renderFormError, renderFieldError,
} from './renderers.js';
export { createPdfRegistry, createDefaultPdfRegistry } from './registry.js';
export { renderNodes } from './render.js';
export type { RenderPdfOptions } from './adapter.js';
export { renderDocument } from './adapter.js';
// Note: renderDocument returns Promise<Result<Buffer, PdfError>>
