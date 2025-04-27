import { useEffect, useState } from 'react';
import { Save, Settings as SettingsIcon, Mail, Clock, X, RefreshCw, Download, CalendarCheck, FileText, Calendar, Info } from 'lucide-react';
import axios from 'axios';
import { testEmailScheduler, getAvailableReports, downloadReport as downloadSavedReport } from '@/lib/actions';

interface SettingsProps {
  onClose: () => void;
  visible: boolean;
}

export default function Settings({ onClose, visible }: SettingsProps) {
  const [email, setEmail] = useState<string>('');
  const [reportFrequency, setReportFrequency] = useState<string>('daily');
  const [reportTime, setReportTime] = useState<string>('18:00');
  const [samplesPerModule, setSamplesPerModule] = useState<number>(2);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);
  const [reportGenerated, setReportGenerated] = useState<boolean>(false);
  const [reportContent, setReportContent] = useState<string>('');
  const [reportFilename, setReportFilename] = useState<string>('');
  const [savedReports, setSavedReports] = useState<Array<{filename: string, date: Date, size: number}>>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'reports'>('settings');
  
  useEffect(() => {
    if (visible) {
      loadSettings();
      loadSavedReports();
    }
  }, [visible]);

  const loadSavedReports = async () => {
    try {
      setLoadingReports(true);
      const reports = await getAvailableReports();
      setSavedReports(reports.map(report => ({
        ...report,
        date: new Date(report.date)
      })));
    } catch (error) {
      console.error('Error loading saved reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };
  
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to get from localStorage
      const savedSettings = localStorage.getItem('emailSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setEmail(settings.email || '');
        setReportFrequency(settings.reportFrequency || 'daily');
        setReportTime(settings.reportTime || '18:00');
        setSamplesPerModule(settings.samplesPerModule || 2);
      }
      
      // Then try to get from backend
      try {
        const response = await axios.get('http://localhost:3001/api/v1/email/settings');
        if (response.data && response.data.success) {
          const settings = response.data.settings;
          setEmail(settings.email || '');
          setReportFrequency(settings.reportFrequency || 'daily');
          setReportTime(settings.reportTime || '18:00');
          setSamplesPerModule(settings.samplesPerModule || 2);
          
          // Update localStorage as well
          localStorage.setItem('emailSettings', JSON.stringify(settings));
        }
      } catch (err) {
        console.log('No settings found on server, using local settings');
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings from server');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate email
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }
      
      const settings = {
        email,
        reportFrequency,
        reportTime,
        samplesPerModule
      };
      
      // Save to localStorage
      localStorage.setItem('emailSettings', JSON.stringify(settings));
      
      // Call API to save settings
      try {
        const response = await axios.post('http://localhost:3001/api/v1/email/settings', settings);
        
        if (!response.data || !response.data.success) {
          throw new Error(response.data?.message || 'Failed to save settings');
        }
        
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err: any) {
        console.error('Error saving settings to server:', err);
        // We still show success since it saved locally
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };
  
  const generateTestReport = async () => {
    try {
      setGeneratingReport(true);
      setReportGenerated(false);
      setError(null);
      
      const response = await axios.post('http://localhost:3001/api/v1/email/generate-report', {
        samplesPerModule,
        testOnly: true,
        reportFrequency
      });
      
      if (response.data && response.data.report) {
        setReportContent(response.data.report);
        setReportGenerated(true);
        
        if (response.data.reportFilename) {
          setReportFilename(response.data.reportFilename);
        }
        
        if (!response.data.success) {
          setError(response.data.message || 'Warning: Report generated with issues');
        }
        
        // Refresh saved reports list
        loadSavedReports();
      } else {
        throw new Error(response.data?.message || 'Failed to generate report - no content returned');
      }
    } catch (err: any) {
      console.error('Error generating report:', err);
      setReportGenerated(false);
      
      // Extract error details
      const errorMessage = err.response?.data?.message || err.message || 'Failed to generate report';
      const errorDetails = err.response?.data?.error || '';
      setError(`Error: ${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`);
      
      // Try to extract any partial report content
      if (err.response?.data?.report) {
        setReportContent(err.response.data.report);
        setReportGenerated(true);
      }
    } finally {
      setGeneratingReport(false);
    }
  };
  
  const downloadReport = () => {
    if (reportFilename) {
      downloadSavedReport(reportFilename);
    } else if (reportContent) {
      const blob = new Blob([reportContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-log-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadSavedReport = async (filename: string) => {
    try {
      await downloadSavedReport(filename);
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Failed to download the report. Please try again.');
    }
  };
  
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-gray-800 rounded-lg w-full max-w-lg p-6 shadow-xl m-4 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <SettingsIcon size={20} className="text-blue-400" />
            <span>Email Report Settings</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors absolute top-4 right-4"
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-md text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4 border-b border-gray-700">
          <div className="flex">
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('settings')}
            >
              <span className="flex items-center gap-2">
                <SettingsIcon size={16} />
                Settings
              </span>
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('reports')}
            >
              <span className="flex items-center gap-2">
                <FileText size={16} />
                Saved Reports
              </span>
            </button>
          </div>
        </div>
        
        {activeTab === 'settings' && (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-600 bg-gray-700 text-gray-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 rounded-r-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Consolidated reports will be sent to this email
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Report Frequency
                </label>
                <select
                  value={reportFrequency}
                  onChange={(e) => setReportFrequency(e.target.value)}
                  className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="hourly">Hourly (Critical Issues Only)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Report Time
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-600 bg-gray-700 text-gray-400">
                    <Clock size={16} />
                  </span>
                  <input
                    type="time"
                    value={reportTime}
                    onChange={(e) => setReportTime(e.target.value)}
                    className="flex-1 rounded-r-md border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  When to send the report (in your local timezone)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Samples per Module
                </label>
                <select
                  value={samplesPerModule}
                  onChange={(e) => setSamplesPerModule(parseInt(e.target.value))}
                  className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 sample per module</option>
                  <option value={2}>2 samples per module</option>
                  <option value={3}>3 samples per module</option>
                  <option value={5}>5 samples per module</option>
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Number of example logs to include from each module
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3 justify-between">
              <div className="flex gap-2">
                <button
                  onClick={generateTestReport}
                  disabled={generatingReport}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingReport ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  <span>Generate Test Report</span>
                </button>
                
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const result = await testEmailScheduler();
                      if (result.success) {
                        setShowSuccess(true);
                        setTimeout(() => setShowSuccess(false), 3000);
                        // Refresh saved reports after test
                        loadSavedReports();
                      } else {
                        setError(result.message);
                        setTimeout(() => setError(null), 5000);
                      }
                    } catch (err) {
                      setError("Failed to test scheduler");
                      setTimeout(() => setError(null), 5000);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Test sending scheduled email now"
                >
                  <CalendarCheck size={16} />
                  <span>Test Scheduler</span>
                </button>
              </div>
              
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>Save Settings</span>
              </button>
            </div>
            
            {reportGenerated && (
              <div className="mt-4">
                <div className="p-3 bg-green-900/30 border border-green-500/30 rounded-md">
                  <div className="flex justify-between items-center">
                    <p className="text-green-400 text-sm">
                      Test report generated successfully!
                    </p>
                    <button
                      onClick={downloadReport}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                    >
                      <Download size={14} />
                      <span className="text-xs">Download</span>
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 border border-gray-700 rounded-md overflow-hidden">
                  <div className="bg-gray-700 p-2 flex justify-between items-center">
                    <span className="text-sm font-medium text-white">Report Preview</span>
                    <span className="text-xs text-gray-400">Scroll to view full content</span>
                  </div>
                  <div 
                    className="bg-white p-4 h-64 overflow-auto" 
                    dangerouslySetInnerHTML={{ __html: reportContent }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'reports' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg text-white font-medium">Saved Reports</h3>
              <button 
                onClick={loadSavedReports}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <RefreshCw size={14} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingReports ? (
              <div className="flex justify-center py-8">
                <RefreshCw size={24} className="animate-spin text-blue-400" />
              </div>
            ) : savedReports.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p>No saved reports found</p>
                <p className="text-sm mt-1">Generate a report to see it here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {savedReports.map((report) => (
                  <div key={report.filename} className="p-3 bg-gray-700 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-medium text-white text-sm">{report.filename}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {report.date.toLocaleDateString()} {report.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <span className="flex items-center gap-1">
                          <Info size={12} />
                          {Math.round(report.size / 1024)} KB
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadSavedReport(report.filename)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded"
                      title="Download Report"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {showSuccess && (
          <div className="mt-4 p-3 bg-green-900/30 border border-green-500/30 rounded-md text-green-400 text-sm">
            Settings saved successfully!
          </div>
        )}
        
        <div className="mt-6 text-xs text-gray-400 border-t border-gray-700 pt-4">
          <p>
            Note: These settings control how often you receive email reports about system errors.
            The report will include a summary of all errors and detailed analysis of the most critical issues.
          </p>
        </div>
      </div>
    </div>
  );
} 