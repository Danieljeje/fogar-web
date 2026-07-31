'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { auth } from '../../../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import {
  Sparkles,
  Calendar,
  HeartHandshake,
  Music2,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  MailCheck,
} from 'lucide-react';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

const DEPARTMENTS = [
  'Youth Choir',
  'Ushering Unit',
  'Technical Team',
  'Prayer Warriors',
  'Children Ministry',
  'Media Department',
  'Welfare Team',
  'Evangelism Unit',
];

const FEATURES = [
  { icon: Calendar, label: 'Volunteer Roster Management', desc: 'Accept or decline service shifts instantly' },
  { icon: HeartHandshake, label: 'EchoPrayer Vault', desc: 'Submit and intercede for community prayer requests' },
  { icon: Music2, label: 'SacredArchive Media', desc: 'Stream sermons with low-bandwidth support' },
];

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const router = useRouter();

  const loginForm = useForm<LoginFormData>({ defaultValues: { email: '', password: '', rememberMe: false } });
  const signupForm = useForm<SignupFormData>({ defaultValues: { firstName: '', lastName: '', email: '', phone: '', department: '', password: '', confirmPassword: '', agreeTerms: false } });

  const handleLogin = async (data: LoginFormData) => {
    setLoginLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        toast.error('Please verify your email before signing in. Check your inbox.');
        setLoginLoading(false);
        return;
      }

      const idToken = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (res.ok) {
        const profile = await res.json();
        toast.success('Signed in successfully!');
        router.push(profile.role === 'ADMIN' ? '/admin-panel' : '/member-dashboard');
      } else {
        toast.error('Could not load your profile. Please try again.');
      }
    } catch (error: unknown) {
      const errorCode = (error as { code?: string })?.code;
      const message =
        errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password'
          ? 'Incorrect email or password.'
          : errorCode === 'auth/user-not-found'
          ? 'No account found with this email.'
          : errorCode === 'auth/too-many-requests'
          ? 'Too many attempts. Please try again later.'
          : 'Something went wrong. Please try again.';
      toast.error(message);
      loginForm.setError('password', { message });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    if (data.password !== data.confirmPassword) {
      signupForm.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }
    setSignupLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      await sendEmailVerification(user);

      // Persist profile data to Spring Boot backend
      const idToken = await user.getIdToken();
      await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          department: data.department,
          role: 'MEMBER',
        }),
      });

      setVerificationSent(true);
      toast.success('Account created! Check your email to verify your address.');
    } catch (error: unknown) {
      const errorCode = (error as { code?: string })?.code;
      const message =
        errorCode === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : errorCode === 'auth/weak-password'
          ? 'Password is too weak.'
          : errorCode === 'auth/invalid-email'
          ? 'Enter a valid email address.'
          : 'Something went wrong. Please try again.';
      toast.error(message);
      signupForm.setError('email', { message });
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] gradient-primary flex-col justify-between p-10 xl:p-14 relative overflow-hidden">
       
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-[-40px] w-40 h-40 rounded-full bg-yellow-300/10" />

        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-300/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-yellow-300" strokeWidth={2} />
          </div>
          <span className="font-extrabold text-xl text-white tracking-widest">FOGAR</span>
        </div>

       
        <div className="relative z-10">
          <p className="text-yellow-300/90 text-sm font-semibold mb-3 tracking-widest uppercase">Fullness of God Church</p>
          <h1 className="text-hero text-white mb-5 leading-tight">
            Serving Together,<br />Growing in Faith
          </h1>
          <p className="text-white/75 text-base leading-relaxed max-w-sm mb-8">
            Manage your volunteer schedule, join the prayer wall, and access sermon archives — all from one secure platform built for your church family.
          </p>

          
          <div className="space-y-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={`feature-${f.label}`} className="flex items-start gap-3 bg-white/10 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-300/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-yellow-300" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{f.label}</p>
                    <p className="text-white/60 text-xs mt-0.5">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

       
        <div className="relative z-10">
          <blockquote className="text-white/70 text-sm italic leading-relaxed border-l-2 border-yellow-300/50 pl-4">
            &ldquo;For where two or three gather in my name, there am I with them.&rdquo;
          </blockquote>
          <p className="text-yellow-300/70 text-xs mt-1.5 pl-4">— Matthew 18:20</p>
        </div>
      </div>

     
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 lg:px-12 xl:px-16 bg-background overflow-y-auto">
        <div className="w-full max-w-md">
          
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-yellow-300" strokeWidth={2} />
            </div>
            <span className="font-extrabold text-lg text-foreground tracking-widest">FOGAR</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">
            {activeTab === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {activeTab === 'login' ? 'Welcome back to Fullness of God Church' : 'Join the Fullness of God Church digital community'}
          </p>

         
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            {(['login', 'signup'] as const).map((tab) => (
              <button
                key={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={[
                  'flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
                  activeTab === tab
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {tab === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

         
          {verificationSent && activeTab === 'signup' && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <MailCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-emerald-800 font-semibold text-sm">Account created successfully!</p>
                <p className="text-emerald-700 text-xs mt-0.5">
                  A verification email has been sent to your inbox. Please verify your email before signing in.
                </p>
              </div>
            </div>
          )}

          
          {activeTab === 'login' && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 fade-in">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="your email address"
                  className={`input-field ${loginForm.formState.errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                  {...loginForm.register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
                  })}
                />
                {loginForm.formState.errors.email?.message && (
                  <p className="mt-1 text-xs text-red-500">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={`input-field pr-10 ${loginForm.formState.errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
                    {...loginForm.register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
                  </button>
                </div>
                {loginForm.formState.errors.password?.message && (
                  <p className="mt-1 text-xs text-red-500">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
                    {...loginForm.register('rememberMe')}
                  />
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
                <button type="button" className="text-sm text-primary font-medium hover:underline">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="btn-primary w-full py-3 text-base"
                style={{ minHeight: '48px' }}
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          )}

          {/* SIGNUP FORM */}
          {activeTab === 'signup' && (
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4 fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">First Name</label>
                  <input
                    type="text"
                    placeholder="your first name"
                    className={`input-field ${signupForm.formState.errors.firstName ? 'border-red-400' : ''}`}
                    {...signupForm.register('firstName', { required: 'First name is required' })}
                  />
                  {signupForm.formState.errors.firstName && (
                    <p className="mt-1 text-xs text-red-500">{signupForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Last Name</label>
                  <input
                    type="text"
                    placeholder="your last name"
                    className={`input-field ${signupForm.formState.errors.lastName ? 'border-red-400' : ''}`}
                    {...signupForm.register('lastName', { required: 'Last name is required' })}
                  />
                  {signupForm.formState.errors.lastName && (
                    <p className="mt-1 text-xs text-red-500">{signupForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="your email address"
                  className={`input-field ${signupForm.formState.errors.email ? 'border-red-400' : ''}`}
                  {...signupForm.register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                  })}
                />
                {signupForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-500">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Phone Number</label>
                <p className="text-xs text-muted-foreground mb-1.5">Nigerian mobile number (e.g. 08012345678)</p>
                <input
                  type="tel"
                  placeholder="08012345678"
                  className={`input-field ${signupForm.formState.errors.phone ? 'border-red-400' : ''}`}
                  {...signupForm.register('phone', {
                    required: 'Phone number is required',
                    pattern: { value: /^0[789][01]\d{8}$/, message: 'Enter a valid Nigerian phone number' },
                  })}
                />
                {signupForm.formState.errors.phone && (
                  <p className="mt-1 text-xs text-red-500">{signupForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Department / Unit</label>
                <p className="text-xs text-muted-foreground mb-1.5">The church department you belong to or wish to join</p>
                <select
                  className={`input-field ${signupForm.formState.errors.department ? 'border-red-400' : ''}`}
                  {...signupForm.register('department', { required: 'Please select your department' })}
                >
                  <option value="">Select department…</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={`dept-${d}`} value={d}>{d}</option>
                  ))}
                </select>
                {signupForm.formState.errors.department && (
                  <p className="mt-1 text-xs text-red-500">{signupForm.formState.errors.department.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    className={`input-field pr-10 ${signupForm.formState.errors.password ? 'border-red-400' : ''}`}
                    {...signupForm.register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      pattern: { value: /^(?=.*[A-Z])(?=.*\d)/, message: 'Must include one uppercase letter and one number' },
                    })}
                  />
                  <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
                  </button>
                </div>
                {signupForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-500">{signupForm.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    className={`input-field pr-10 ${signupForm.formState.errors.confirmPassword ? 'border-red-400' : ''}`}
                    {...signupForm.register('confirmPassword', { required: 'Please confirm your password' })}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
                  </button>
                </div>
                {signupForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{signupForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 rounded border-border text-primary"
                    {...signupForm.register('agreeTerms', { required: 'You must agree to the terms' })}
                  />
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    I agree to the{' '}
                    <span className="text-primary font-medium cursor-pointer hover:underline">Terms of Service</span>
                    {' '}and{' '}
                    <span className="text-primary font-medium cursor-pointer hover:underline">Privacy Policy</span>
                  </span>
                </label>
                {signupForm.formState.errors.agreeTerms && (
                  <p className="mt-1 text-xs text-red-500">{signupForm.formState.errors.agreeTerms.message}</p>
                )}
              </div>

              
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <p className="text-amber-800 text-xs leading-relaxed">
                  After sign-up, a verification email will be sent to your address. You must verify your email before you can sign in.
                </p>
              </div>

              <button
                type="submit"
                disabled={signupLoading}
                className="btn-primary w-full py-3 text-base"
                style={{ minHeight: '48px' }}
              >
                {signupLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                    Creating account…
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
            {activeTab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
              className="text-primary font-semibold hover:underline"
            >
              {activeTab === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}