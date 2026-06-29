# CUBO Admin Web

Consola administrativa web para RR.HH. y administracion. Vive en `cubo/admin-web` y se despliega desde el repo `infra` como SPA estatica en S3 + CloudFront.

## Desarrollo local

```powershell
cd C:\Users\elise\source\repos\cubo\admin-web
npm install
Copy-Item .env.example .env
npm run dev
```

Para desarrollo sin Cognito:

```text
VITE_AUTH_MODE=MOCK
```

Usuarios demo:

- `admin@cubo.cl` / `Admin123*`
- `rrhh@cubo.cl` / `Rrhh123*`

Para AWS:

```text
VITE_AUTH_MODE=COGNITO
VITE_COGNITO_USER_POOL_ID=<output CognitoUserPoolId>
VITE_COGNITO_CLIENT_ID=<output CognitoClientId>
```

## Seguridad MVP

- No se hardcodean credenciales productivas.
- Los tokens Cognito se guardan en `sessionStorage` para el MVP; en produccion se recomienda revisar expiracion, rotacion y endurecimiento contra XSS.
- El frontend nunca muestra PIN ni `pinHash`.
- La IA de resumen es local, descriptiva y de apoyo administrativo. No toma decisiones laborales ni reemplaza revision humana.
- RUN se trata como dato personal.
- La aplicacion no almacena QR completo, MRZ ni serial de cedula.

## Build para despliegue

```powershell
cd C:\Users\elise\source\repos\cubo\admin-web
npm run build
```

El repo `infra` toma el build desde `../cubo/admin-web/dist` o desde `ADMIN_WEB_DIST_PATH`.

## Integracion API

La consola usa `VITE_API_BASE_URL` para consumir API Gateway. En local puede apuntar a la API publicada o a un endpoint de pruebas compatible con las rutas `/admin/*`.

## Despliegue AWS

El despliegue se ejecuta desde el repo `infra`, no desde este repo:

```powershell
cd C:\Users\elise\source\repos\infra
$env:ADMIN_WEB_DIST_PATH="C:\Users\elise\source\repos\cubo\admin-web\dist"
npx.cmd cdk synth
npx.cmd cdk diff
npx.cmd cdk deploy
```

Cuando existan los outputs `CognitoUserPoolId` y `CognitoClientId`, actualizar `admin-web/.env.production`, reconstruir con `npm run build` y redeplegar desde `infra` para publicar el bundle con Cognito real.
