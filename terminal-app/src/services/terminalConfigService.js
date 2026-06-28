const CONFIG_STORAGE_KEY = "cubo.terminal.config";

export const defaultTerminalConfig = {
  terminalCode: "TERM-001",
  terminalName: "Entrada Principal",
  branch: "Casa Matriz",
  apiBaseUrl: "http://localhost:3000/api",
  mode: "LOCAL_MOCK",
  adminPin: "123456"
};

export function getTerminalConfig() {
  const storedConfig = window.localStorage.getItem(CONFIG_STORAGE_KEY);

  if (!storedConfig) {
    saveTerminalConfig(defaultTerminalConfig);
    return { ...defaultTerminalConfig };
  }

  try {
    return {
      ...defaultTerminalConfig,
      ...JSON.parse(storedConfig)
    };
  } catch {
    saveTerminalConfig(defaultTerminalConfig);
    return { ...defaultTerminalConfig };
  }
}

export function saveTerminalConfig(config) {
  window.localStorage.setItem(
    CONFIG_STORAGE_KEY,
    JSON.stringify({
      ...defaultTerminalConfig,
      ...config
    })
  );
}

export function updateTerminalConfig(partialConfig) {
  const nextConfig = {
    ...getTerminalConfig(),
    ...partialConfig
  };

  saveTerminalConfig(nextConfig);
  return nextConfig;
}
