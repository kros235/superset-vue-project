// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';
import 'antd/dist/reset.css';
import './App.css';

import Dashboard from './components/Dashboard';
import DataSourceManager from './components/DataSourceManager';
import ChartBuilder from './components/ChartBuilder';
import UserManagement from './components/UserManagement';
import Login from './components/Login';
import Layout from './components/Layout';

function App() {
  return (
    <ConfigProvider locale={koKR}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="datasources" element={<DataSourceManager />} />
              <Route path="charts" element={<ChartBuilder />} />
              <Route path="users" element={<UserManagement />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
