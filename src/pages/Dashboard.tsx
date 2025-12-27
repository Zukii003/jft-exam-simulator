import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BookOpen, LogOut, Play, Settings } from 'lucide-react';
import { Exam } from '@/types/exam';
import PoweredByFooter from '@/components/PoweredByFooter';

const Dashboard: React.FC = () => {
  const { user, signOut, isAdmin, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">JFT-Basic CBT</h1>
                <p className="text-sm text-gray-600">Megono Jepun</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              {isAdmin && (
                <Button variant="outline" onClick={() => navigate('/admin')} className="gap-2 border-gray-300 hover:bg-gray-50">
                  <Settings className="h-4 w-4" /> {t('admin')}
                </Button>
              )}
              <Button variant="ghost" onClick={handleLogout} className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <LogOut className="h-4 w-4" /> {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('exams')}</h2>
          <p className="text-gray-600">Practice for your Japanese Language Proficiency Test with our realistic CBT simulation</p>
        </div>
        
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500">Dashboard is loading...</p>
          <p className="text-sm text-gray-400 mt-2">User: {user?.email}</p>
          <p className="text-sm text-gray-400">Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
        </div>
      </main>

      <PoweredByFooter />
    </div>
  );
};

export default Dashboard;
