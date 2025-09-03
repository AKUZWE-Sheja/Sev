import { FaEyeSlash, FaEye, FaEnvelope, FaLock } from 'react-icons/fa';
import { GiSunflower } from "react-icons/gi";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { checkPasswordStrength } from '../utils/PasswdCheck';
import ErrorMessage from '../utils/ErrorMsg';
import { login } from '../services/api';

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    api: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '', api: '' }));

    if (name === 'password') {
      const { isValid, error } = checkPasswordStrength(value);
      setErrors((prev) => ({ ...prev, password: isValid ? '' : error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ email: '', password: '', api: '' });

    const { isValid, error } = checkPasswordStrength(formData.password);
    if (!isValid) {
      setErrors((prev) => ({ ...prev, password: error }));
      return;
    }

    try {
  await login({ email: formData.email, password: formData.password });
  navigate('/dashboard');
} catch (error) {
  let errorMsg = 'Login failed. Please try again.';
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const apiError = error as { response?: { data?: { error?: string } } };
    errorMsg = apiError.response?.data?.error || 'Login failed. Please try again.';
  }
  setErrors((prev) => ({ ...prev, api: errorMsg }));
}
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-primary-orange to-secondary-orange">
      {/* Left Panel - Branding */}
      <div className="w-full md:w-[50%] flex items-center justify-center p-8 md:p-12 bg-primary-orange rounded-br-3xl">
        <div className="text-center max-w-xs">
          <div className="flex items-center justify-center mb-6">
            <GiSunflower  className="text-white text-6xl mr-2" />
            <h1 className="text-5xl font-bold text-white font-dancing">
              SEV
            </h1>
          </div>
          <p className="text-off-white-tint mt-4 text-lg">
            Share & request resources in your community
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full md:w-3/5 bg-off-white-tint rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-light-orange-tint opacity-20"></div>
        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-white opacity-20"></div>

        <div className="max-w-md mx-auto w-full relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-dark-orange flex items-center justify-center">
              Sign In
            </h1>
            <p className="text-gray-500 mt-2">Access your Community Resource Tracker account</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className={`text-sm w-full px-4 py-3 pl-10 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-1 focus:ring-primary-orange focus:border-primary-orange outline-none transition bg-white`}
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <ErrorMessage message={errors.email} />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`text-sm w-full px-4 py-3 pl-10 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-1 focus:ring-primary-orange focus:border-primary-orange outline-none transition bg-white`}
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FaEye className="h-5 w-5" /> : <FaEyeSlash className="h-5 w-5" />}
                </button>
              </div>
              <ErrorMessage message={errors.password || errors.api} />
            </div>

            <button
              type="submit"
              className="w-full bg-primary-orange hover:bg-secondary-orange text-white py-3 px-4 rounded-lg font-medium shadow-sm transition-colors duration-300 flex items-center justify-center"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-orange hover:text-secondary-orange"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}