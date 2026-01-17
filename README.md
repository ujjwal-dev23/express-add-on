# Bulk Edit: Adobe Express Add-on

**Bulk Edit** is a professional-grade Adobe Express Add-on designed to eliminate the manual effort involved in high-volume asset management. It provides a centralized dashboard for bulk importing hundreds of images, applying consistent watermark branding, resizing multiple pages to social media presets (Instagram/Facebook), and batch exporting documents as high-quality PNGs or organized ZIP archives.

---

## Documentation

### 1. Tutorials
**Getting Started with Bulk Edit**
* **Installation**: Clone the repository and ensure you have the Adobe CC Web Add-on CLI installed. Run `npm install` to set up all necessary dependencies.
* **Launch**: Start the development environment by running `npm start`. This will launch the add-on in your local Adobe Express environment.
* **Batch Importing**: Drag and drop up to 250 JPG or PNG images into the "Import Images" card. The add-on will automatically generate a new page for every image uploaded.
* **Branding with Watermarks**: Click the "Apply Watermark" button to open the configuration dialog. Upload your logo, adjust the opacity and scale sliders, and select a corner position. Click "Apply" to process the selected range.
* **Final Export**: Once your edits are complete, toggle "Download as ZIP" in the sticky footer and click "Export" to download your processed assets.

### 2. How-to Guides
* **How to Resize for Social Media**: 
    1. Open the **Bulk Resize** dialog.
    2. Click on the **Instagram** (1080x1080) or **Facebook** (1200x630) preset cards to auto-fill dimensions.
    3. Alternatively, enter custom pixel values for Width and Height.
    4. Specify the page range (e.g., From 1 To 10) and click **Apply** to update the layout of those specific pages.
* **How to Fit Images to Canvas**: Navigate to the **Batch Controls** card. Choose **Fill** to expand images to cover the canvas or **Contain** to ensure the entire image is visible within the page boundaries. Click **Apply** to trigger the batch processing.
* **How to Use Smart Naming**: In the **Smart Naming** card, enter a pattern such as `{date}_{index}` or `Marketing_Campaign_{index}`. This ensures that when you export as a ZIP, every file is logically named and easy to find.
* **How to Clear the Session**: If you wish to start a fresh batch, use the **Reset All** button. This will delete all generated pages and return the UI to its idle state.

### 3. Reference
* **Technical Stack**: Built with **React 18**, **TypeScript**, and **Adobe Spectrum Web Components** (`@swc-react`) for a native Adobe Express look and feel.
* **Manifest Permissions**: The project requires `experimentalApis: true` to access advanced document manipulation and `allow-downloads` for the export functionality.
* **Architecture**: The project follows a strict **Feature Folder Architecture**. All sandbox logic is decoupled from the entry point (`src/sandbox/code.ts`) and contained within specialized folders in `src/sandbox/features/`.
* **Key Scripts**:
    * `npm run build`: Compiles the add-on using Webpack for production.
    * `npm run start`: Starts the local development server with HMR.
    * `npm run clean`: Removes the `dist` folder and build artifacts.

### 4. Explanation
* **The Sandbox Bridge**: This add-on utilizes a split-runtime architecture. `App.tsx` handles the UI and user inputs, communicating with the **Document Sandbox** (`code.ts`) via a `sandboxProxy`. This separation ensures UI responsiveness during heavy batch operations.
* **Page Range Logic**: To handle large documents efficiently, most batch operations (fitting, watermarking, resizing) include a **Range** input. This allows users to target specific subsets of pages (e.g., pages 5-20) without affecting the rest of the document.
* **Visual Persistence**: The UI is designed with an "Active Session" state. After images are imported, the control cards (Batch Controls, Smart Naming, Export Footer) remain visible to allow for iterative editing until the user decides to **Reset**.
* **Architecture Standards**: To support parallel development, the project mandates the **Handler Pattern**. Every sandbox capability must be registered in the `DocumentSandboxApi` interface to ensure type safety across the UI-Sandbox bridge.
