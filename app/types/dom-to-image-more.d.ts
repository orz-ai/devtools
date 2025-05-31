declare module 'dom-to-image-more' {
  export interface DomToImageOptions {
    /** Width in pixels to be applied to node before rendering */
    width?: number;
    /** Height in pixels to be applied to node before rendering */
    height?: number;
    /** A string value for fill style of canvas */
    backgroundColor?: string;
    /** Pixel ratio of the output image */
    scale?: number;
    /** Whether to render each child node separately */
    cacheBust?: boolean;
    /** Predicate function which removes nodes from the DOM */
    filter?: (node: Node) => boolean;
    /** CORS credentials to use */
    imagePlaceholder?: string;
    /** Quality of the image (0-1) */
    quality?: number;
    /** Use CORS proxy */
    proxy?: string;
    /** Whether to use credentials for CORS */
    useCORS?: boolean;
  }

  /**
   * Converts DOM node to PNG image
   * @param node DOM node to convert
   * @param options Conversion options
   * @returns Promise that resolves to PNG image data URL
   */
  export function toPng(node: HTMLElement, options?: DomToImageOptions): Promise<string>;

  /**
   * Converts DOM node to JPEG image
   * @param node DOM node to convert
   * @param options Conversion options
   * @returns Promise that resolves to JPEG image data URL
   */
  export function toJpeg(node: HTMLElement, options?: DomToImageOptions): Promise<string>;

  /**
   * Converts DOM node to SVG image
   * @param node DOM node to convert
   * @param options Conversion options
   * @returns Promise that resolves to SVG image data URL
   */
  export function toSvg(node: HTMLElement, options?: DomToImageOptions): Promise<string>;

  /**
   * Converts DOM node to Blob
   * @param node DOM node to convert
   * @param options Conversion options
   * @returns Promise that resolves to Blob
   */
  export function toBlob(node: HTMLElement, options?: DomToImageOptions): Promise<Blob>;

  /**
   * Converts DOM node to pixel data
   * @param node DOM node to convert
   * @param options Conversion options
   * @returns Promise that resolves to pixel data
   */
  export function toPixelData(node: HTMLElement, options?: DomToImageOptions): Promise<Uint8ClampedArray>;

  export default {
    toPng,
    toJpeg,
    toSvg,
    toBlob,
    toPixelData
  };
} 