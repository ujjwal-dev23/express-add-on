import { editor, PageNode, ArtboardNode, MediaContainerNode } from "express-document-sdk";
import { ImageAsset } from "../../../types";

/**
 * Bulk imports images into the document.
 * Each image is placed on its own newly created page.
 * 
 * @param images - Array of ImageAsset objects containing the image blob and name.
 */
export async function importImages(images: ImageAsset[]): Promise<void> {
    try {
        console.log(`[Sandbox] Starting bulk import of ${images.length} images...`);

        // 1. First, load all bitmaps in parallel. 
        // This is the "asynchronous wait" that pauses the current execution context.
        const imageTasks = images.map(async (asset, index) => {
            console.log(`[Sandbox] Loading bitmap ${index + 1}/${images.length}: ${asset.name}`);
            const bitmap = await editor.loadBitmapImage(asset.blob);
            return { bitmap, name: asset.name };
        });

        const loadedAssets = await Promise.all(imageTasks);
        console.log(`[Sandbox] All bitmaps loaded. Scheduling document mutations...`);

        // 2. Perform all document mutations in a single queueAsyncEdit block.
        // This ensures all changes are grouped and correctly handled by the SDK.
        await editor.queueAsyncEdit(async () => {
            const currentPage = editor.context.currentPage;
            const width = currentPage.width;
            const height = currentPage.height;

            for (const asset of loadedAssets) {
                console.log(`[Sandbox] Creating container and page for "${asset.name}"...`);

                // 3. Create a new page.
                const newPage = editor.documentRoot.pages.addPage({ width, height });

                // 4. Create an image container for the bitmap.
                const imageContainer = editor.createImageContainer(asset.bitmap);

                // 5. Append the image container to the artboard.
                const artboard = newPage.artboards.first!;
                artboard.children.append(imageContainer);

                // 6. Position the image container.
                const containerBounds = imageContainer.boundsLocal;
                imageContainer.translation = {
                    x: (artboard.width - containerBounds.width) / 2,
                    y: (artboard.height - containerBounds.height) / 2
                };
            }
        });

        console.log(`[Sandbox] Bulk import complete. ${images.length} pages created.`);

    } catch (error) {
        console.error("[Sandbox] Error during bulk import:", error);
        throw error;
    }
}
