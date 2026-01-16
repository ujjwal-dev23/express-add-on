import { editor } from "express-document-sdk";

/**
 * Deletes all pages in the document.
 * This function removes every page from the document.
 * Note: The SDK requires at least one page to remain, so if there's only one page,
 * it will be cleared of content but not deleted.
 */
export async function resetAllPages(): Promise<void> {
    try {
        console.log("[Sandbox] Starting reset: deleting all pages...");

        // Perform all document mutations in a single queueAsyncEdit block
        await editor.queueAsyncEdit(async () => {
            const pages = editor.documentRoot.pages;
            
            // Collect all pages first to avoid issues while iterating
            const pagesToDelete = pages.toArray();
            
            if (pagesToDelete.length === 0) {
                console.log("[Sandbox] No pages to delete");
                return;
            }

            console.log(`[Sandbox] Found ${pagesToDelete.length} pages to delete`);

            // The SDK requires at least one page to remain.
            // If there's only one page, we can't delete it, but we can clear its content.
            if (pagesToDelete.length === 1) {
                const page = pagesToDelete[0];
                const artboard = page.artboards.first;
                if (artboard) {
                    // Clear all children from the artboard
                    const childrenToRemove = artboard.children.toArray();
                    if (childrenToRemove.length > 0) {
                        artboard.children.remove(...childrenToRemove);
                        console.log(`[Sandbox] Cleared ${childrenToRemove.length} items from the only page`);
                    }
                }
                console.log("[Sandbox] Cannot delete the last remaining page. Content cleared instead.");
                return;
            }

            // Remove all pages except the last one (SDK requires at least one page)
            // We'll keep the first page and remove all others
            if (pagesToDelete.length > 1) {
                // Remove all pages except the first one
                const pagesToRemove = pagesToDelete.slice(1);
                pages.remove(...pagesToRemove);
                
                // Clear content from the remaining page
                const remainingPage = pages.first;
                if (remainingPage) {
                    const artboard = remainingPage.artboards.first;
                    if (artboard) {
                        const childrenToRemove = artboard.children.toArray();
                        if (childrenToRemove.length > 0) {
                            artboard.children.remove(...childrenToRemove);
                        }
                    }
                }
                
                console.log(`[Sandbox] Reset complete. Deleted ${pagesToRemove.length} pages, cleared content from remaining page.`);
            }
        });

    } catch (error) {
        console.error("[Sandbox] Error during reset:", error);
        throw error;
    }
}
