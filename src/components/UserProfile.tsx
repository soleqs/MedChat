import React, { useState, useEffect } from 'react';
import { Phone, Edit2, ArrowLeft, X, Upload } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function UserProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { profile: currentUserProfile, loadUser } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    avatar: '',
    social_links: {
      whatsapp: '',
      telegram: '',
      facebook: '',
      instagram: ''
    }
  });

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId || currentUserProfile?.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setEditForm({
        name: data.name,
        phone: data.phone || '',
        avatar: data.avatar_url || '',
        social_links: {
          whatsapp: (data.social_links as any)?.whatsapp || '',
          telegram: (data.social_links as any)?.telegram || '',
          facebook: (data.social_links as any)?.facebook || '',
          instagram: (data.social_links as any)?.instagram || ''
        }
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile');
    }
  };
  
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isOwnProfile = currentUserProfile?.id === profile.id;

  const socialLinks = [
    { name: 'WhatsApp', icon: 'https://cdn2.iconfinder.com/data/icons/social-messaging-ui-color-shapes-2-free/128/social-whatsapp-circle-512.png', link: profile.social_links?.whatsapp || '#', key: 'whatsapp' },
    { name: 'Telegram', icon: 'https://cdn3.iconfinder.com/data/icons/social-media-chamfered-corner/154/telegram-512.png', link: profile.social_links?.telegram || '#', key: 'telegram' },
    { name: 'Facebook', icon: 'https://cdn2.iconfinder.com/data/icons/social-media-2285/512/1_Facebook_colored_svg_copy-512.png', link: profile.social_links?.facebook || '#', key: 'facebook' },
    { name: 'Instagram', icon: 'https://cdn2.iconfinder.com/data/icons/social-media-2285/512/1_Instagram_colored_svg_1-512.png', link: profile.social_links?.instagram || '#', key: 'instagram' },
  ];

  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    try {
      setError(null);
      setIsSubmitting(true);
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPG, PNG, and GIF are allowed');
      }

      const fileExt = file.type.split('/')[1];
      const fileName = `${profile.id}_${Date.now()}.${fileExt}`;

      if (profile.avatar_url) {
        const oldFileName = profile.avatar_url.split('/').pop();
        if (oldFileName) {
          try {
            await supabase.storage
              .from('avatars')
              .remove([oldFileName]);
          } catch (error) {
            console.warn('Failed to remove old avatar:', error);
          }
        }
      }

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      if (!data?.path) {
        throw new Error('Failed to get uploaded file path');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) {
        throw new Error(`Profile update failed: ${updateError.message}`);
      }

      setEditForm(prev => ({
        ...prev,
        avatar: publicUrl
      }));

      await loadProfile();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          phone: editForm.phone,
          avatar_url: editForm.avatar,
          social_links: editForm.social_links
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await loadProfile();
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEditModal = () => {
    if (!showEditModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:w-[600px] md:rounded-lg overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Edit Profile</h2>
            <button 
              onClick={() => setShowEditModal(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}

            <div className="flex flex-col items-center">
              <div className="relative">
                <img
                  src={editForm.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`}
                  alt=""
                  className="w-32 h-32 rounded-full object-cover"
                />
                <label 
                  htmlFor="avatar-upload"
                  className={`absolute bottom-0 right-0 p-2 rounded-full cursor-pointer transition-colors ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-white" />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">Click the upload icon to change photo</p>
              <p className="text-xs text-gray-400">Maximum file size: 5MB</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="+1 (234) 567-890"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Social Media Links
              </label>
              {socialLinks.map(({ name, key }) => (
                <div key={key}>
                  <label className="block text-sm text-gray-600 mb-1">
                    {name}
                  </label>
                  <input
                    type="url"
                    value={editForm.social_links[key]}
                    onChange={e => setEditForm(prev => ({
                      ...prev,
                      social_links: {
                        ...prev.social_links,
                        [key]: e.target.value
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={`Enter your ${name} profile URL`}
                  />
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-white py-4 border-t">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto bg-white shadow-lg rounded-lg overflow-hidden mt-8">
        <div className="p-8">
          {isOwnProfile && (
            <div className="flex justify-end mb-6">
              <button 
                onClick={() => setShowEditModal(true)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="flex flex-col items-center">
            <img
              src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`}
              alt={profile.name}
              className="w-32 h-32 rounded-full object-cover mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-900">{profile.name}</h3>
            <p className="text-gray-600 mb-2">
              {profile.role === 'nurse' ? 'Мед.сестра' :
               profile.role === 'doctor' ? 'Доктор' :
               profile.role === 'assistant' ? 'Санитар' :
               profile.role === 'headNurse' ? 'Старшая мед.сестра' : profile.role}
            </p>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {profile.shift === 'day' ? 'Дневная смена' :
               profile.shift === 'night' ? 'Ночная смена' : 'Выходной'}
            </span>
          </div>

          <div className="mt-8">
            <div className="flex items-center mb-6">
              <Phone className="w-5 h-5 text-gray-500 mr-3" />
              {profile.phone ? (
                <a 
                  href={`tel:${formatPhoneNumber(profile.phone)}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {profile.phone}
                </a>
              ) : (
                <span className="text-gray-500">No phone number</span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <img src={social.icon} alt={social.name} className="w-8 h-8 mb-2" />
                  <span className="text-sm text-gray-600">{social.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {renderEditModal()}
    </div>
  );
}