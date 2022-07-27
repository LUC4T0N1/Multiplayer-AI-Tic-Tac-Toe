import React from 'react';
import ReactDOM from "react-dom/client";
import { ThemeProvider } from './infrastructure/context';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

import App from './App'; 

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import 'flag-icon-css/css/flag-icons.min.css';


i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    supportedLngs: ['en', 'pt'],
    fallbackLng: "en",
    detection: {
      order: ['cookie','htmlTag', 'localStorage', 'path', 'subdomain'],
      caches: ['cookie']
    },
    backend: {
      loadPath: process.env.PUBLIC_URL + '/assets/locales/{{lng}}/translation.json'
    },
    react: {useSuspense: false},
  });


  const root = ReactDOM.createRoot(document.getElementById("root"));

  root.render(
    <ThemeProvider>
      <App/>
    </ThemeProvider>
);


