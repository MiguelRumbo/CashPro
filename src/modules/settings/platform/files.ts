/**
 * Adaptador de archivos del módulo de ajustes. En Expo SDK 54 la API clásica vive en
 * `expo-file-system/legacy` (la raíz lanza error en runtime para estas funciones).
 */
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export class SharingUnavailableError extends Error {
  override name = 'SharingUnavailableError';
  /** Ruta del archivo que sí se guardó aunque no se pudo compartir. */
  constructor(readonly savedUri?: string) {
    super('Compartir no está disponible en este dispositivo');
  }
}

export function databaseFilePath(fileName: string): string {
  return `${FileSystem.documentDirectory ?? ''}SQLite/${fileName}`;
}

export async function fileExists(path: string): Promise<boolean> {
  return (await FileSystem.getInfoAsync(path)).exists;
}

export async function shareFile(path: string, mimeType: string, dialogTitle: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new SharingUnavailableError();
  await Sharing.shareAsync(path, { mimeType, dialogTitle });
}

/** Escribe un archivo temporal en documentos y abre el diálogo de compartir. */
export async function writeAndShare(
  fileName: string,
  content: string,
  mimeType: string,
  dialogTitle: string,
): Promise<void> {
  const uri = `${FileSystem.documentDirectory ?? ''}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) throw new SharingUnavailableError(uri);
  await Sharing.shareAsync(uri, { mimeType, dialogTitle });
}

export const readText = (uri: string): Promise<string> => FileSystem.readAsStringAsync(uri);

export const copyFile = (from: string, to: string): Promise<void> => FileSystem.copyAsync({ from, to });

export async function pickDocument(types: string[]): Promise<{ uri: string; name: string } | undefined> {
  const result = await DocumentPicker.getDocumentAsync({ type: types, copyToCacheDirectory: true });
  if (result.canceled) return undefined;
  const asset = result.assets[0];
  return asset ? { uri: asset.uri, name: asset.name } : undefined;
}
