export interface SessionContactPayloadInput {
  name: string;
  phone: string;
  selectedGameName: string;
  selectedGameId?: number | string | null;
  stationName?: string | null;
  source?: string;
  sessionStartedAt?: Date;
  vrSessionId?: string | null;
}

export interface SessionContactPayload {
  name: string;
  phone_number: string;
  selected_game: string;
  session_started_at: string;
  selected_game_id?: number | null;
  vr_session_id?: string;
  station_name?: string | null;
  source: string;
}

export function buildSessionContactPayload({
  name,
  phone,
  selectedGameName,
  selectedGameId,
  stationName,
  source = 'vr-app',
  sessionStartedAt = new Date(),
  vrSessionId,
}: SessionContactPayloadInput): SessionContactPayload {
  const cleanName = name.trim();
  const cleanPhone = phone.replace(/\D/g, '');

  return {
    name: cleanName,
    phone_number: cleanPhone,
    selected_game: selectedGameName.trim(),
    session_started_at: sessionStartedAt.toISOString(),
    selected_game_id: selectedGameId !== undefined && selectedGameId !== null ? Number(selectedGameId) : undefined,
    vr_session_id: vrSessionId ?? `VR-${Date.now()}`,
    station_name: stationName ?? null,
    source,
  };
}
