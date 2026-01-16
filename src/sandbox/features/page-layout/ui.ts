/// <reference lib="dom" />
import { DocumentSandboxApi } from "../../../models/DocumentSandboxApi";
import { PageLayoutSettings } from "../../../types";

interface ChangePageLayoutOptions {
    onStart?: () => void;
    onSuccess?: () => void;
    onError?: (error: unknown) => void;
}

/**
 * Changes the format/dimensions of all pages in the document.
 * 
 * @param sandboxProxy - The sandbox API proxy
 * @param settings - PageLayoutSettings object containing width and height
 * @param options - Optional callbacks for lifecycle events
 */
export const changePageLayout = async (
    sandboxProxy: DocumentSandboxApi,
    settings: PageLayoutSettings,
    options: ChangePageLayoutOptions = {}
): Promise<void> => {
    options.onStart?.();
    try {
        await sandboxProxy.changePageLayout(settings);
        options.onSuccess?.();
    } catch (error) {
        console.error("[UI] Error changing page layout:", error);
        options.onError?.(error);
    }
};
