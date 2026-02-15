import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // 👈 여기가 './App.tsx' 파일을 가리키고 있어야 합니다!

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)