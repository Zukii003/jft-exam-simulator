import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for development
const mockExams = [
  {
    id: '1',
    title: 'JFT-Basic Practice Test',
    description: 'Japanese Language Proficiency Test Simulation',
    duration_minutes: 120
  }
];

const mockQuestions = [
  {
    id: '1',
    exam_id: '1',
    question_text: 'What is the Japanese character for "water"?',
    question_type: 'multiple_choice',
    section_number: 1,
    question_order: 1,
    options: '["水", "火", "木", "金"]',
    correct_answer: '水'
  }
];

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold">JFT</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">JFT-Basic CBT</h1>
                <p className="text-sm text-gray-600">Megono Jepun</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">Admin</Button>
              <Button variant="ghost">Logout</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Exams</h2>
          <p className="text-gray-600">Practice for your Japanese Language Proficiency Test with our realistic CBT simulation</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockExams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-gray-900 mb-2">{exam.title}</CardTitle>
                <CardDescription className="text-gray-600">{exam.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3">
                  Start Exam
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

function ExamPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold">JFT</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">JFT-Basic CBT</h1>
                <p className="text-sm text-gray-600">Megono Jepun</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">Back to Dashboard</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Section 1: Characters & Vocabulary</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Question 1 of 25</span>
                <span>Time: 24:30</span>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">What is the Japanese character for "water"?</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">水</Button>
                <Button variant="outline" className="w-full justify-start">火</Button>
                <Button variant="outline" className="w-full justify-start">木</Button>
                <Button variant="outline" className="w-full justify-start">金</Button>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline">Previous</Button>
              <Button className="bg-blue-600 hover:bg-blue-700">Next</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/exam/:examId" element={<ExamPage />} />
      </Routes>
    </Router>
  );
}

export default App;
