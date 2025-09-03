import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { GiSunflower } from 'react-icons/gi';
import { FaLock } from 'react-icons/fa';
import { verifyOtp, resendOtp } from '../services/api';
import ErrorMessage from '../utils/ErrorMsg';

interface LocationState {
  userId: number;
  email: string;
}

const VerifyOtp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, email } = (location.state as LocationState) || { userId: 0, email: '' };

  const [otpCode, setOtpCode] = useState<string>('');
  const [errors, setErrors] = useState({ otpCode: '', api: '' });
  const [isVerifying, setIsVerifying] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Allow only digits
    setOtpCode(value);
    setErrors({ otpCode: '', api: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setErrors((prev) => ({ ...prev, otpCode: 'Please enter a 6-digit OTP' }));
      return;
    }

    setIsVerifying(true);
    try {
      await verifyOtp({ userId, otpCode });
      navigate('/dashboard');
    } catch (error) {
        let errorMsg = 'Invalid or expired OTP';
        if (typeof error === 'object' && error !== null && 'response' in error) {
            const apiError = error as { response?: { data?: { error?: string } } };
            errorMsg = apiError.response?.data?.error || 'Login failed. Please try again.';
        }
      setErrors((prev) => ({ ...prev, api: errorMsg }));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp({ email });
      setErrors((prev) => ({ ...prev, api: 'OTP resent. Check your email (including spam).' }));
    } catch (error) {
        let errorMsg = 'Failed to resend OTP. Please try again.';
        if (typeof error === 'object' && error !== null && 'response' in error) {
            const apiError = error as { response?: { data?: { error?: string } } };
            errorMsg = apiError.response?.data?.error || 'Failed to resend OTP. Please try again.';
        }
      setErrors((prev) => ({ ...prev, api: errorMsg }));
    }
  };

  if (!userId || !email) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-primary-orange to-secondary-orange font-lato">
      {/* Left Panel - Branding */}
      <div className="w-full md:w-[50%] flex items-center justify-center p-8 md:p-12 bg-primary-orange rounded-br-3xl">
        <div className="text-center max-w-xs">
          <div className="flex items-center justify-center mb-6">
            <GiSunflower className="text-white text-6xl mr-2" />
            <h1 className="text-5xl font-bold text-white font-dancing">SEV</h1>
          </div>
          <p className="text-off-white-tint mt-4 text-lg">
            Share & request resources in your community
          </p>
        </div>
      </div>

      {/* Right Panel - OTP Form */}
      <div className="w-full md:w-3/5 bg-off-white-tint rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-light-orange-tint opacity-20"></div>
        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-white opacity-20"></div>

        <div className="max-w-md mx-auto w-full relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-dark-orange">Verify Your Email</h1>
            <p className="text-gray-500 mt-2 text-sm">
              Enter the 6-digit OTP sent to {email}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="otpCode" className="block text-sm font-medium text-gray-600 mb-1">
                OTP Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="otpCode"
                  id="otpCode"
                  value={otpCode}
                  onChange={handleChange}
                  placeholder="Enter 6-digit OTP"
                  className={`text-sm w-full px-4 py-3 pl-10 border ${
                    errors.otpCode || errors.api ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-1 focus:ring-primary-orange focus:border-primary-orange outline-none transition bg-white`}
                  maxLength={6}
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <ErrorMessage message={errors.otpCode || errors.api} />
            </div>
            <button
              type="submit"
              className="w-full bg-primary-orange hover:bg-secondary-orange text-white py-3 px-4 rounded-lg font-medium shadow-sm transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <p className="text-sm text-gray-500">
              Didn’t receive the OTP?{' '}
              <button
                type="button"
                onClick={handleResend}
                className="font-medium text-primary-orange hover:text-secondary-orange"
              >
                Resend OTP
              </button>
            </p>
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-orange hover:text-secondary-orange"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;