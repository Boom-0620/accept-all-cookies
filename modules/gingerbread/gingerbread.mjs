import './film.js';
import './gingerbread.js';
export function mountGingerbread(container, options = {}) {
  return globalThis.GingerbreadAd.mount(container, {
    assetBase: new URL('./assets/', import.meta.url).href,
    stylesheetURL: new URL('./gingerbread.css', import.meta.url).href,
    ...options
  });
}
export default mountGingerbread;
