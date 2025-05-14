
import { createRoot } from 'react-dom/client'
import './index.css'

import App from './App.jsx'
import { BrowserRouter, createBrowserRouter, RouterProvider } from 'react-router-dom'

const modalRoot = document.createElement('div');
modalRoot.id = 'modal-root';
document.body.appendChild(modalRoot);

const router=createBrowserRouter([
  {path:'/',
    element:<App/>
  }
])
createRoot(document.getElementById('root')).render(
 <RouterProvider router={router}/>
)
