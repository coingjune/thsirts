import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './i18n/config';  // i18n 설정 import

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);