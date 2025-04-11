import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Calendar as CalendarIcon, Users, LogOut, User, Edit2, Send, X, RefreshCw, Sun, Moon, Coffee, Search, ChevronLeft, ChevronRight, ArrowUpDown as ArrowsUpDown } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { useShiftStore } from '../stores/shiftStore';
import { useTeamStore } from '../stores/teamStore';
import { format, isToday, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '../lib/supabase';
import { ChangePasswordModal } from './ChangePasswordModal';

type Colleague = {
  id: string;
  name: string;
  avatar_url: string | null;
  role: 'nurse' | 'doctor' | 'assistant' | 'headNurse';
  shift: 'day' | 'night' | 'off';
  hospital_id: string;
};

type Shift = {
  id: string;
  user_id: string;
  date: string;
  type: 'day' | 'night' | 'off';
};

const getRoleLabel = (role: string, t: any) => {
  return t(`roles.${role}`);
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'doctor': return 'text-blue-600';
    case 'nurse': return 'text-green-600';
    case 'assistant': return 'text-orange-600';
    case 'headNurse': return 'text-purple-600';
    default: return 'text-gray-600';
  }
};

const getRoleBgColor = (role: string) => {
  switch (role) {
    case 'doctor': return 'bg-blue-50';
    case 'nurse': return 'bg-green-50';
    case 'assistant': return 'bg-orange-50';
    case 'headNurse': return 'bg-purple-50';
    default: return 'bg-gray-50';
  }
};

const ComparisonPopup = ({ 
  isOpen, 
  onClose, 
  compareRole, 
  setCompareRole, 
  compareUser, 
  setCompareUser,
  filteredMembers,
  t 
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-sm font-medium text-gray-900">{t('common.compare')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.role')}
            </label>
            <select
              value={compareRole}
              onChange={(e) => {
                setCompareRole(e.target.value);
                setCompareUser('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">{t('common.selectRole')}</option>
              <option value="nurse">{t('roles.nurse')}</option>
              <option value="doctor">{t('roles.doctor')}</option>
              <option value="assistant">{t('roles.assistant')}</option>
              <option value="headNurse">{t('roles.headNurse')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.user')}
            </label>
            <select
              value={compareUser}
              onChange={(e) => setCompareUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={!compareRole || filteredMembers.length === 0}
            >
              <option value="">{t('common.selectUser')}</option>
              {filteredMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShiftModal = ({ shift, onClose, onExchangeRequest }) => {
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [shiftColleagues, setShiftColleagues] = useState<Colleague[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'exchange' | 'shift'>('exchange');
  const { profile } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    const loadColleagues = async () => {
      if (!shift?.type || !profile?.id || !profile?.hospital_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: exchangeColleagues, error: exchangeError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, role, shift, hospital_id')
          .eq('hospital_id', profile.hospital_id)
          .neq('id', profile.id)
          .neq('shift', shift.type);

        if (exchangeError) throw exchangeError;
        setColleagues(exchangeColleagues || []);

        const { data: sameShiftColleagues, error: shiftError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, role, shift, hospital_id')
          .eq('hospital_id', profile.hospital_id)
          .neq('id', profile.id)
          .eq('shift', shift.type);

        if (shiftError) throw shiftError;
        setShiftColleagues(sameShiftColleagues || []);

      } catch (error) {
        console.error('Error loading colleagues:', error);
        setError(error instanceof Error ? error.message : 'Failed to load colleagues');
        setColleagues([]);
        setShiftColleagues([]);
      } finally {
        setLoading(false);
      }
    };

    loadColleagues();
  }, [shift?.type, profile?.id, profile?.hospital_id]);

  if (!shift) return null;

  const renderColleaguesList = (colleaguesList: Colleague[]) => (
    <div className="space-y-3">
      {colleaguesList.map(colleague => (
        <div key={colleague.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
          <div className="flex items-center space-x-3">
            <img
              src={colleague.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(colleague.name)}&background=random`}
              alt={colleague.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">
                {colleague.name}
                <span className={`ml-2 text-xs font-medium ${getRoleColor(colleague.role)}`}>
                  ({getRoleLabel(colleague.role, t)})
                </span>
              </span>
              <p className="text-xs text-gray-500">
                {t(`shifts.${colleague.shift}`)}
              </p>
            </div>
          </div>
          {view === 'exchange' && (
            <button
              onClick={() => onExchangeRequest(colleague.id)}
              className="p-2 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {format(new Date(shift.date), 'MMMM d, yyyy')}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t(`shifts.${shift.type}`)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setView('exchange')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                view === 'exchange'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('modal.availableColleagues')}
            </button>
            <button
              onClick={() => setView('shift')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                view === 'shift'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('modal.shiftColleagues')}
            </button>
          </div>
        </div>

        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            {view === 'exchange' 
              ? t('modal.availableColleagues')
              : t('modal.shiftColleagues')
            }
          </h4>
          {error ? (
            <div className="text-center text-red-600 py-4">{error}</div>
          ) : loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : view === 'exchange' ? (
            colleagues.length > 0 ? (
              renderColleaguesList(colleagues)
            ) : (
              <p className="text-center text-gray-500 py-4">{t('modal.noColleagues')}</p>
            )
          ) : (
            shiftColleagues.length > 0 ? (
              renderColleaguesList(shiftColleagues)
            ) : (
              <p className="text-center text-gray-500 py-4">{t('modal.noShiftColleagues')}</p>
            )
          )}
        </div>
      </div>
    </div>
  );
};

const MainLayout = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, signOut } = useAuthStore();
  const { rooms, messages, currentRoom, loadRooms, loadMessages, sendMessage, setCurrentRoom } = useChatStore();
  const { shifts, loading: shiftsLoading, error: shiftsError, loadShifts, updateShift, requestExchange } = useShiftStore();
  const { members, loadMembers } = useTeamStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedShiftType, setSelectedShiftType] = useState<'day' | 'night' | 'off'>('day');
  const [isCalendarEditMode, setIsCalendarEditMode] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [compareRole, setCompareRole] = useState<string>('');
  const [compareUser, setCompareUser] = useState<string>('');
  const [filteredMembers, setFilteredMembers] = useState<Colleague[]>([]);
  const [comparisonShifts, setComparisonShifts] = useState<Shift[]>([]);
  const [isComparisonPopupOpen, setIsComparisonPopupOpen] = useState(false);

  useEffect(() => {
    if (!profile) {
      navigate('/login');
      return;
    }

    loadRooms();
    loadMembers();
    loadShifts(currentDate);
  }, [loadRooms, loadShifts, loadMembers, profile, navigate, currentDate]);

  useEffect(() => {
    if (currentRoom) {
      loadMessages(currentRoom.id);
    }
  }, [currentRoom, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (compareRole && profile?.hospital_id) {
      const filtered = members.filter(member => 
        member.role === compareRole && 
        member.hospital_id === profile.hospital_id &&
        member.id !== profile.id
      );
      setFilteredMembers(filtered);
      setCompareUser(''); // Reset selected user when role changes
    } else {
      setFilteredMembers([]);
      setCompareUser('');
    }
  }, [compareRole, members, profile?.hospital_id, profile?.id]);

  useEffect(() => {
    const loadComparisonShifts = async () => {
      if (!compareUser) {
        setComparisonShifts([]);
        return;
      }

      try {
        const startDateStr = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        const endDateStr = format(endOfMonth(currentDate), 'yyyy-MM-dd');

        const { data, error } = await supabase
          .from('shifts')
          .select('*')
          .eq('user_id', compareUser)
          .gte('date', startDateStr)
          .lte('date', endDateStr)
          .order('date', { ascending: true });

        if (error) throw error;
        setComparisonShifts(data || []);
      } catch (error) {
        console.error('Error loading comparison shifts:', error);
        setComparisonShifts([]);
      }
    };

    loadComparisonShifts();
  }, [compareUser, currentDate]);

  const handleProfileClick = () => {
    navigate('/profile/me');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || !newMessage.trim()) return;

    try {
      await sendMessage(newMessage.trim(), currentRoom.id);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleShiftClick = async (shift) => {
    if (isCalendarEditMode) {
      try {
        await updateShift(shift.id, selectedShiftType);
      } catch (error) {
        console.error('Error updating shift:', error);
      }
    } else {
      setSelectedShift(shift);
    }
  };

  const handleExchangeRequest = async (requestedUserId: string) => {
    if (!selectedShift?.id) return;
    
    try {
      await requestExchange(selectedShift.id, requestedUserId);
      setSelectedShift(null);
    } catch (error) {
      console.error('Error requesting exchange:', error);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  const getShiftIcon = (type: string) => {
    switch (type) {
      case 'day': return <Sun className="w-4 h-4 text-yellow-600" />;
      case 'night': return <Moon className="w-4 h-4 text-purple-600" />;
      case 'off': return <Coffee className="w-4 h-4 text-green-600" />;
      default: return null;
    }
  };

  const getShiftColor = (type: string) => {
    switch (type) {
      case 'day': return 'bg-yellow-100 hover:bg-yellow-200';
      case 'night': return 'bg-purple-100 hover:bg-purple-200';
      case 'off': return 'bg-green-100 hover:bg-green-200';
      default: return 'bg-gray-100 hover:bg-gray-200';
    }
  };

  const renderChat = () => (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-white z-10 pb-4">
        <div className="flex space-x-2 overflow-x-auto">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setCurrentRoom(room)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                ${currentRoom?.id === room.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {t(`chatRooms.${room.type}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.user_id === profile?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] ${message.user_id === profile?.id ? 'flex-row-reverse' : 'flex-row'}`}>
              <button 
                onClick={() => navigate(`/profile/${message.user_id}`)}
                className="flex-shrink-0"
              >
                <img
                  src={message.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.user?.name || 'User')}&background=random`}
                  alt={message.user?.name || 'User'}
                  className={`w-8 h-8 rounded-full object-cover ${message.user_id === profile?.id ? 'ml-2' : 'mr-2'}`}
                />
              </button>

              <div className={`flex flex-col ${message.user_id === profile?.id ? 'items-end mr-2' : 'items-start ml-2'}`}>
                <div className="flex items-center space-x-2 mb-1">
                  <button
                    onClick={() => navigate(`/profile/${message.user_id}`)}
                    className={`text-sm font-medium hover:underline ${
                      message.user_id === profile?.id ? 'text-blue-600' : 'text-gray-900'
                    }`}
                  >
                    {message.user_id === profile?.id ? t('chat.you') : message.user?.name || 'User'}
                  </button>
                  <span className="text-xs text-gray-400">
                    {format(new Date(message.created_at), 'HH:mm')}
                  </span>
                </div>
                
                <div className={`p-3 rounded-lg ${
                  message.user_id === profile?.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 bg-white border-t shadow-lg">
        <form onSubmit={handleSendMessage} className="flex space-x-2 p-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('chat.typeMessage')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );

  const renderCalendar = () => {
    if (shiftsLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (shiftsError) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error loading shifts: {shiftsError}</div>
        </div>
      );
    }

    // Get all dates in the current month
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    const dates = [];
    let currentDateIter = startDate;
    while (currentDateIter <= endDate) {
      dates.push(format(currentDateIter, 'yyyy-MM-dd'));
      currentDateIter = new Date(currentDateIter.setDate(currentDateIter.getDate() + 1));
    }

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePreviousMonth}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsComparisonPopupOpen(!isComparisonPopupOpen)}
              className={`p-2 rounded-full ${
                compareUser ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={t('common.compare')}
            >
              <ArrowsUpDown className="w-5 h-5" />
            </button>

            <ComparisonPopup
              isOpen={isComparisonPopupOpen}
              onClose={() => setIsComparisonPopupOpen(false)}
              compareRole={compareRole}
              setCompareRole={setCompareRole}
              compareUser={compareUser}
              setCompareUser={setCompareUser}
              filteredMembers={filteredMembers}
              t={t}
            />
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {t('calendar.weekDays', { returnObjects: true }).map((day) => (
              <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}

            {dates.map((date) => {
              const dayDate = new Date(date);
              const dayOfWeek = dayDate.getDay() || 7;
              const dayOfMonth = dayDate.getDate();
              const isCurrentDay = isToday(dayDate);

              const userShift = shifts.find(s => 
                s.user_id === profile?.id && 
                s.date === date
              );

              const comparisonShift = comparisonShifts.find(s => s.date === date);

              return (
                <div
                  key={date}
                  onClick={() => userShift && handleShiftClick(userShift)}
                  style={{ gridColumn: dayOfWeek === 1 ? 1 : undefined }}
                  className={`
                    relative p-3 cursor-pointer transition-colors
                    ${userShift ? getShiftColor(userShift.type) : 'bg-gray-50'}
                    ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                  `}
                >
                  <time
                    dateTime={date}
                    className={`text-sm font-semibold ${isCurrentDay ? 'text-blue-700' : 'text-gray-900'}`}
                  >
                    {dayOfMonth}
                  </time>
                  
                  {userShift && (
                    <div className="mt-1 flex items-center space-x-1">
                      {getShiftIcon(userShift.type)}
                      <span className="text-xs text-gray-700">
                        {t(`shifts.${userShift.type}Short`)}
                      </span>
                    </div>
                  )}

                  {comparisonShift && (
                    <div
                      className="absolute inset-0 bg-white opacity-50"
                      style={{
                        clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                      }}
                    >
                      <div className="absolute bottom-0 right-0 p-1">
                        {getShiftIcon(comparisonShift.type)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-4">
              {isCalendarEditMode ? (
                ['day', 'night', 'off'].map((type) => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="shiftType"
                      value={type}
                      checked={selectedShiftType === type}
                      onChange={(e) => setSelectedShiftType(e.target.value as 'day' | 'night' | 'off')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded flex items-center justify-center ${
                        type === 'day' ? 'bg-yellow-100' :
                        type === 'night' ? 'bg-purple-100' : 'bg-green-100'
                      }`}>
                        {getShiftIcon(type)}
                      </div>
                      <span className="text-sm text-gray-600">
                        {t(`calendar.legend.${type}Shift`)}
                      </span>
                    </div>
                  </label>
                ))
              ) : (
                <>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded bg-yellow-100 mr-2 flex items-center justify-center">
                      <Sun className="w-3 h-3 text-yellow-600" />
                    </div>
                    <span className="text-sm text-gray-600">{t('calendar.legend.dayShift')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded bg-purple-100 mr-2 flex items-center justify-center">
                      <Moon className="w-3 h-3 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-600">{t('calendar.legend.nightShift')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded bg-green-100 mr-2 flex items-center justify-center">
                      <Coffee className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">{t('calendar.legend.dayOff')}</span>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setIsCalendarEditMode(!isCalendarEditMode)}
              className={`p-2 rounded-full ${
                isCalendarEditMode ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTeam = () => {
    const filteredMembers = members.filter(member => {
      return member.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const groupedMembers = filteredMembers.reduce((acc, member) => {
      const role = member.role;
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(member);
      return acc;
    }, {} as Record<string, typeof members>);

    const roles = {
      doctor: t('groups.doctors'),
      nurse: t('groups.nurses'),
      headNurse: t('groups.headNurses'),
      assistant: t('groups.assistants')
    };

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        <div className="p-4 space-y-6">
          {Object.entries(roles).map(([roleKey, roleLabel]) => {
            const roleMembers = groupedMembers[roleKey] || [];
            if (roleMembers.length === 0) return null;

            return (
              <div key={roleKey} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">{roleLabel}</h3>
                  <span className="text-xs text-gray-500">
                    {roleMembers.length} {t('common.members')}
                  </span>
                </div>

                <div className="space-y-2">
                  {roleMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {member.name}
                          </span>
                          <p className="text-xs text-gray-500">
                            {t(`shifts.${member.shift}`)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/profile/${member.id}`)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      >
                        <User className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="https://lphvctwbxtpmpoqcrcmo.supabase.co/storage/v1/object/public/MedOk_logos/logo.jpg" 
                alt="MedOK Logo"
                className="w-10 h-10 object-cover rounded-lg"
              />
              <h1 className="text-xl font-semibold text-gray-900">MedOK</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                title={t('common.signOut')}
              >
                <LogOut className="w-5 h-5" />
              </button>
              <LanguageSwitcher />
              <button
                onClick={handleProfileClick}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-around">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex flex-col items-center py-3 px-6 text-sm font-medium ${
                activeTab === 'chat'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="mt-1">{t('common.chat')}</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex flex-col items-center py-3 px-6 text-sm font-medium ${
                activeTab === 'calendar'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarIcon className="w-5 h-5" />
              <span className="mt-1">{t('common.calendar')}</span>
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex flex-col items-center py-3 px-6 text-sm font-medium ${
                activeTab === 'team'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="mt-1">{t('common.team')}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'chat' && renderChat()}
          {activeTab === 'calendar' && renderCalendar()}
          {activeTab === 'team' && renderTeam()}
        </div>
      </main>

      {selectedShift && (
        <ShiftModal
          shift={selectedShift}
          onClose={() => setSelectedShift(null)}
          onExchangeRequest={handleExchangeRequest}
        />
      )}

      {showPasswordModal && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
};

export { MainLayout };