import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import { env, isCognitoConfigured } from "../config/env.js";

const STORAGE_KEY = "cubo_admin_auth";

function getUserPool() {
  if (!isCognitoConfigured()) {
    throw new Error("Cognito no esta configurado");
  }

  return new CognitoUserPool({
    UserPoolId: env.cognitoUserPoolId,
    ClientId: env.cognitoClientId,
  });
}

export function saveSession(session) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function readSession() {
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function loginWithCognito(email, password) {
  const userPool = getUserPool();
  const user = new CognitoUser({ Username: email, Pool: userPool });
  const authDetails = new AuthenticationDetails({ Username: email, Password: password });

  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const payload = session.getIdToken().decodePayload();
        resolve({
          email,
          name: payload.name || email,
          role: payload["cognito:groups"]?.[0] || "ADMIN",
          idToken: session.getIdToken().getJwtToken(),
          accessToken: session.getAccessToken().getJwtToken(),
          expiresAt: session.getAccessToken().getExpiration() * 1000,
          authMode: "COGNITO",
        });
      },
      onFailure: reject,
      newPasswordRequired: () => reject(new Error("El usuario requiere cambio de contrasena en Cognito.")),
    });
  });
}

export function getAuthorizationToken() {
  const session = readSession();
  if (!session || session.authMode !== "COGNITO") {
    return null;
  }
  return session.idToken || session.accessToken || null;
}
