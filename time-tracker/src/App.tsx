import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TimeTracking } from './screens/TimeTracking';
import { TimeDashboard } from './screens/TimeDashboard';
import { OvertimeDashboard } from './screens/OvertimeDashboard';
import { Cases } from './screens/Cases';
import { Clients } from './screens/Clients';
import { Settings } from './screens/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TimeTracking />} />
          <Route path="dashboard" element={<TimeDashboard />} />
          <Route path="normtid" element={<OvertimeDashboard />} />
          <Route path="sager" element={<Cases />} />
          <Route path="kunder" element={<Clients />} />
          <Route path="indstillinger" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
