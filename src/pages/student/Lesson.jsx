import React from 'react';
import { useParams } from 'react-router-dom';

// TODO: Phần Lesson sẽ được code sau bởi thành viên phụ trách
export default function Lesson() {
  const { id } = useParams();
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Lesson {id}</h2>
      <p style={{ color: '#5b616e' }}>Trang này sẽ được phát triển sau.</p>
    </div>
  );
}
