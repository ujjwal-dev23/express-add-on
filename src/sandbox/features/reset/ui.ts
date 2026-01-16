/// <reference lib="dom" />
import { DocumentSandboxApi } from "../../../models/DocumentSandboxApi";

interface ResetAllPagesOptions {
    onStart?: () => void;
    onSuccess?: () => void;
    onError?: (error: unknown) => void;
}

/**
 * Deletes all pages in the document.
 * 
 * @param sandboxProxy - The sandbox API proxy
 * @param options - Optional callbacks for lifecycle events
 */
export const resetAllPages = async (
    sandboxProxy: DocumentSandboxApi,
    options: ResetAllPagesOptions = {}
): Promise<void> => {
    options.onStart?.();
    try {
        await sandboxProxy.resetAllPages();
        options.onSuccess?.();
    } catch (error) {
        console.error("[UI] Error resetting all pages:", error);
        options.onError?.(error);
    }
};
