export type { WcError, WcErrorCode } from './errors.js';
export type {
  SubmitValues,
  RenderlySubmitDetail,
  RenderlySubmitEvent,
  RenderlyErrorEvent,
} from './types.js';

// Import as a local binding so it's in scope for the define() call below.
import { RenderlyFormElement } from './element.js';
export { RenderlyFormElement };

// Register the custom element on import.
// Guarded so bundlers that include this module multiple times don't throw.
if (!customElements.get('renderly-form')) {
  customElements.define('renderly-form', RenderlyFormElement);
}
