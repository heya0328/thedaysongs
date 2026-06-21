import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TDSMobileProvider } from '@toss/tds-mobile';
import { Global, css } from '@emotion/react';
import { lightCSS, lightTDSVariablesCSS } from '@toss/tds-colors';
import App from './App';

function getUserAgentVariables() {
  return {
    fontA11y: undefined,
    fontScale: 1,
    isAndroid: /Android/i.test(navigator.userAgent),
    isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
    colorPreference: 'light' as const,
    safeAreaBottomTransparency: undefined,
  };
}

const userAgent = getUserAgentVariables();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Global
      styles={css`
        :root {
          ${lightCSS}
          ${lightTDSVariablesCSS}
        }
      `}
    />
    <TDSMobileProvider userAgent={userAgent} resetGlobalCss>
      <App />
    </TDSMobileProvider>
  </StrictMode>,
);
