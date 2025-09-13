import React from 'react'
import ReactDOM from 'react-dom/client'
import { VisualEditor } from '../visual-editor-simple'

// Demo app to test the Visual Editor
function App() {
  return (
    <div className="demo-app">
      <VisualEditor />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)