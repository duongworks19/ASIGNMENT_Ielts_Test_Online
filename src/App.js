import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';
import ScrollToTop from './components/common/ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="App">
        <AppRoutes />
        <Toaster position="top-right" reverseOrder={false} />
      </div>
    </Router>
  );
}

export default App;
