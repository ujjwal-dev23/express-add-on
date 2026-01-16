/// <reference lib="dom" />
import React from "react";
import { DocumentSandboxApi } from "../../../models/DocumentSandboxApi";
import { WatermarkSettings } from "../../../types";

interface InjectWatermarkOptions {
    onStart?: () => void;
    onSuccess?: () => void;
    onError?: (error: unknown) => void;
}

/**
 * Injects a watermark on all pages in the document.
 * 
 * @param sandboxProxy - The sandbox API proxy
 * @param settings - WatermarkSettings object containing blob, opacity, scale, and position
 * @param options - Optional callbacks for lifecycle events
 */
export const injectWatermark = async (
    sandboxProxy: DocumentSandboxApi,
    settings: WatermarkSettings,
    options: InjectWatermarkOptions = {}
): Promise<void> => {
    options.onStart?.();

    try {
        await sandboxProxy.injectWatermark(settings);
        options.onSuccess?.();
    } catch (error) {
        console.error("Error injecting watermark:", error);
        options.onError?.(error);
    }
};
