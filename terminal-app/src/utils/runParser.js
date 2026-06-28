export const VALIDATE_RUN_DV = true;

export function normalizeScanText(rawText) {
  return String(rawText ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u00c2\u00c3]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

export function formatRun(runNumber, dv) {
  return `${String(runNumber).replace(/\D/g, "")}-${String(dv).toUpperCase()}`;
}

export function isValidRunFormat(run) {
  return /^[0-9]{7,8}-[0-9K]$/.test(String(run ?? "").toUpperCase());
}

export function validateRunDv(runNumber, dv) {
  const digits = String(runNumber ?? "").replace(/\D/g, "");
  let multiplier = 2;
  let sum = 0;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    sum += Number(digits[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const expectedDv = remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);

  return expectedDv === String(dv ?? "").toUpperCase();
}

export function maskRun(run) {
  const normalized = String(run ?? "").toUpperCase();
  const match = normalized.match(/^([0-9]{7,8})-([0-9K])$/);

  if (!match) {
    return "RUN ******";
  }

  return `${match[1].slice(0, 2)}******-${match[2]}`;
}

function buildResult(runNumber, dv) {
  const run = formatRun(runNumber, dv);

  if (!isValidRunFormat(run)) {
    return { ok: false, error: "RUN_NO_DETECTADO" };
  }

  if (VALIDATE_RUN_DV && !validateRunDv(runNumber, dv)) {
    return { ok: false, error: "RUN_INVALIDO" };
  }

  return {
    ok: true,
    run,
    runNumber: String(runNumber),
    dv: String(dv).toUpperCase()
  };
}

export function extractRunFromScan(rawText) {
  // The full QR payload can contain sensitive data. This parser only returns RUN parts.
  const text = normalizeScanText(rawText);

  const runScopedMatch = text.match(/run[^0-9a-z]{0,12}([0-9]{7,8})[^0-9a-z]?([0-9k])/i);
  if (runScopedMatch) {
    return buildResult(runScopedMatch[1], runScopedMatch[2]);
  }

  const compactRunMatch = text.match(/run([0-9]{7,8})([0-9k])/i);
  if (compactRunMatch) {
    return buildResult(compactRunMatch[1], compactRunMatch[2]);
  }

  const standaloneRunMatch = text.match(/(?:^|[^0-9])([0-9]{7,8})[-']?([0-9k])(?:[^0-9a-z]|$)/i);
  if (standaloneRunMatch) {
    return buildResult(standaloneRunMatch[1], standaloneRunMatch[2]);
  }

  return { ok: false, error: "RUN_NO_DETECTADO" };
}
