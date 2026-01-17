import fs from 'fs/promises';
import path from 'path';

/**
 * Reads the content of a file as text.
 * @param filePath The path to the file.
 * @returns The content of the file as text.
 */
export async function readFileContent(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Reads all files in a folder and returns their content as text.
 * @param folderPath The path to the folder.
 * @returns An array of file contents.
 */
export async function readFolderContents(folderPath: string): Promise<string[]> {
  const files = await fs.readdir(folderPath);
  const contents = await Promise.all(
    files.map(async (file) => {
      const fullPath = path.join(folderPath, file);
      const stat = await fs.stat(fullPath);
      if (stat.isFile()) {
        return readFileContent(fullPath);
      }
      return '';
    })
  );
  return contents.filter((content) => content !== '');
}