import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Identities from './pages/Identities.jsx'
import IdentityDetail from './pages/IdentityDetail.jsx'
import FolderPage from './pages/FolderPage.jsx'
import { IdentitiesProvider } from './data/identities.jsx'

export default function App() {
  return (
    <IdentitiesProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Identities />} />
          <Route path="/id/:id" element={<IdentityDetail />} />
          <Route path="/id/:id/:section" element={<FolderPage />} />
        </Route>
      </Routes>
    </IdentitiesProvider>
  )
}
