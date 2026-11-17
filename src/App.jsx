import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Identities from './pages/Identities.jsx'
import IdentityDetail from './pages/IdentityDetail.jsx'
import SectionPlaceholder from './pages/SectionPlaceholder.jsx'
import { IdentitiesProvider } from './data/identities.jsx'

export default function App() {
  return (
    <IdentitiesProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Identities />} />
          <Route path="/id/:id" element={<IdentityDetail />} />
          <Route path="/id/:id/:section" element={<SectionPlaceholder />} />
        </Route>
      </Routes>
    </IdentitiesProvider>
  )
}
