import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/LanguageToggle';
import { BookOpen, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import PoweredByFooter from '@/components/PoweredByFooter';

const Index = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">JFT-Basic CBT</span>
        </div>
        <LanguageToggle />
      </header>

      <main className="flex flex-col items-center justify-center flex-1 px-6 text-center">
        <div className="max-w-2xl fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            JFT-Basic <span className="text-primary">Computer-Based Test</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 font-jp">
            日本語基礎テスト (JFT-Basic) シミュレーター
          </p>
          <p className="text-muted-foreground mb-8">
            Practice for your Japanese Language Proficiency Test with our realistic CBT simulation.
            Featuring all 4 sections: Characters & Vocabulary, Conversation & Expression, Listening, and Reading.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
              {t('login')} <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              {t('register')}
            </Button>
          </div>
        </div>
      </main>

      <PoweredByFooter />
    </div>
  );
};

export default Index;
