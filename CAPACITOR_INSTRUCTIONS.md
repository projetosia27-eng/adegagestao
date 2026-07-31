# 📱 Guia de Instalação e Compilação - AdegaHub (PWA & Capacitor)

O projeto **AdegaHub** foi configurado como um **PWA (Progressive Web App)** instalável e é 100% compatível com o **Capacitor** para geração de aplicativos nativos Android (.apk / .aab) e iOS (.ipa).

---

## 🌐 1. PWA (Instalação via Navegador)

O PWA permite instalar o AdegaHub diretamente da web sem passar pelas lojas de aplicativos.

### **Google Chrome / Edge (Android e Desktop)**
1. Acesse o site do AdegaHub.
2. O banner **"Instale o App AdegaHub"** aparecerá no topo da tela.
3. Clique em **Instalar** ou no ícone `+` / `Instalar aplicativo` na barra de endereço do navegador.
4. O app será adicionado à sua área de trabalho/tela de início como um app autônomo.

### **Safari (iOS / iPhone / iPad)**
1. Abra o site do AdegaHub no **Safari**.
2. Toque no ícone de **Compartilhar** (quadrado com seta para cima).
3. Selecione a opção **Adicionar à Tela de Início** (Add to Home Screen).
4. Confirme em **Adicionar**. O ícone do AdegaHub aparecerá junto aos seus apps nativos.

---

## 🤖 2. Compilando para Android (Capacitor)

### **Pré-requisitos**
* Node.js v18+ instalado.
* **Android Studio** instalado (com Android SDK e Java JDK 17+).

### **Passos para compilar o APK:**

```bash
# 1. Instalar as dependências do Capacitor para Android
npm install @capacitor/android

# 2. Gerar a build de produção do projeto React
npm run build

# 3. Adicionar a plataforma Android (executar apenas na primeira vez)
npx cap add android

# 4. Sincronizar o código web compilado com a pasta nativa do Android
npx cap sync android

# 5. Abrir o projeto no Android Studio para compilar o APK
npx cap open android
```

No **Android Studio**:
1. Aguarde a sincronização do Gradle terminar.
2. Vá em `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
3. O APK gerado estará disponível em `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🍎 3. Compilando para iOS (Capacitor)

### **Pré-requisitos**
* Computador macOS com **Xcode 15+** instalado.
* Conta de desenvolvedor Apple (para publicar na App Store ou TestFlight).
* CocoaPods instalado (`sudo gem install cocoapods`).

### **Passos para compilar no Xcode:**

```bash
# 1. Instalar as dependências do Capacitor para iOS
npm install @capacitor/ios

# 2. Gerar a build de produção do React
npm run build

# 3. Adicionar a plataforma iOS (executar apenas na primeira vez)
npx cap add ios

# 4. Sincronizar os arquivos
npx cap sync ios

# 5. Abrir no Xcode
npx cap open ios
```

No **Xcode**:
1. Selecione a equipe (Team) em *Signing & Capabilities*.
2. Escolha o dispositivo ou Simulador iOS.
3. Clique no botão **Play** ▶️ para rodar no simulador ou selecione `Product` > `Archive` para publicar.

---

## 📂 Recursos e Arquivos Gerados

* `manifest.webmanifest` & `vite.config.ts`: Configurações PWA com Workbox (caching offline, ícones, tema).
* `capacitor.config.json`: Configuração de ID do app (`com.adegahub.app`), Splash Screen e Capacitor.
* `/public/pwa-192x192.svg`: Ícone PWA (192x192).
* `/public/pwa-512x512.svg`: Ícone PWA (512x512 / Maskable).
* `/public/apple-touch-icon.svg`: Ícone para iOS.
* `/public/favicon.svg`: Favicon vetorial.
* `/public/splash-screen.svg`: Tela de abertura em alta resolução.
* `src/components/ui/PWAInstallPrompt.tsx`: Banner interativo para o usuário instalar o PWA em 1 clique.
