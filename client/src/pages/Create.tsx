import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authUtils';
import { createListing, createRequest } from '../services/api';
import ErrorMessage from '../utils/ErrorMsg';
import NavBar from '../components/Navbar';
import Lottie from 'lottie-react';
import Empty from '../assets/empty.json';
import { FaPlus, FaQuestionCircle } from 'react-icons/fa';
import { GiClothes, GiSofa } from 'react-icons/gi';
import { MdElectricBolt, MdFastfood, MdMenuBook, MdHouse } from 'react-icons/md';

interface User {
  id: number;
  fname: string;
  lname: string;
  email: string;
  role: 'DONOR' | 'ACCEPTOR' | 'ADMIN';
  isVerified: boolean;
  address: string;
}

const categories = [
  { name: 'CLOTHING', icon: <GiClothes /> },
  { name: 'ELECTRONICS', icon: <MdElectricBolt /> },
  { name: 'FOOD', icon: <MdFastfood /> },
  { name: 'FURNITURE', icon: <GiSofa /> },
  { name: 'BOOKS', icon: <MdMenuBook /> },
  { name: 'HOUSEHOLD', icon: <MdHouse /> },
  { name: 'SPECIAL_REQUEST', icon: <FaQuestionCircle /> },
];

const Create = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [itemType, setItemType] = useState<'listing' | 'request'>('listing');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ title?: string; description?: string; api?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white-tint flex items-center justify-center text-gray-500">
        <Lottie animationData={Empty} loop={true} className="w-48 h-48" />
        <p className="mt-4 text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setIsDialogOpen(false);
  };

  const validateForm = () => {
    const newErrors: { title?: string; description?: string } = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!selectedCategory) {
      newErrors.description = 'Please select a category';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        userId: user.id,
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory!,
      };

      if (itemType === 'listing') {
        await createListing(payload);
      } else {
        await createRequest(payload);
      }

      setErrors({ api: '' });
      navigate('/dashboard');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to create item';
      setErrors({ api: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-lato">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-gray-800">
            Create New{' '}
            <span className="text-dark-orange">
              {itemType === 'listing' ? 'Listing' : 'Request'}
            </span>
          </h1>
          {user.role === 'ACCEPTOR' && (
            <div className="flex space-x-4">
              <button
                onClick={() => setItemType('listing')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  itemType === 'listing'
                    ? 'bg-dark-orange text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-secondary-orange hover:text-white'
                }`}
              >
                Listing
              </button>
              <button
                onClick={() => setItemType('request')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  itemType === 'request'
                    ? 'bg-dark-orange text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-secondary-orange hover:text-white'
                }`}
              >
                Request
              </button>
            </div>
          )}
        </div>

        <div className="bg-white px-8 py-4 rounded-xl shadow-sm border border-gray-100">
          <button
            onClick={() => setIsDialogOpen(true)}
            className="mb-6 flex items-center px-4 py-2 bg-primary-orange text-white rounded-lg hover:bg-secondary-orange font-medium transition-colors"
          >
            <FaPlus className="mr-2" />
            Select Category
          </button>

          {selectedCategory && (
            <div className="mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {selectedCategory.replace('_', ' ')}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-orange focus:border-primary-orange sm:text-sm"
                placeholder="Enter title"
              />
              {errors.title && <ErrorMessage message={errors.title} />}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setErrors((prev) => ({ ...prev, description: undefined }));
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-orange focus:border-primary-orange sm:text-sm"
                rows={4}
                placeholder="Enter description"
              />
              {errors.description && <ErrorMessage message={errors.description} />}
            </div>

            {errors.api && <ErrorMessage message={errors.api} />}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-dark-orange hover:bg-secondary-orange focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-orange transition-colors ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <Lottie animationData={Empty} loop={true} className="w-6 h-6 mr-2" />
                ) : (
                  `Create ${itemType === 'listing' ? 'Listing' : 'Request'}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-dark-orange mb-4">Select Category</h3>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategorySelect(category.name)}
                  className="flex items-center justify-center px-4 py-3 rounded-lg bg-white text-gray-700 border border-gray-200 hover:bg-secondary-orange hover:text-white hover:border-secondary-orange transition-all duration-200"
                >
                  <span className="mr-2 text-lg">{category.icon}</span>
                  <span className="text-sm font-medium capitalize">
                    {category.name.toLowerCase().replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsDialogOpen(false)}
              className="mt-6 w-full px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Create;