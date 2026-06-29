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

export function formatManualRunInput(value) {
  const compact = String(value ?? "")
    .toUpperCase()
    .replace(/[^0-9K]/g, "")
    .slice(0, 9);

  if (compact.length <= 1) {
    return compact;
  }

  return `${compact.slice(0, -1)}-${compact.slice(-1)}`;
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
  const cleanRunNumber = String(runNumber ?? "").replace(/\D/g, "");
  const cleanDv = String(dv ?? "").toUpperCase().replace(/[^0-9K]/g, "");
  const run = formatRun(cleanRunNumber, cleanDv);

  if (!isValidRunFormat(run)) {
    return { ok: false, error: "RUN_NO_DETECTADO" };
  }

  if (VALIDATE_RUN_DV && !validateRunDv(cleanRunNumber, cleanDv)) {
    return { ok: false, error: "RUN_INVALIDO" };
  }

  return {
    ok: true,
    run,
    runNumber: cleanRunNumber,
    dv: cleanDv
  };
}

function buildFirstRunFromCompact(value) {
  const compact = String(value ?? "")
    .toUpperCase()
    .replace(/[^0-9K]/g, "");

  if (compact.length < 8) {
    return { ok: false, error: "RUN_NO_DETECTADO" };
  }

  const match = compact.match(/^([0-9]{7,8})([0-9K])/);
  if (!match) {
    return { ok: false, error: "RUN_NO_DETECTADO" };
  }

  return buildResult(match[1], match[2]);
}

export function parseManualRun(rawText) {
  const compact = String(rawText ?? "")
    .toUpperCase()
    .replace(/[^0-9K]/g, "");

  if (!/^[0-9]{7,8}[0-9K]$/.test(compact)) {
    return { ok: false, error: "RUN_NO_DETECTADO" };
  }

  return buildResult(compact.slice(0, -1), compact.slice(-1));
}

const QR_RUN_TERMINATOR_PATTERN = /type|serial|mrz|cedula|documento|fecha/i;

// Used while the HID scanner is still typing the QR payload into the app.
export function extractRunFromActiveScanBuffer(rawText) {
  const text = normalizeScanText(rawText);
  const runIndex = text.indexOf("run");

  if (runIndex < 0) {
    return { ok: false, error: "RUN_NO_DETECTADO" };
  }

  const runSegment = text.slice(runIndex + 3);
  const separatedRunMatch = runSegment.match(
    /^[^0-9]{0,24}([0-9]{7,8})[^0-9a-z]+([0-9k])(?:$|[^0-9a-z]|type|serial|mrz|cedula|documento|fecha)/i
  );

  if (separatedRunMatch) {
    return buildResult(separatedRunMatch[1], separatedRunMatch[2]);
  }

  const compactRunWithBoundaryMatch = runSegment.match(
    /^[^0-9]{0,24}([0-9]{7,8})([0-9k])(?:[^0-9a-z]|type|serial|mrz|cedula|documento|fecha)/i
  );

  if (compactRunWithBoundaryMatch) {
    return buildResult(compactRunWithBoundaryMatch[1], compactRunWithBoundaryMatch[2]);
  }

  if (QR_RUN_TERMINATOR_PATTERN.test(runSegment)) {
    const scopedSegment = runSegment.split(QR_RUN_TERMINATOR_PATTERN)[0];
    return buildFirstRunFromCompact(scopedSegment);
  }

  return { ok: false, error: "RUN_INCOMPLETO" };
}

export function extractRunFromScan(rawText) {
  // The full QR payload can contain sensitive data. This parser only returns RUN parts.
  const text = normalizeScanText(rawText);

  const runIndex = text.indexOf("run");
  if (runIndex >= 0) {
    const runSegment = text
      .slice(runIndex + 3)
      .split(/type|serial|mrz|cedula|documento|fecha/)[0];
    const scopedResult = buildFirstRunFromCompact(runSegment);
    if (scopedResult.ok) {
      return scopedResult;
    }
  }

  const registroCivilRunMatch = text.match(/docstatus[-_/]?run[^0-9]{0,18}([0-9]{7,8})[^0-9a-z]?([0-9k])/i);
  if (registroCivilRunMatch) {
    return buildResult(registroCivilRunMatch[1], registroCivilRunMatch[2]);
  }

  const queryRunMatch = text.match(/[?&]run=([0-9]{7,8})[-']?([0-9k])(?:&|$)/i);
  if (queryRunMatch) {
    return buildResult(queryRunMatch[1], queryRunMatch[2]);
  }

  const runScopedMatch = text.match(/run[^0-9a-z]{0,18}([0-9]{7,8})[^0-9a-z]?([0-9k])/i);
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

  const manualResult = parseManualRun(text);
  if (manualResult.ok) {
    return manualResult;
  }

  return { ok: false, error: "RUN_NO_DETECTADO" };
}
