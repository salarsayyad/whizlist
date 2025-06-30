import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Discover from './pages/Discover';
import Dashboard from './pages/Dashboard';
import ProductDetail from './pages/ProductDetail';
import ListDetail from './pages/ListDetail';
import FolderDetail from './pages/FolderDetail';
import TagDetail from './pages/TagDetail';
import Unassigned from './pages/Unassigned';
import Settings from './pages/Settings';
import UnderConstruction from './pages/UnderConstruction';
import NotFound from './pages/NotFound';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RedirectRoute from './components/auth/RedirectRoute';

function App() {
  return (
    <Routes>
      <Route element={<RedirectRoute />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>
      
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/discover" element={<Discover />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/list/:id" element={<ListDetail />} />
          <Route path="/folder/:id" element={<FolderDetail />} />
          <Route path="/tag/:tag" element={<TagDetail />} />
          <Route path="/unassigned" element={<Unassigned />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/under-construction" element={<UnderConstruction />} />
        </Route>
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;