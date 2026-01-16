import { ImageAsset, FitMode } from "../types";

// This interface declares all the APIs that the document sandbox runtime ( i.e. code.ts ) exposes to the UI/iframe runtime
export interface DocumentSandboxApi {
    createRectangle(): void;
    importImages(images: ImageAsset[]): Promise<void>;
    fitToCanvas(fitMode: FitMode): Promise<void>;
}
