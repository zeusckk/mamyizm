import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './Shell'
import { AccountPage } from './pages/AccountPage'
import { BrandPage } from './pages/BrandPage'
import { CalendarPage } from './pages/CalendarPage'
import { DesignsPage } from './pages/DesignsPage'
import { EditorPage } from './pages/EditorPage'
import { IdentityPage } from './pages/IdentityPage'
import { PlansPage } from './pages/PlansPage'
import { Studio } from './pages/Studio'
import { Workbench } from './pages/Workbench'
import { StoreProvider } from './store'

export function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Studio />} />
            <Route path="studio/:id" element={<Workbench />} />
            <Route path="takvim" element={<CalendarPage />} />
            <Route path="marka" element={<BrandPage />} />
            <Route path="marka/kimlik" element={<IdentityPage />} />
            <Route path="tasarimlar" element={<DesignsPage />} />
            <Route path="hesap" element={<AccountPage />} />
            <Route path="planlar" element={<PlansPage />} />
            <Route path="editor" element={<EditorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
