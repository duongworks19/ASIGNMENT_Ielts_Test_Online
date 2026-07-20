import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * HistoryTable Component
 * Bảng hiển thị danh sách lịch sử làm bài kèm phân trang (Local Pagination).
 * 
 * @param {Array} attempts - Mảng dữ liệu lịch sử bài làm
 */
const HistoryTable = ({ attempts }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // EARS[Unwanted]: If no results match the filter or data is empty, THE system SHALL display an empty state in the history table.
  const isEmpty = !attempts || !Array.isArray(attempts) || attempts.length === 0;

  if (isEmpty) {
    return (
      <div className="card shadow-sm border-0" style={{ backgroundColor: '#ffffff' }}>
        <div className="card-body text-center py-5">
          <div className="text-muted mb-3">
            <span style={{ fontSize: '3rem' }}>📁</span>
          </div>
          <h6 className="text-muted fw-normal" data-testid="table-empty-state">
            Không tìm thấy kết quả nào
          </h6>
        </div>
      </div>
    );
  }

  // Local Pagination Logic
  const totalPages = Math.ceil(attempts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = attempts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // EARS[Event]: WHEN the Student has test attempts, THE system SHALL display them in a paginated list.
  return (
    <div className="card shadow-sm border-0" style={{ backgroundColor: '#ffffff' }}>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th scope="col" className="text-muted fw-semibold ps-4 py-3" style={{ fontSize: '0.85rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Date</th>
              <th scope="col" className="text-muted fw-semibold py-3" style={{ fontSize: '0.85rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Test Name</th>
              <th scope="col" className="text-muted fw-semibold py-3" style={{ fontSize: '0.85rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Band Score</th>
              <th scope="col" className="text-muted fw-semibold py-3" style={{ fontSize: '0.85rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Duration (min)</th>
              <th scope="col" className="text-muted fw-semibold text-end pe-4 py-3" style={{ fontSize: '0.85rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((attempt) => (
              <tr key={attempt.id}>
                <td className="ps-4 text-dark">{new Date(attempt.submittedAt).toLocaleDateString('en-GB')}</td>
                <td>
                  <span className="fw-semibold text-dark">{attempt.testTitle}</span>
                  <br />
                  <small className="text-muted">{attempt.skill}</small>
                </td>
                <td>
                  {attempt.gradingStatus === 'pending' ? (
                    <span className="badge bg-warning text-dark rounded-pill px-3 py-2">
                      Chờ chấm
                    </span>
                  ) : (
                    <span className="badge text-white rounded-pill px-3 py-2" style={{ backgroundColor: '#0052ff' }}>
                      Band {attempt.bandScore || attempt.overallBandScore || 'N/A'}
                    </span>
                  )}
                </td>
                <td className="text-muted">{Math.round((attempt.timeSpent || 0) / 60) || '-'}</td>
                <td className="text-end pe-4">
                  <button 
                    className="btn btn-sm btn-outline-primary fw-bold px-3"
                    onClick={() => navigate(`/learning/tests/review/${attempt.id}`)}
                    data-testid={`btn-view-${attempt.id}`}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="card-footer bg-white border-0 py-3">
          <nav aria-label="History table pagination">
            <ul className="pagination justify-content-center mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button 
                  className="page-link shadow-none text-primary" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  data-testid="pagination-prev"
                >
                  Previous
                </button>
              </li>
              {[...Array(totalPages)].map((_, index) => (
                <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                  <button 
                    className="page-link shadow-none" 
                    onClick={() => handlePageChange(index + 1)}
                    style={currentPage === index + 1 ? { backgroundColor: '#0052ff', borderColor: '#0052ff', color: 'white' } : { color: '#0052ff' }}
                  >
                    {index + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button 
                  className="page-link shadow-none text-primary" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  data-testid="pagination-next"
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
