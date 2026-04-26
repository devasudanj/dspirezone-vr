/**
 * src/utils/sessionSlip.ts
 * -------------------------
 * Generates a self-contained HTML string representing the printed session slip.
 * The HTML is passed to expo-print which renders it via Android's PDF print pipeline.
 *
 * Assumptions:
 *   - A4 paper size is used (210mm × 297mm).
 *   - The slip is intentionally compact so it prints on a single half-page/receipt.
 *   - No external assets are referenced – everything is inline CSS.
 */
import type { Session } from '../types';

export function buildSessionSlipHtml(session: Session): string {
  const createdAt = new Date(session.created_at);

  const dateStr = createdAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = createdAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const durationLabel =
    session.duration_minutes === 60
      ? '1 Hour'
      : `${session.duration_minutes} Minutes`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Session Slip – ${session.session_code}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #ffffff;
      color: #1a1a2e;
      padding: 24px;
      max-width: 420px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .header {
      text-align: center;
      border-bottom: 3px solid #6c63ff;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .center-name {
      font-size: 26px;
      font-weight: 800;
      color: #6c63ff;
      letter-spacing: 1px;
    }
    .slip-title {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 4px;
    }

    /* ── Rows ── */
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .row:last-of-type { border-bottom: none; }

    .label {
      font-size: 13px;
      color: #666;
      font-weight: 500;
    }
    .value {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
      text-align: right;
      max-width: 60%;
    }
    .value.accent { color: #6c63ff; font-size: 16px; }
    .value.code   { color: #00d4ff; font-size: 18px; letter-spacing: 2px; }

    /* ── Divider ── */
    .dashed {
      border: none;
      border-top: 2px dashed #ccc;
      margin: 16px 0;
    }

    /* ── Footer ── */
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      color: #aaa;
      line-height: 1.6;
    }

    /* ── QR placeholder (could be real QR code in v2) ── */
    .session-id-box {
      background: #f4f3ff;
      border: 2px solid #6c63ff;
      border-radius: 10px;
      padding: 12px 20px;
      text-align: center;
      margin: 16px 0;
    }
    .session-id-label {
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .session-id-value {
      font-size: 22px;
      font-weight: 800;
      color: #6c63ff;
      letter-spacing: 3px;
      margin-top: 4px;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="center-name">🎮 Dspire VR Zone</div>
    <div class="slip-title">VR Gaming Session Slip</div>
  </div>

  <!-- Session ID box -->
  <div class="session-id-box">
    <div class="session-id-label">Session ID</div>
    <div class="session-id-value">${escapeHtml(session.session_code)}</div>
  </div>

  <!-- Details -->
  <div class="row">
    <span class="label">Game</span>
    <span class="value accent">${escapeHtml(session.game_name)}</span>
  </div>
  <div class="row">
    <span class="label">Headset</span>
    <span class="value code">${escapeHtml(session.headset_code)}</span>
  </div>
  <div class="row">
    <span class="label">Duration</span>
    <span class="value">${escapeHtml(durationLabel)}</span>
  </div>
  <div class="row">
    <span class="label">Date</span>
    <span class="value">${escapeHtml(dateStr)}</span>
  </div>
  <div class="row">
    <span class="label">Time</span>
    <span class="value">${escapeHtml(timeStr)}</span>
  </div>

  <hr class="dashed" />

  <!-- Footer -->
  <div class="footer">
    <p>Please present this slip at the counter.</p>
    <p>Enjoy your VR experience!</p>
    <p style="margin-top: 8px; font-size: 10px;">
      Dspire VR Zone &bull; Powered by FastAPI + React Native
    </p>
  </div>

</body>
</html>
  `.trim();
}

/** Prevent XSS in the generated HTML by escaping user-supplied strings. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
