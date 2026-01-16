import { editor, PageNode } from "express-document-sdk";
import { PageLayoutSettings } from "../../../types";

/**
 * Changes the format/dimensions of all pages in the document.
 * 
 * @param settings - PageLayoutSettings object containing width and height
 */
export async function changePageLayout(settings: PageLayoutSettings): Promise<void> {
    try {
        const { width, height } = settings;
        console.log(`[Sandbox] Starting page layout change to dimensions: ${width}x${height}`);

        // Validate dimensions
        if (width <= 0 || height <= 0) {
            throw new Error(`Invalid dimensions: width and height must be positive numbers. Received: ${width}x${height}`);
        }

        // Get all pages in the document
        const pages = editor.documentRoot.pages;
        
        if (pages.length === 0) {
            console.warn("[Sandbox] No pages found in document");
            return;
        }

        await editor.queueAsyncEdit(async () => {
            let pagesUpdated = 0;

            // Iterate through all pages and update their dimensions
            for (const page of pages) {
                console.log(`[Sandbox] Updating page "${page.name || 'unnamed'}" dimensions`);

                // Set new page dimensions
                // Note: All artboards within a page automatically share the page's dimensions
                page.width = width;
                page.height = height;

                pagesUpdated++;
                console.log(`[Sandbox] Page "${page.name || 'unnamed'}" updated to ${width}x${height}`);
            }

            console.log(`[Sandbox] Page layout change complete. Updated ${pagesUpdated} pages.`);
        });

    } catch (error) {
        console.error("[Sandbox] Error during page layout change:", error);
        throw error;
    }
}
