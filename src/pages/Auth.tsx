import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useToast } from '@/hooks/use-toast';
import { BookOpen } from 'lucide-react';
import { z } from 'zod';

// Input validation schemas
const emailSchema = z.string().trim().email({ message: 'Invalid email address' }).max(255);
const passwordSchema = z.string().min(6, { message: 'Password must be at least 6 characters' }).max(128);
const nameSchema = z.string().trim().min(1, { message: 'Name is required' }).max(100);

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Update lockout countdown
  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil.getTime() - Date.now()) / 1000));
      setLockoutRemaining(remaining);
      if (remaining <= 0) {
        setLockoutUntil(null);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if locked out
    if (lockoutUntil && new Date() < lockoutUntil) {
      toast({
        title: t('error'),
        description: `Too many failed attempts. Please wait ${lockoutRemaining} seconds.`,
        variant: 'destructive',
      });
      return;
    }

    // Validate inputs
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast({ title: t('error'), description: emailResult.error.errors[0].message, variant: 'destructive' });
      return;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast({ title: t('error'), description: passwordResult.error.errors[0].message, variant: 'destructive' });
      return;
    }

    if (!isLogin) {
      const nameResult = nameSchema.safeParse(name);
      if (!nameResult.success) {
        toast({ title: t('error'), description: nameResult.error.errors[0].message, variant: 'destructive' });
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          // Handle failed login attempt
          const newAttempts = failedAttempts + 1;
          setFailedAttempts(newAttempts);

          // Progressive lockout after 5 failed attempts
          if (newAttempts >= 5) {
            const lockoutDuration = Math.pow(2, newAttempts - 5) * 30 * 1000; // 30s, 60s, 120s...
            setLockoutUntil(new Date(Date.now() + lockoutDuration));
            toast({
              title: t('error'),
              description: `Too many failed attempts. Account locked for ${Math.ceil(lockoutDuration / 1000)} seconds.`,
              variant: 'destructive',
            });
          } else {
            toast({
              title: t('error'),
              description: `Invalid credentials. ${5 - newAttempts} attempts remaining.`,
              variant: 'destructive',
            });
          }
          return;
        }

        // Success - reset counters
        setFailedAttempts(0);
        setLockoutUntil(null);
        navigate('/dashboard');
      } else {
        const { error } = await signUp(email, password, name);
        if (error) throw error;
        toast({ title: t('success'), description: 'Account created successfully!' });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const isLockedOut = lockoutUntil && new Date() < lockoutUntil;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{isLogin ? t('loginTitle') : t('registerTitle')}</CardTitle>
          <CardDescription>{isLogin ? t('loginSubtitle') : t('registerSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLockedOut && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
              <p className="text-sm text-destructive font-medium">
                Account temporarily locked. Try again in {lockoutRemaining}s
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  maxLength={100}
                  disabled={isLockedOut}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                maxLength={255}
                disabled={isLockedOut}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                maxLength={128}
                disabled={isLockedOut}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || isLockedOut}>
              {loading ? t('loading') : (isLogin ? t('login') : t('register'))}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {isLogin ? t('noAccount') : t('hasAccount')}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
              {isLogin ? t('register') : t('login')}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
