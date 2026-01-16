---
description: How to run the Bulk Page Import Stress Test (50 Images).
---

Follow these steps to verify the stability and performance of the bulk import feature using 50 pre-downloaded images.

### 1. Preparation
Ensure you have pre-downloaded the demo assets. If you haven't already, run:
```bash
node scripts/download-demo-assets.js
```

### 2. Restart and Sync
Restart your development server to ensure all `manifest.json` permissions and `webpack.config.js` assets are correctly served:
1. Stop the current `npm start` process (Ctrl+C).
2. Start it again:
   ```bash
   npm start
   ```

### 3. Verification in Adobe Express
1. Open [Adobe Express](https://express.adobe.com).
2. Load your "Bulk Media Express" add-on.
3. Open the **Browser Console** (Right-click > Inspect > Console) to monitor progress.
4. Click the **"Test Backend (Import 50 Images)"** button.

### 4. What to Expect
- **UI Logs**: You will see sequential logs: `[UI] Fetching local asset 1/50...` up to `50/50`.
- **Sandbox Logs**: Once the UI sends the data, you will see sandbox logs: `[Sandbox] Loading bitmap...` and `[Sandbox] Image imported successfully.`
- **Document Status**: 50 new pages will be created in your document, each containing a unique image centered on the canvas.

### 5. Troubleshooting
- **Network Error**: If you see "Failed to fetch", ensure your dev server is running and you restarted it after the manifest update.
- **Permission Denied**: Check if developer mode is enabled in your Adobe Express add-on settings.
