export type FitMode = "fill" | "contain";
export type ExportFormat = "png" | "jpg" | "pdf";
export type AspectRatio = "1:1" | "9:16" | "16:9";

export interface ImageAsset {
    blob: Blob;
    name: string;
}

export interface WatermarkSettings {
    blob: Blob;
    opacity: number;
    scale: number;
    position: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center";
}

export interface VisualProperties {
    brightness: number;
    contrast: number;
    saturation: number;
    exposure: number;
    filterName?: string;
}

export interface PageLayoutSettings {
    width: number;
    height: number;
}

export type AddonMessage =
    | { type: "IMPORT_IMAGES"; payload: ImageAsset[] }
    | { type: "FIT_TO_CANVAS"; payload: { fitMode: FitMode } }
    | { type: "SYNC_PROPERTIES"; payload: VisualProperties }
    | { type: "INJECT_WATERMARK"; payload: WatermarkSettings }
    | { type: "BATCH_EXPORT"; payload: { format: ExportFormat; prefix: string } }
    | { type: "AI_REMOVE_BG"; payload: null }
    | { type: "CHANGE_LAYOUT"; payload: { ratio: AspectRatio } }
    | { type: "UI_READY"; payload: null }
    | { type: "ERROR"; payload: { message: string, source: "IMPORT" | "SYNC" | "EXPORT" | "SYSTEM" } };
