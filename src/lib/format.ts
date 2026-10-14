/** Formatação de durações. Fonte única — substitui as strings de duração do mock.
 *  Persistência é SEMPRE segundos; exibição formata aqui.
 *
 *  Contrato (floor nos minutos, sem arredondar para cima):
 *  - 0        → "0 min"
 *  - 3125     → "52 min"
 *  - 4800     → "1h 20min"
 *  - 3600     → "1h 00min"
 *  - 7199     → "1h 59min" (não vira "1h 60min")
 *  - negativo → tratado como 0 (defensivo; regra de negócio não deve gerar negativo)
 */

/** Um dígito/2 dígitos com zero à esquerda. */
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "1h 20min" | "52 min" | "0 min" — mesmo estilo do protótipo, sem o bug "1h 60min". */
export function formatDuration(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const totalMinutes = Math.floor(safe / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${pad2(minutes)}min`;
  }
  return `${minutes} min`;
}

/** Relógio de cronômetro "HH:MM:SS" | "MM:SS" — display de /estudo. */
export function formatClock(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const s = safe % 60;
  const totalMinutes = Math.floor(safe / 60);
  const m = totalMinutes % 60;
  const h = Math.floor(totalMinutes / 60);

  if (h > 0) {
    return `${h}:${pad2(m)}:${pad2(s)}`;
  }
  return `${pad2(m)}:${pad2(s)}`;
}
