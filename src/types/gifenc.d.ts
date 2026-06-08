declare module "gifenc" {
  export interface GIFEncoderType {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: { palette?: number[][]; delay?: number; transparent?: boolean; dispose?: number; first?: boolean; repeat?: number },
    ): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    reset(): void;
  }
  export function GIFEncoder(opts?: { auto?: boolean; initialCapacity?: number }): GIFEncoderType;
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    opts?: { format?: "rgb444" | "rgb565" | "rgba4444"; oneBitAlpha?: boolean | number; clearAlpha?: boolean; clearAlphaThreshold?: number; clearAlphaColor?: number },
  ): number[][];
  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: "rgb444" | "rgb565" | "rgba4444",
  ): Uint8Array;
}

// Default export for CJS interop (Vite SSR named-export bridge)
declare module "gifenc" {
  const _default: {
    GIFEncoder: typeof GIFEncoder;
    quantize: typeof quantize;
    applyPalette: typeof applyPalette;
  };
  export default _default;
}
