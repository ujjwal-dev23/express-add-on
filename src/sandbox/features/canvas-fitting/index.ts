import { editor, PageNode, ArtboardNode, MediaContainerNode, Node } from "express-document-sdk";
import { FitMode } from "../../../types";

/**
 * Applies fit mode (fill/contain) to all image containers across all pages.
 * Fill mode uses ResizeBehavior.cover to fill the entire artboard.
 * Contain mode uses ResizeBehavior.contain to fit within the artboard.
 * 
 * @param fitMode - Either "fill" (cover) or "contain" (fit within bounds)
 */
export async function fitToCanvas(fitMode: FitMode): Promise<void> {
    try {
        console.log(`[Sandbox] Starting fit to canvas: mode=${fitMode}`);

        // Get all pages in the document
        const pages = editor.documentRoot.pages;
        let totalContainers = 0;

        // Perform all document mutations in a single queueAsyncEdit block
        await editor.queueAsyncEdit(async () => {
            // Iterate through all pages
            for (const page of pages) {
                const artboard = page.artboards.first;
                if (!artboard) continue;

                const artboardWidth = artboard.width;
                const artboardHeight = artboard.height;

                // Find all image containers on this page's artboard
                // Use type property instead of instanceof (doesn't work in sandboxed context)
                // SceneNodeType.mediaContainer = "MediaContainer"
                for (const child of artboard.children) {
                    if (child.type === "MediaContainer") {
                        totalContainers++;
                        const container = child as MediaContainerNode;
                        
                        console.log(`[Sandbox] Applying ${fitMode} to container on page "${page.name || 'unnamed'}"`);
                        
                        // Get initial container state for logging
                        const initialBounds = container.boundsLocal;
                        console.log(`[Sandbox] Initial container size: ${initialBounds.width}x${initialBounds.height}`);

                        // Get original media dimensions (preserve aspect ratio - no cropping)
                        const maskShape = container.maskShape;
                        const mediaRect = container.mediaRectangle;
                        const mediaWidth = mediaRect.width;
                        const mediaHeight = mediaRect.height;
                        const mediaAspectRatio = mediaWidth / mediaHeight;
                        const artboardAspectRatio = artboardWidth / artboardHeight;
                        
                        console.log(`[Sandbox] Media dimensions: ${mediaWidth}x${mediaHeight}, aspect ratio: ${mediaAspectRatio.toFixed(2)}`);
                        console.log(`[Sandbox] Artboard dimensions: ${artboardWidth}x${artboardHeight}, aspect ratio: ${artboardAspectRatio.toFixed(2)}`);
                        
                        // Calculate target container size based on fit mode
                        // Always use proportional scaling to preserve aspect ratio and ALL image data
                        let targetWidth: number;
                        let targetHeight: number;
                        
                        if (fitMode === "contain") {
                            // Contain: Shrinks or grows until entire image fits inside the box
                            // Image fits within artboard, may have empty space, NO CROPPING
                            if (mediaAspectRatio > artboardAspectRatio) {
                                // Media is wider - fit to width (height will be smaller)
                                targetWidth = artboardWidth;
                                targetHeight = artboardWidth / mediaAspectRatio;
                            } else {
                                // Media is taller - fit to height (width will be smaller)
                                targetHeight = artboardHeight;
                                targetWidth = artboardHeight * mediaAspectRatio;
                            }
                            
                            console.log(`[Sandbox] Contain mode - scaling to fit within: ${targetWidth.toFixed(0)}x${targetHeight.toFixed(0)}`);
                        } else {
                            // Fill: Grows until entire canvas is covered
                            // Implementation: If document height > width, make image height = document height
                            //                If document height < width, make image width = document width
                            // Maintain aspect ratio and center the image
                            
                            console.log(`[Sandbox] Fill mode - document: ${artboardWidth}x${artboardHeight}`);
                            console.log(`[Sandbox] Fill mode - media aspect ratio: ${mediaAspectRatio.toFixed(2)}`);
                            console.log(`[Sandbox] Fill mode - checking: artboardHeight (${artboardHeight}) > artboardWidth (${artboardWidth})? ${artboardHeight > artboardWidth}`);
                            
                            if (artboardHeight > artboardWidth) {
                                // Document height > width: make image height = document height
                                targetHeight = artboardHeight;
                                // Scale width proportionally to maintain aspect ratio
                                targetWidth = artboardHeight * mediaAspectRatio;
                                console.log(`[Sandbox] Fill mode - height > width: setting height to ${targetHeight}, width to ${targetWidth.toFixed(0)}`);
                            } else {
                                // Document height <= width: make image width = document width
                                targetWidth = artboardWidth;
                                // Scale height proportionally to maintain aspect ratio
                                targetHeight = artboardWidth / mediaAspectRatio;
                                console.log(`[Sandbox] Fill mode - height <= width: setting width to ${targetWidth}, height to ${targetHeight.toFixed(0)}`);
                            }
                            
                            console.log(`[Sandbox] Fill mode - final target: ${targetWidth.toFixed(0)}x${targetHeight.toFixed(0)} (maintains aspect ratio ${mediaAspectRatio.toFixed(2)})`);
                        }
                        
                        // Resize container using proportional behavior - preserves ALL image data, no cropping
                        // IMPORTANT: When using proportional, only provide width OR height, not both
                        try {
                            const containerNode = container as unknown as Node & {
                                resize: (options: {
                                    width?: number;
                                    height?: number;
                                    behavior: "contain" | "cover" | "proportional";
                                    avoidScalingVisualDetailsIfPossible: boolean;
                                }) => void;
                            };
                            
                            console.log(`[Sandbox] Resizing container to ${targetWidth.toFixed(0)}x${targetHeight.toFixed(0)} with proportional behavior`);
                            
                            // With proportional behavior, only provide one dimension (the one that determines the scale)
                            // For fill mode: use the dimension that matches the document size
                            // For contain mode: use the dimension that matches the document size
                            let resizeOptions: {
                                width?: number;
                                height?: number;
                                behavior: "proportional";
                                avoidScalingVisualDetailsIfPossible: boolean;
                            };
                            
                            if (fitMode === "fill") {
                                if (artboardHeight > artboardWidth) {
                                    // Fill: height = document height, so provide height
                                    resizeOptions = {
                                        height: targetHeight,
                                        behavior: "proportional",
                                        avoidScalingVisualDetailsIfPossible: true
                                    };
                                } else {
                                    // Fill: width = document width, so provide width
                                    resizeOptions = {
                                        width: targetWidth,
                                        behavior: "proportional",
                                        avoidScalingVisualDetailsIfPossible: true
                                    };
                                }
                            } else {
                                // Contain mode
                                if (mediaAspectRatio > artboardAspectRatio) {
                                    // Contain: width = document width, so provide width
                                    resizeOptions = {
                                        width: targetWidth,
                                        behavior: "proportional",
                                        avoidScalingVisualDetailsIfPossible: true
                                    };
                                } else {
                                    // Contain: height = document height, so provide height
                                    resizeOptions = {
                                        height: targetHeight,
                                        behavior: "proportional",
                                        avoidScalingVisualDetailsIfPossible: true
                                    };
                                }
                            }
                            
                            containerNode.resize(resizeOptions);
                            
                            // Get bounds after resize
                            const containerBounds = container.boundsLocal;
                            console.log(`[Sandbox] After resize - container: ${containerBounds.width.toFixed(0)}x${containerBounds.height.toFixed(0)}`);
                            
                            // Verify the resize worked
                            if (Math.abs(containerBounds.width - targetWidth) > 1 || Math.abs(containerBounds.height - targetHeight) > 1) {
                                console.warn(`[Sandbox] Resize didn't match target! Expected: ${targetWidth.toFixed(0)}x${targetHeight.toFixed(0)}, Got: ${containerBounds.width.toFixed(0)}x${containerBounds.height.toFixed(0)}`);
                            }
                            
                            // Set maskShape AFTER resize for fill mode (clips visible area to artboard)
                            if (fitMode === "fill") {
                                if ('width' in maskShape && 'height' in maskShape) {
                                    (maskShape as any).width = artboardWidth;
                                    (maskShape as any).height = artboardHeight;
                                    console.log(`[Sandbox] Set maskShape to ${artboardWidth}x${artboardHeight} to clip visible area`);
                                }
                            } else {
                                // For contain, set maskShape to match container size (or artboard)
                                if ('width' in maskShape && 'height' in maskShape) {
                                    (maskShape as any).width = artboardWidth;
                                    (maskShape as any).height = artboardHeight;
                                }
                            }
                            
                            // Always center the container on the artboard at the end
                            // Use the actual container bounds after resize to calculate center position
                            const finalBounds = container.boundsLocal;
                            const centerX = (artboardWidth - finalBounds.width) / 2;
                            const centerY = (artboardHeight - finalBounds.height) / 2;
                            
                            container.translation = {
                                x: centerX,
                                y: centerY
                            };
                            
                            console.log(`[Sandbox] Container centered at (${centerX.toFixed(2)}, ${centerY.toFixed(2)})`);
                            console.log(`[Sandbox] Artboard: ${artboardWidth}x${artboardHeight}, Container: ${finalBounds.width.toFixed(0)}x${finalBounds.height.toFixed(0)}`);
                            console.log(`[Sandbox] ALL image data is preserved, maskShape only clips visibility`);
                        } catch (resizeError) {
                            console.error(`[Sandbox] Resize API failed:`, resizeError);
                            // If resize fails, at least center the container
                            const containerBounds = container.boundsLocal;
                            container.translation = {
                                x: (artboardWidth - containerBounds.width) / 2,
                                y: (artboardHeight - containerBounds.height) / 2
                            };
                        }
                    }
                }
            }
        });

        console.log(`[Sandbox] Fit to canvas complete. Applied ${fitMode} to ${totalContainers} image containers.`);

    } catch (error) {
        console.error("[Sandbox] Error during fit to canvas:", error);
        throw error;
    }
}
