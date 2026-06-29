const CONFIG_STORAGE_KEY = "cubo.terminal.config";
const DEFAULT_API_BASE_URL = "https://cs0w4vtu5a.execute-api.us-east-1.amazonaws.com";

export const defaultTerminalConfig = {
  terminalCode: import.meta.env.VITE_TERMINAL_CODE || "TERM-001",
  terminalName: import.meta.env.VITE_TERMINAL_NAME || "Entrada Principal",
  branch: "Casa Matriz",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
  mode: import.meta.env.VITE_TERMINAL_MODE || "API",
  adminPin: "123456",
  terminalSyncToken: import.meta.env.VITE_TERMINAL_SYNC_TOKEN || "cubo-dev-terminal-token"
};

/**
 * Removes trailing slashes from the API base URL before endpoint concatenation.
 */
export function normalizeApiBaseUrl(url) {
  return String(url ?? "").trim().replace(/\/+$/, "");
}

function normalizeTerminalMode(mode) {
  return mode === "LOCAL_MOCK" || mode === "MOCK_TEST" ? "LOCAL_MOCK" : "API";
}

function normalizeStoredApiBaseUrl(url, mode) {
  const normalizedUrl = normalizeApiBaseUrl(url || DEFAULT_API_BASE_URL);

  if (normalizeTerminalMode(mode) !== "API") {
    return normalizedUrl;
  }

  if (
    !normalizedUrl ||
    normalizedUrl.includes("localhost") ||
    normalizedUrl.includes("127.0.0.1") ||
    normalizedUrl.includes("0.0.0.0")
  ) {
    return DEFAULT_API_BASE_URL;
  }

  return normalizedUrl;
}

function normalizeTerminalConfig(config) {
  const mode = normalizeTerminalMode(config?.mode);

  return {
    ...defaultTerminalConfig,
    ...config,
    terminalCode: String(config?.terminalCode ?? defaultTerminalConfig.terminalCode).trim().toUpperCase(),
    terminalName: String(config?.terminalName ?? defaultTerminalConfig.terminalName).trim(),
    apiBaseUrl: normalizeStoredApiBaseUrl(config?.apiBaseUrl ?? defaultTerminalConfig.apiBaseUrl, mode),
    mode,
    terminalSyncToken: String(config?.terminalSyncToken ?? defaultTerminalConfig.terminalSyncToken)
  };
}

/**
 * Reads the terminal configuration from localStorage or creates the AWS default.
 */
export function getTerminalConfig() {
  const storedConfig = window.localStorage.getItem(CONFIG_STORAGE_KEY);

  if (!storedConfig) {
    const normalizedDefault = normalizeTerminalConfig(defaultTerminalConfig);
    saveTerminalConfig(normalizedDefault);
    return normalizedDefault;
  }

  try {
    return normalizeTerminalConfig(JSON.parse(storedConfig));
  } catch {
    const normalizedDefault = normalizeTerminalConfig(defaultTerminalConfig);
    saveTerminalConfig(normalizedDefault);
    return normalizedDefault;
  }
}

/**
 * Persists terminal settings with normalized API URL and mode values.
 */
export function saveTerminalConfig(config) {
  const normalizedConfig = normalizeTerminalConfig(config);
  window.localStorage.setItem(
    CONFIG_STORAGE_KEY,
    JSON.stringify(normalizedConfig)
  );
  return normalizedConfig;
}

/**
 * Restores the default AWS-ready terminal configuration.
 */
export function resetTerminalConfig() {
  return saveTerminalConfig(defaultTerminalConfig);
}

/**
 * Returns true when the active terminal configuration sends marks to AWS.
 */
export function isApiMode() {
  return getTerminalConfig().mode === "API";
}

export function updateTerminalConfig(partialConfig) {
  const nextConfig = {
    ...getTerminalConfig(),
    ...partialConfig
  };

  return saveTerminalConfig(nextConfig);
}
