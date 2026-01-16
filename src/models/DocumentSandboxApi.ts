import { ImageAsset, FitMode, WatermarkSettings, PageLayoutSettings } from "../types";

// This interface declares all the APIs that the document sandbox runtime ( i.e. code.ts ) exposes to the UI/iframe runtime
export interface DocumentSandboxApi {
    createRectangle(): void;
    getPages(range?: { start: number, end: number }): Promise<{ id: string; name: string; width: number; height: number; }[]>;
    importImages(images: ImageAsset[]): Promise<void>;
    fitToCanvas(fitMode: FitMode, range?: { start: number, end: number }): Promise<void>;
    injectWatermark(settings: WatermarkSettings, range?: { start: number, end: number }): Promise<void>;
    changePageLayout(settings: PageLayoutSettings, range?: { start: number, end: number }): Promise<void>;
    resetAllPages(): Promise<void>;
}
