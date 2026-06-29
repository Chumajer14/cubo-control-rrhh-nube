export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "https://cs0w4vtu5a.execute-api.us-east-1.amazonaws.com",
  awsRegion: import.meta.env.VITE_AWS_REGION || "us-east-1",
  cognitoUserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || "",
  cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || "",
  authMode: import.meta.env.VITE_AUTH_MODE || "MOCK",
  appVersion: import.meta.env.VITE_APP_VERSION || "0.1.0",
};

export const isCognitoConfigured = () =>
  env.authMode === "COGNITO" && Boolean(env.cognitoUserPoolId && env.cognitoClientId);
