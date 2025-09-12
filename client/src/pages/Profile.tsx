import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authUtils';
import { getUser, updateUserLocation, getListings, getRequests } from '../services/api';
import ErrorMessage from '../utils/ErrorMsg';
import NavBar from '../components/Navbar';
import Lottie from 'lottie-react';
import Empty from '../assets/empty.json';
import { FaUserCircle, FaMapMarkerAlt, FaDonate, FaHandHoldingHeart } from 'react-icons/fa';
import { IoMdCheckmarkCircle, IoMdCloseCircle, IoMdTime } from 'react-icons/io';

interface User {
  id: number;
  fname: string;
  lname: string;
  email: string;
  role: 'DONOR' | 'ACCEPTOR' | 'ADMIN';
  isVerified: boolean;
  address: string | null;
  createdAt: string;
}

interface Listing {
  id: number;
  userId: number;
  title: string;
  description?: string;
  category: string;
  status: 'ACTIVE' | 'CLAIMED' | 'COMPLETED';
  createdAt: string;
}

interface Request {
  id: number;
  userId: number;
  title: string;
  description?: string;
  category: string;
  status: 'OPEN' | 'FULFILLED' | 'CLOSED';
  createdAt: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch (status) {
    case 'ACTIVE':
    case 'OPEN':
      return (
        <span className={`${base} bg-green-100 text-green-800`}>
          <IoMdCheckmarkCircle className="mr-1" />
          {status}
        </span>
      );
    case 'CLAIMED':
    case 'FULFILLED':
      return (
        <span className={`${base} bg-amber-100 text-amber-800`}>
          <IoMdTime className="mr-1" />
          {status}
        </span>
      );
    case 'COMPLETED':
    case 'CLOSED':
      return (
        <span className={`${base} bg-red-100 text-red-800`}>
          <IoMdCloseCircle className="mr-1" />
          {status}
        </span>
      );
    default:
      return <span className={`${base} bg-gray-100 text-gray-800`}>Unknown</span>;
  }
};

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<{ api?: string; location?: string }>({});
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    let isMounted = true;

    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const [userData, listingsData, requestsData] = await Promise.all([
          getUser(user.id),
          getListings({ userId: user.id, page: 1, limit: 10 }),
          user.role === 'ACCEPTOR' ? getRequests({ userId: user.id, page: 1, limit: 10 }) : Promise.resolve({ data: [] }),
        ]);

        if (isMounted) {
          setProfile(userData);
          setListings(listingsData.data || []);
          setRequests(requestsData.data || []);
          setErrors({ api: '' });
        }
      } catch (err: any) {
        if (isMounted) {
          const errorMessage = err.response?.data?.error || 'Failed to load profile data';
          setErrors({ api: errorMessage });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProfileData();

    return () => {
      isMounted = false;
    };
  }, [user, loading, navigate]);

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!longitude.trim() || !latitude.trim()) {
      setErrors((prev) => ({ ...prev, location: 'Longitude and latitude are required' }));
      return;
    }
    const lon = parseFloat(longitude);
    const lat = parseFloat(latitude);
    if (isNaN(lon) || isNaN(lat)) {
      setErrors((prev) => ({ ...prev, location: 'Invalid longitude or latitude' }));
      return;
    }
    setIsLoading(true);
    try {
      await updateUserLocation({ longitude: lon, latitude: lat });
      const updatedUser = await getUser(user!.id);
      setProfile(updatedUser);
      setIsLocationModalOpen(false);
      setLongitude('');
      setLatitude('');
      setErrors((prev) => ({ ...prev, location: undefined }));
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        location: err.response?.data?.error || 'Failed to update location',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-off-white-tint flex items-center justify-center text-gray-500">
        <Lottie animationData={Empty} loop={true} className="w-48 h-48" />
        <p className="mt-4 text-lg">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-lato">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div>
              <FaUserCircle className="w-32 h-32 text-gray-300" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-800">
                {profile.fname} {profile.lname}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Member Since: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
              </p>
              <div className="mt-2 flex items-center justify-center md:justify-start">
                <FaMapMarkerAlt className="text-primary-orange mr-2" />
                {profile.address ? (
                  <span className="text-gray-600">{profile.address}</span>
                ) : (
                  <button
                    onClick={() => setIsLocationModalOpen(true)}
                    className="text-primary-orange hover:text-secondary-orange font-medium"
                  >
                    Add Location
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
            <FaDonate className="text-primary-orange text-3xl mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500">Donations</p>
              <p className="text-2xl font-semibold text-gray-900">{listings.length}</p>
            </div>
          </div>
          {profile.role === 'ACCEPTOR' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
              <FaHandHoldingHeart className="text-primary-orange text-3xl mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-500">Collections</p>
                <p className="text-2xl font-semibold text-gray-900">{requests.length}</p>
              </div>
            </div>
          )}
        </div>

        {errors.api && <ErrorMessage message={errors.api} />}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Donations</h2>
          {listings.length === 0 ? (
            <div className="bg-white p-8 rounded-xl text-center shadow-sm">
              <p className="text-gray-500">No donations found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="p-5">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">{listing.title}</h3>
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {listing.category.replace('_', ' ')}
                      </span>
                      <StatusBadge status={listing.status} />
                    </div>
                    {listing.description && (
                      <p className="text-gray-600 text-sm mt-3 line-clamp-2">{listing.description}</p>
                    )}
                    <div className="mt-4 text-xs text-gray-500">
                      Posted {new Date(listing.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {profile.role === 'ACCEPTOR' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Collections</h2>
            {requests.length === 0 ? (
              <div className="bg-white p-8 rounded-xl text-center shadow-sm">
                <p className="text-gray-500">No collections found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.map((request) => (
                  <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                    <div className="p-5">
                      <h3 className="font-semibold text-lg text-gray-800 mb-2">{request.title}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {request.category.replace('_', ' ')}
                        </span>
                        <StatusBadge status={request.status} />
                      </div>
                      {request.description && (
                        <p className="text-gray-600 text-sm mt-3 line-clamp-2">{request.description}</p>
                      )}
                      <div className="mt-4 text-xs text-gray-500">
                        Requested {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isLocationModalOpen && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-dark-orange mb-4">Add Location</h3>
              <form onSubmit={handleLocationSubmit} className="space-y-4">
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                    Longitude
                  </label>
                  <input
                    id="longitude"
                    type="text"
                    value={longitude}
                    onChange={(e) => {
                      setLongitude(e.target.value);
                      setErrors((prev) => ({ ...prev, location: undefined }));
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-orange focus:border-primary-orange sm:text-sm"
                    placeholder="Enter longitude (e.g., 30.0619)"
                  />
                </div>
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                    Latitude
                  </label>
                  <input
                    id="latitude"
                    type="text"
                    value={latitude}
                    onChange={(e) => {
                      setLatitude(e.target.value);
                      setErrors((prev) => ({ ...prev, location: undefined }));
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-orange focus:border-primary-orange sm:text-sm"
                    placeholder="Enter latitude (e.g., -1.9441)"
                  />
                </div>
                {errors.location && <ErrorMessage message={errors.location} />}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-dark-orange text-white rounded-lg hover:bg-secondary-orange transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;