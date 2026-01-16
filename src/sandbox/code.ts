import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor } from "express-document-sdk";
import { DocumentSandboxApi } from "../models/DocumentSandboxApi";
import { importImages } from "./features/import";
import { fitToCanvas } from "./features/canvas-fitting";
import { resetAllPages } from "./features/reset";

import { getExportablePages } from "./features/export";
import { injectWatermark } from "./features/watermark";
import { changePageLayout } from "./features/page-layout";

// Get the document sandbox runtime.
const { runtime } = addOnSandboxSdk.instance;

function start(): void {
    // APIs to be exposed to the UI runtime
    // i.e., to the `App.tsx` file of this add-on.
    const sandboxApi: DocumentSandboxApi = {
        createRectangle: () => {
            const rectangle = editor.createRectangle();

            // Define rectangle dimensions.
            rectangle.width = 240;
            rectangle.height = 180;

            // Define rectangle position.
            rectangle.translation = { x: 10, y: 10 };

            // Define rectangle color.
            const color = { red: 0.32, green: 0.34, blue: 0.89, alpha: 1 };

            // Fill the rectangle with the color.
            const rectangleFill = editor.makeColorFill(color);
            rectangle.fill = rectangleFill;

            // Add the rectangle to the document.
            const insertionParent = editor.context.insertionParent;
            insertionParent.children.append(rectangle);
        },
        importImages: async (images) => {
            await importImages(images);
        },
        injectWatermark: async (settings) => {
            await injectWatermark(settings);
        },
        fitToCanvas: async (fitMode) => {
            await fitToCanvas(fitMode);
        },
        changePageLayout: async (ratio) => {
            await changePageLayout(ratio);
        },
        getPages: async () => getExportablePages(),
        resetAllPages: async () => {
            await resetAllPages();
        }
    };

    // Expose `sandboxApi` to the UI runtime.
    runtime.exposeApi(sandboxApi);
}

start();
