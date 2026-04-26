/**
 * src/utils/print.ts
 * -------------------
 * Wrappers around expo-print and expo-sharing for the Android print pipeline.
 *
 * printSessionSlip  – sends HTML directly to Android's print system (system
 *                     print dialog lets user choose printer / save as PDF).
 *
 * shareSessionSlip  – converts HTML to a PDF file and opens the Android share
 *                     sheet (WhatsApp, Email, Drive, etc.)
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { cacheDirectory, moveAsync } from 'expo-file-system/legacy';

/**
 * Open the Android system print dialog with the generated HTML.
 * The user can select a real printer or "Save as PDF".
 */
export async function printSessionSlip(html: string): Promise<void> {
  await Print.printAsync({ html });
}

/**
 * Convert the HTML to a temporary PDF file then open the system share sheet.
 * The caller must pass a slip identifier for the suggested filename.
 */
export async function shareSessionSlip(html: string, sessionCode: string): Promise<void> {
  // expo-print generates a temporary PDF URI from the HTML
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  // Move to a stable location with a human-readable filename
  const filename = `${cacheDirectory}Dspire-VR-${sessionCode}.pdf`;
  await moveAsync({ from: uri, to: filename });

  // Check sharing is available on this device before proceeding
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not supported on this device.');
  }

  await Sharing.shareAsync(filename, {
    mimeType: 'application/pdf',
    dialogTitle: `Share Session Slip – ${sessionCode}`,
    UTI: 'com.adobe.pdf', // iOS hint (harmless on Android)
  });
}
