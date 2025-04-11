import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Region = Database['public']['Tables']['regions']['Row'];
type Hospital = Database['public']['Tables']['hospitals']['Row'];

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'nurse' | 'doctor' | 'assistant' | 'headNurse'>('nurse');
  const navigate = useNavigate();
  const { signIn, signUp, user, clearError } = useAuthStore();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    loadRegions();
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      loadHospitals(selectedRegion);
    } else {
      setHospitals([]);
      setSelectedHospital('');
    }
  }, [selectedRegion]);

  const loadRegions = async () => {
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .order('name_cs');
      
      if (error) throw error;
      setRegions(data || []);
    } catch (error) {
      console.error('Error loading regions:', error);
    }
  };

  const loadHospitals = async (regionId: string) => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('region_id', regionId)
        .order('name');
      
      if (error) throw error;
      setHospitals(data || []);
      // Reset selected hospital when region changes
      setSelectedHospital('');
    } catch (error) {
      console.error('Error loading hospitals:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    clearError();
    
    try {
      if (!email || !password) {
        throw new Error('Пожалуйста, заполните все обязательные поля');
      }

      if (isSignUp) {
        if (!name) {
          throw new Error('Пожалуйста, введите ваше имя');
        }
        if (!selectedHospital) {
          throw new Error('Пожалуйста, выберите больницу');
        }
        if (!selectedRole) {
          throw new Error('Пожалуйста, выберите роль');
        }

        await signUp(email, password, name, selectedRole, selectedHospital);
      } else {
        await signIn(email, password);
      }
      navigate('/');
    } catch (err) {
      let errorMessage = 'Произошла ошибка';
      
      if (err instanceof Error) {
        if (err.message.includes('invalid_credentials')) {
          errorMessage = 'Неверный email или пароль';
        } else if (err.message.includes('Email not confirmed')) {
          errorMessage = 'Пожалуйста, подтвердите ваш email';
        } else if (err.message.includes('User already registered') || err.message.includes('user_already_exists')) {
          errorMessage = 'Этот email уже зарегистрирован';
        } else if (err.message.includes('Invalid email')) {
          errorMessage = 'Пожалуйста, введите корректный email';
        } else if (err.message.includes('Weak password')) {
          errorMessage = 'Пароль должен содержать минимум 6 символов';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-24 h-24 relative overflow-hidden rounded-2xl shadow-xl">
            <img 
              src="https://lphvctwbxtpmpoqcrcmo.supabase.co/storage/v1/object/public/MedOk_logos/logo.jpg" 
              alt="MedOK Logo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          MedOK
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex justify-center space-x-8 mb-8">
            <button 
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError('');
                clearError();
              }}
              className={`text-gray-500 font-medium pb-1 border-b-2 ${!isSignUp ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-gray-700'}`}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError('');
                clearError();
              }}
              className={`text-gray-500 font-medium pb-1 border-b-2 ${isSignUp ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-gray-700'}`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} method="POST">
            {isSignUp && (
              <div>
                <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    required={isSignUp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {isSignUp && (
              <>
                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                    Region
                  </label>
                  <div className="mt-1">
                    <select
                      id="region"
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select region</option>
                      {regions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.name_cs}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="hospital" className="block text-sm font-medium text-gray-700">
                    Hospital
                  </label>
                  <div className="mt-1">
                    <select
                      id="hospital"
                      value={selectedHospital}
                      onChange={(e) => setSelectedHospital(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={!selectedRegion}
                    >
                      <option value="">Select hospital</option>
                      {hospitals.map((hospital) => (
                        <option key={hospital.id} value={hospital.id}>
                          {hospital.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <div className="mt-1">
                    <select
                      id="role"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as 'nurse' | 'doctor' | 'assistant' | 'headNurse')}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="nurse">Nurse</option>
                      <option value="doctor">Doctor</option>
                      <option value="assistant">Assistant</option>
                      <option value="headNurse">Head Nurse</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="current-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  minLength={6}
                />
              </div>
              {isSignUp && (
                <p className="mt-1 text-sm text-gray-500">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  isSignUp ? 'Sign Up' : 'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}