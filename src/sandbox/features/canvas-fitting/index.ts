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

                        // Alternative approach: Use the experimental resize API if available,
                        // but wrap in try-catch to handle cases where experimentalApis flag isn't recognized
                        try {
                            // Cast to Node to access resize method (experimental API)
                            const containerNode = container as unknown as Node & {
                                resize: (options: {
                                    width: number;
                                    height: number;
                                    behavior: "contain" | "cover" | "proportional";
                                    avoidScalingVisualDetailsIfPossible: boolean;
                                }) => void;
                            };
                            
                            // Apply fit mode using resize API
                            if (fitMode === "fill") {
                                containerNode.resize({
                                    width: artboardWidth,
                                    height: artboardHeight,
                                    behavior: "cover",
                                    avoidScalingVisualDetailsIfPossible: true
                                });
                            } else {
                                containerNode.resize({
                                    width: artboardWidth,
                                    height: artboardHeight,
                                    behavior: "contain",
                                    avoidScalingVisualDetailsIfPossible: true
                                });
                            }
                            
                            // Center the container on the artboard after resizing
                            const containerBounds = container.boundsLocal;
                            container.translation = {
                                x: (artboardWidth - containerBounds.width) / 2,
                                y: (artboardHeight - containerBounds.height) / 2
                            };
                        } catch (resizeError) {
                            // Fallback: Manually adjust maskShape and positioning
                            console.warn(`[Sandbox] Resize API failed, using fallback method:`, resizeError);
                            
                            const maskShape = container.maskShape;
                            const mediaRect = container.mediaRectangle;
                            const mediaWidth = mediaRect.width;
                            const mediaHeight = mediaRect.height;
                            const mediaAspectRatio = mediaWidth / mediaHeight;
                            const artboardAspectRatio = artboardWidth / artboardHeight;
                            
                            // Resize maskShape to artboard size (controls visible bounds)
                            if ('width' in maskShape && 'height' in maskShape) {
                                (maskShape as any).width = artboardWidth;
                                (maskShape as any).height = artboardHeight;
                            }
                            
                            // Calculate media position for fill/contain
                            let mediaOffsetX = 0;
                            let mediaOffsetY = 0;
                            
                            if (fitMode === "fill") {
                                // Fill: scale media to cover artboard, center excess
                                if (mediaAspectRatio > artboardAspectRatio) {
                                    // Media wider - scale to height, center horizontally
                                    const scaledWidth = artboardHeight * mediaAspectRatio;
                                    mediaOffsetX = (artboardWidth - scaledWidth) / 2;
                                } else {
                                    // Media taller - scale to width, center vertically
                                    const scaledHeight = artboardWidth / mediaAspectRatio;
                                    mediaOffsetY = (artboardHeight - scaledHeight) / 2;
                                }
                            } else {
                                // Contain: scale media to fit, center if smaller
                                if (mediaAspectRatio > artboardAspectRatio) {
                                    // Media wider - fit to width, center vertically
                                    const scaledHeight = artboardWidth / mediaAspectRatio;
                                    mediaOffsetY = (artboardHeight - scaledHeight) / 2;
                                } else {
                                    // Media taller - fit to height, center horizontally
                                    const scaledWidth = artboardHeight * mediaAspectRatio;
                                    mediaOffsetX = (artboardWidth - scaledWidth) / 2;
                                }
                            }
                            
                            // Position container at origin (maskShape is at container origin)
                            container.translation = { x: 0, y: 0 };
                            
                            // Adjust media rectangle position
                            if (mediaRect.translation) {
                                mediaRect.translation = {
                                    x: mediaOffsetX,
                                    y: mediaOffsetY
                                };
                            }
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
