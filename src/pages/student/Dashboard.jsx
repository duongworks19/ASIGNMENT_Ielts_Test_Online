import { Link } from 'react-router-dom';

// TODO: Phần Student Dashboard sẽ được code sau bởi thành viên phụ trách
export default function Dashboard() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Student Dashboard</h2>
      <p style={{ color: '#5b616e' }}>Trang này sẽ được phát triển sau.</p>
      
      <div className="mt-4">
        <Link to="/learning/tests" className="btn btn-primary">
          Xem tính năng Practice Test & Quiz
        </Link>
      </div>
    </div>
  );
}
