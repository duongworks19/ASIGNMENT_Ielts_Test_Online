import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';
import ScrollToTop from './components/common/ScrollToTop';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <div className="App">
          <AppRoutes />
          <Toaster position="top-right" reverseOrder={false} />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
