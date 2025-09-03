import { FaEyeSlash, FaEye, FaEnvelope, FaLock, FaUser, FaFileUpload } from 'react-icons/fa';
import { GiSunflower } from 'react-icons/gi';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { checkPasswordStrength } from '../utils/PasswdCheck';
import ErrorMessage from '../utils/ErrorMsg';
import { register } from '../services/api'; // Updated import

interface RegisterFormData {
  fname: string;
  lname: string;
  email: string;
  password: string;
  address: string;
  role: 'DONOR' | 'ACCEPTOR';
  document?: File | null;
}

export default function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    fname: '',
    lname: '',
    email: '',
    password: '',
    address: '',
    role: 'DONOR',
    document: null,
  });
  const [errors, setErrors] = useState({
    fname: '',
    lname: '',
    email: '',
    password: '',
    address: '',
    role: '',
    document: '',
    api: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setErrors((prev) => ({
        ...prev,
        email: emailRegex.test(value) ? '' : 'Please enter a valid email address',
      }));
    }
    if (name === 'role' && value === 'DONOR') {
      setFormData((prev) => ({ ...prev, document: null }));
      setErrors((prev) => ({ ...prev, document: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      document: file,
    }));
    setErrors((prev) => ({ ...prev, document: '', api: '' }));

    if (file) {
      if (file.type !== 'application/pdf') {
        setErrors((prev) => ({ ...prev, document: 'Only PDF files are allowed' }));
      } else if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, document: 'File size must be less than 5MB' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ fname: '', lname: '', email: '', password: '', address: '', role: '', document: '', api: '' });

    // Client-side validation
    let hasError = false;
    const newErrors = { ...errors };

    if (!formData.fname.trim()) {
      newErrors.fname = 'First name is required';
      hasError = true;
    }
    if (!formData.lname.trim()) {
      newErrors.lname = 'Last name is required';
      hasError = true;
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      hasError = true;
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
      hasError = true;
    } else {
      const { isValid, error } = checkPasswordStrength(formData.password);
      if (!isValid) {
        newErrors.password = error;
        hasError = true;
      }
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
      hasError = true;
    }
    if (!formData.role) {
      newErrors.role = 'Please select a role';
      hasError = true;
    }
    if (formData.role === 'ACCEPTOR' && !formData.document) {
      newErrors.document = 'Document is required for Acceptor role';
      hasError = true;
    }
    if (formData.document) {
      if (formData.document.type !== 'application/pdf') {
        newErrors.document = 'Only PDF files are allowed';
        hasError = true;
      } else if (formData.document.size > 5 * 1024 * 1024) {
        newErrors.document = 'File size must be less than 5MB';
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    try {
      const registerData = {
        fname: formData.fname,
        lname: formData.lname,
        email: formData.email,
        password: formData.password,
        address: formData.address,
        role: formData.role,
        ...(formData.document && { document: formData.document }),
      };
      const response: { message: string; userId: number } = await register(registerData);
      navigate('/verify-otp', { state: { userId: response.userId, email: formData.email } });
    } catch (error) {
      let errorMsg = 'Registration failed. Please try again.';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as { response?: { data?: { error?: string } } };
        errorMsg = apiError.response?.data?.error || 'Registration failed. Please try again.';
      }
      setErrors((prev) => ({ ...prev, api: errorMsg }));
    }
  };

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

      {/* Right Panel - Register Form */}
      <div className="w-full md:w-3/5 bg-off-white-tint rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-light-orange-tint opacity-20"></div>
        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-white opacity-20"></div>

        <div className="max-w-md mx-auto w-full relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-dark-orange flex items-center justify-center">
              Sign Up
            </h1>
            <p className="text-gray-500 mt-2">Create your Community Resource Tracker account</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="fname" className="block text-sm font-medium text-gray-600 mb-1">
                First Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fname"
                  id="fname"
                  value={formData.fname}
                  onChange={handleChange}
                  placeholder="John"
                  className={`text-sm w-full px-4 py-3 pl-10 border ${
                    errors.fname ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-1 focus:ring-primary-orange focus:border-primary-orange outline-none transition bg-white`}
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <ErrorMessage message={errors.fname} />
            </div>

            <div>
              <label htmlFor="lname" className="block text-sm font-medium text-gray-600 mb-1">
                Last Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="lname"
                  id="lname"
                  value={formData.lname}
                  onChange={handleChange}
                  placeholder="Doe"
                  className={`text-sm w-full px-4 py-3 pl-10 border ${
                    errors.lname ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-1 focus:ring-primary-orange focus:border-primary-orange outline-none transition bg-white`}
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <ErrorMessage message={errors.lname} />
            </div>

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
              <ErrorMessage message={errors.password} />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-600 mb-1">
                Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street, City, Country"
                  className={`text-sm w-full px-4 py-3 pl-10 border ${
                    errors.address ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-1 focus:ring-primary-orange focus:border-primary-orange outline-none transition bg-white`}
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <ErrorMessage message={errors.address} />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-600 mb-1">
                Role
              </label>
              <select
                name="role"
                id="role"
                value={formData.role}
                onChange={handleChange}
                className={`text-sm w-full px-4 py-3 border ${
                  errors.role ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-1 focus:ring-primary-orange focus:border-primary-orange outline-none transition bg-white`}
                required
              >
                <option value="DONOR">Donor</option>
                <option value="ACCEPTOR">Acceptor</option>
              </select>
              <ErrorMessage message={errors.role} />
            </div>

            {formData.role === 'ACCEPTOR' && (
              <div>
                <label htmlFor="document" className="block text-sm font-medium text-gray-600 mb-1">
                  Document Upload (PDF)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    name="document"
                    id="document"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className={`text-sm w-full px-4 py-3 pl-10 border ${
                      errors.document ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg focus:ring-1 focus:ring-primary-orange focus:border-primary-orange outline-none transition bg-white`}
                    required={formData.role === 'ACCEPTOR'}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaFileUpload className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <ErrorMessage message={errors.document} />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary-orange hover:bg-secondary-orange text-white py-3 px-4 rounded-lg font-medium shadow-sm transition-colors duration-300 flex items-center justify-center"
            >
              Sign Up
            </button>
            <ErrorMessage message={errors.api} />
          </form>

          <div className="mt-8 text-center">
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
}