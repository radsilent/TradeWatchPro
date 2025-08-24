import React, { useState, useEffect } from 'react';
import { realDataService } from '../services/realDataService';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  status: 'active' | 'inactive';
  lastUsed: string;
  permissions: string[];
}

interface NotificationSettings {
  emailAlerts: boolean;
  smsAlerts: boolean;
  pushNotifications: boolean;
  alertThreshold: 'low' | 'medium' | 'high';
  disruptionTypes: string[];
  vesselAlerts: boolean;
  tariffUpdates: boolean;
  weeklyReports: boolean;
}

interface AccountSettings {
  companyName: string;
  contactEmail: string;
  timezone: string;
  currency: string;
  language: string;
  dataRetention: number;
  autoRefresh: boolean;
  refreshInterval: number;
}

function Settings() {
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'api'>('account');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [apiHealth, setApiHealth] = useState<any>(null);

  // Account settings state
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    companyName: 'Maritime Logistics Corp',
    contactEmail: 'admin@maritime-logistics.com',
    timezone: 'UTC',
    currency: 'USD',
    language: 'English',
    dataRetention: 90,
    autoRefresh: true,
    refreshInterval: 30
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    alertThreshold: 'medium',
    disruptionTypes: ['Weather', 'Security', 'Port Operations'],
    vesselAlerts: true,
    tariffUpdates: true,
    weeklyReports: true
  });

  // API keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'tw_prod_7334566177a1515215529f311fb52613023efb11',
      status: 'active',
      lastUsed: new Date().toISOString(),
      permissions: ['vessels:read', 'disruptions:read', 'tariffs:read']
    },
    {
      id: '2',
      name: 'Development API Key',
      key: 'tw_dev_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
      status: 'active',
      lastUsed: new Date(Date.now() - 86400000).toISOString(),
      permissions: ['vessels:read', 'disruptions:read']
    }
  ]);

  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [showApiKey, setShowApiKey] = useState<string | null>(null);

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const health = await realDataService.getHealthStatus();
      setApiHealth(health);
    } catch (error) {
      console.error('API health check failed:', error);
      setApiHealth({ status: 'unhealthy', error: error.message });
    }
  };

  const saveSettings = async () => {
    setSaveStatus('saving');
    
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would save to backend
      localStorage.setItem('tradewatch_account_settings', JSON.stringify(accountSettings));
      localStorage.setItem('tradewatch_notification_settings', JSON.stringify(notificationSettings));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const generateApiKey = () => {
    if (!newApiKeyName.trim()) return;

    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newApiKeyName,
      key: `tw_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      status: 'active',
      lastUsed: 'Never',
      permissions: ['vessels:read', 'disruptions:read', 'tariffs:read']
    };

    setApiKeys([...apiKeys, newKey]);
    setNewApiKeyName('');
    setShowApiKey(newKey.id);
  };

  const revokeApiKey = (keyId: string) => {
    setApiKeys(apiKeys.map(key => 
      key.id === keyId ? { ...key, status: 'inactive' as const } : key
    ));
  };

  const deleteApiKey = (keyId: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== keyId));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const tabs = [
    { id: 'account', name: 'Account Settings', icon: '👤' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'api', name: 'API Configuration', icon: '🔑' }
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your TradeWatch Pro account and preferences
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={checkApiHealth}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Test API Connection
          </button>
          <button
            onClick={saveSettings}
            disabled={saveStatus === 'saving'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saveStatus === 'saving' ? 'Saving...' : 
             saveStatus === 'saved' ? '✅ Saved' : 
             saveStatus === 'error' ? '❌ Error' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* API Health Status */}
      {apiHealth && (
        <div className={`p-4 rounded-lg border ${
          apiHealth.status === 'healthy' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`text-lg ${apiHealth.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
              {apiHealth.status === 'healthy' ? '✅' : '❌'}
            </span>
            <span className="font-semibold">
              API Status: {apiHealth.status === 'healthy' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {apiHealth.vessel_capacity && (
            <p className="text-sm text-gray-600 mt-1">
              Capacity: {apiHealth.vessel_capacity}, {apiHealth.tariff_capacity}, {apiHealth.port_capacity}
            </p>
          )}
          {apiHealth.error && (
            <p className="text-sm text-red-600 mt-1">Error: {apiHealth.error}</p>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-card rounded-lg border p-6">
        {activeTab === 'account' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Account Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={accountSettings.companyName}
                  onChange={(e) => setAccountSettings({...accountSettings, companyName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={accountSettings.contactEmail}
                  onChange={(e) => setAccountSettings({...accountSettings, contactEmail: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={accountSettings.timezone}
                  onChange={(e) => setAccountSettings({...accountSettings, timezone: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Berlin">Berlin</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Singapore">Singapore</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={accountSettings.currency}
                  onChange={(e) => setAccountSettings({...accountSettings, currency: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CNY">CNY - Chinese Yuan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Retention (days)
                </label>
                <input
                  type="number"
                  min="30"
                  max="365"
                  value={accountSettings.dataRetention}
                  onChange={(e) => setAccountSettings({...accountSettings, dataRetention: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-refresh Interval (seconds)
                </label>
                <select
                  value={accountSettings.refreshInterval}
                  onChange={(e) => setAccountSettings({...accountSettings, refreshInterval: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="15">15 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="120">2 minutes</option>
                  <option value="300">5 minutes</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={accountSettings.autoRefresh}
                onChange={(e) => setAccountSettings({...accountSettings, autoRefresh: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoRefresh" className="ml-2 block text-sm text-gray-900">
                Enable automatic data refresh
              </label>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Notification Preferences</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Alerts</h4>
                  <p className="text-sm text-gray-500">Receive alerts via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailAlerts}
                  onChange={(e) => setNotificationSettings({...notificationSettings, emailAlerts: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">SMS Alerts</h4>
                  <p className="text-sm text-gray-500">Receive critical alerts via SMS</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.smsAlerts}
                  onChange={(e) => setNotificationSettings({...notificationSettings, smsAlerts: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Push Notifications</h4>
                  <p className="text-sm text-gray-500">Browser push notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.pushNotifications}
                  onChange={(e) => setNotificationSettings({...notificationSettings, pushNotifications: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Vessel Impact Alerts</h4>
                  <p className="text-sm text-gray-500">Alerts when vessels are impacted by disruptions</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.vesselAlerts}
                  onChange={(e) => setNotificationSettings({...notificationSettings, vesselAlerts: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Tariff Updates</h4>
                  <p className="text-sm text-gray-500">Notifications for new tariff changes</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.tariffUpdates}
                  onChange={(e) => setNotificationSettings({...notificationSettings, tariffUpdates: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Weekly Reports</h4>
                  <p className="text-sm text-gray-500">Weekly summary reports</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.weeklyReports}
                  onChange={(e) => setNotificationSettings({...notificationSettings, weeklyReports: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Threshold
              </label>
              <select
                value={notificationSettings.alertThreshold}
                onChange={(e) => setNotificationSettings({...notificationSettings, alertThreshold: e.target.value as any})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low - All alerts</option>
                <option value="medium">Medium - Important alerts only</option>
                <option value="high">High - Critical alerts only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disruption Types to Monitor
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Weather', 'Security', 'Port Operations', 'Vessel Incident', 'Infrastructure', 'Labor Dispute'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notificationSettings.disruptionTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNotificationSettings({
                            ...notificationSettings,
                            disruptionTypes: [...notificationSettings.disruptionTypes, type]
                          });
                        } else {
                          setNotificationSettings({
                            ...notificationSettings,
                            disruptionTypes: notificationSettings.disruptionTypes.filter(t => t !== type)
                          });
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">API Configuration</h3>
            
            {/* API Keys List */}
            <div className="space-y-4">
              <h4 className="font-medium">API Keys</h4>
              
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h5 className="font-medium">{apiKey.name}</h5>
                      <p className="text-sm text-gray-500">
                        Last used: {apiKey.lastUsed === 'Never' ? 'Never' : new Date(apiKey.lastUsed).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        apiKey.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {apiKey.status}
                      </span>
                      <button
                        onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {showApiKey === apiKey.id ? 'Hide' : 'Show'}
                      </button>
                      {apiKey.status === 'active' && (
                        <button
                          onClick={() => revokeApiKey(apiKey.id)}
                          className="text-orange-600 hover:text-orange-800 text-sm"
                        >
                          Revoke
                        </button>
                      )}
                      <button
                        onClick={() => deleteApiKey(apiKey.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {showApiKey === apiKey.id && (
                    <div className="bg-gray-50 rounded p-3 mt-3">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono">{apiKey.key}</code>
                        <button
                          onClick={() => copyToClipboard(apiKey.key)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Permissions:</p>
                    <div className="flex gap-1 mt-1">
                      {apiKey.permissions.map(permission => (
                        <span key={permission} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Generate New API Key */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">Generate New API Key</h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="API Key Name"
                  value={newApiKeyName}
                  onChange={(e) => setNewApiKeyName(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={generateApiKey}
                  disabled={!newApiKeyName.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Generate
                </button>
              </div>
            </div>

            {/* API Documentation */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">API Endpoints</h4>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded p-3">
                  <code className="text-sm">GET /api/vessels?limit=1000</code>
                  <p className="text-sm text-gray-600 mt-1">Fetch real-time vessel data with AIS positions</p>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <code className="text-sm">GET /api/maritime-disruptions</code>
                  <p className="text-sm text-gray-600 mt-1">Get current maritime disruptions and alerts</p>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <code className="text-sm">GET /api/tariffs?limit=100</code>
                  <p className="text-sm text-gray-600 mt-1">Retrieve trade tariff data from government sources</p>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <code className="text-sm">GET /api/ports?limit=50</code>
                  <p className="text-sm text-gray-600 mt-1">Get major port information and statistics</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;