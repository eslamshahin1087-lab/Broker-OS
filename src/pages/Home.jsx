import React from 'react';

const Home = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: 'var(--primary-blue)' }}>مرحباً بك في Broker-OS</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        نظام إدارة العملاء لوسطاء التأمين
      </p>

      <div style={{
        background: 'var(--card-bg)',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>لوحة التحكم</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          اختر من القائمة السفلية للبدء
        </p>
      </div>
    </div>
  );
};

export default Home;