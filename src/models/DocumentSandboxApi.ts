import { ImageAsset, FitMode, WatermarkSettings, PageLayoutSettings } from "../types";

// This interface declares all the APIs that the document sandbox runtime ( i.e. code.ts ) exposes to the UI/iframe runtime
export interface DocumentSandboxApi {
    createRectangle(): void;
    getPages(): Promise<{ id: string; name: string; width: number; height: number; }[]>;
    importImages(images: ImageAsset[]): Promise<void>;
    fitToCanvas(fitMode: FitMode): Promise<void>;
    injectWatermark(settings: WatermarkSettings): Promise<void>;
    changePageLayout(settings: PageLayoutSettings): Promise<void>;
    resetAllPages(): Promise<void>;
}
