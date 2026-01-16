import { editor } from "express-document-sdk";

export interface PageInfo {
  id: string;
  name: string;
  width: number;
  height: number;
}

export const getExportablePages = async (range?: { start: number, end: number }): Promise<PageInfo[]> => {
  const pages = editor.documentRoot.pages.toArray();
  const pagesToExport = range
    ? pages.slice(range.start - 1, range.end)
    : pages;

  return pagesToExport.map(page => ({
    id: page.id,
    name: page.name,
    width: page.width,
    height: page.height
  }));
};
