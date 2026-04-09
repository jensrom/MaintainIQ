import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './screens/Dashboard'
import WorkOrders from './screens/WorkOrders'
import Requests from './screens/Requests'
import PlannedMaintenance from './screens/PlannedMaintenance'
import CalendarView from './screens/CalendarView'
import LogBook from './screens/LogBook'
import AssetTree from './screens/AssetTree'
import SpareParts from './screens/SpareParts'
import Suppliers from './screens/Suppliers'
import GuestPortal from './screens/GuestPortal'
import Settings from './screens/Settings'
import CMMSSettings from './screens/CMMSSettings'
import UserManagement from './screens/UserManagement'
import ApiReference from './screens/ApiReference'
import { useStore } from './store'

function ThemeSync() {
  const darkMode = useStore(s => s.settings.darkMode)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeSync />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="arbejdsordrer" element={<WorkOrders />} />
          <Route path="anmodninger" element={<Requests />} />
          <Route path="planlagt" element={<PlannedMaintenance />} />
          <Route path="kalender" element={<CalendarView />} />
          <Route path="logbog" element={<LogBook />} />
          <Route path="site" element={<AssetTree />} />
          <Route path="reservedele" element={<SpareParts />} />
          <Route path="leverandorer" element={<Suppliers />} />
          <Route path="gaesteportal" element={<GuestPortal />} />
          <Route path="indstillinger" element={<Settings />} />
          <Route path="cmms-indstillinger" element={<CMMSSettings />} />
          <Route path="brugere" element={<UserManagement />} />
          <Route path="api" element={<ApiReference />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
