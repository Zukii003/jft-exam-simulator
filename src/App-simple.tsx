import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Button } from '@/components/ui/button';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-3xl font-bold mb-8">JFT-Basic CBT</h1>
        <div className="space-y-4">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Start Exam
          </Button>
          <Button variant="outline">
            Admin Panel
          </Button>
        </div>
      </div>
    </Router>
  );
}

export default App;
