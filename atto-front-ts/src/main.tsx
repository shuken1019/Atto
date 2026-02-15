// src/main.tsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx' // .tsx 확장자는 생략 가능하지만 명시해도 됨
// import './index.css' // 만약 index.css를 지웠다면 이 줄도 지워야 에러가 안 납니다.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)