import { editor } from "express-document-sdk";

export interface PageInfo {
  id: string;
}

export const getExportablePages = async (): Promise<PageInfo[]> => {
  const pages = editor.documentRoot.pages.toArray();
  return pages.map(page => ({
    id: page.id
  }));
};
