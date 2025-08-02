"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Clock, 
  Mail, 
  Calendar,
  Plus,
  Trash2,
  Edit,
  FileText,
  BarChart3,
  PieChart,
  TrendingUp
} from 'lucide-react';

interface ScheduledReport {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  recipients: string[];
  template: 'summary' | 'detailed' | 'executive';
  format: 'pdf' | 'csv' | 'json';
  enabled: boolean;
  lastSent?: string;
  nextSend: string;
}

interface ScheduledReportModalProps {
  className?: string;
}

export function ScheduledReportModal({ className }: ScheduledReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [_editingReport, setEditingReport] = useState<string | null>(null);
  
  const [reports, setReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Daily Operations Summary',
      frequency: 'daily',
      time: '09:00',
      recipients: ['ops@company.com'],
      template: 'summary',
      format: 'pdf',
      enabled: true,
      lastSent: '2024-01-31',
      nextSend: '2024-02-01 09:00'
    },
    {
      id: '2',
      name: 'Weekly Executive Report',
      frequency: 'weekly',
      time: '08:00',
      recipients: ['cto@company.com', 'ceo@company.com'],
      template: 'executive',
      format: 'pdf',
      enabled: true,
      lastSent: '2024-01-29',
      nextSend: '2024-02-05 08:00'
    },
    {
      id: '3',
      name: 'Monthly Cost Analysis',
      frequency: 'monthly',
      time: '10:00',
      recipients: ['finance@company.com'],
      template: 'detailed',
      format: 'csv',
      enabled: false,
      nextSend: '2024-03-01 10:00'
    }
  ]);

  const [newReport, setNewReport] = useState({
    name: '',
    frequency: 'weekly' as const,
    time: '09:00',
    recipients: [''],
    template: 'summary' as const,
    format: 'pdf' as const
  });

  const frequencies = [
    { value: 'daily', label: 'Daily', icon: Calendar },
    { value: 'weekly', label: 'Weekly', icon: Calendar },
    { value: 'monthly', label: 'Monthly', icon: Calendar }
  ];

  const templates = [
    { 
      value: 'summary', 
      label: 'Summary Report',
      description: 'Key metrics and trends overview',
      icon: BarChart3 
    },
    { 
      value: 'detailed', 
      label: 'Detailed Analysis',
      description: 'Comprehensive data breakdown',
      icon: TrendingUp 
    },
    { 
      value: 'executive', 
      label: 'Executive Dashboard',
      description: 'High-level insights and KPIs',
      icon: PieChart 
    }
  ];

  const formats = [
    { value: 'pdf', label: 'PDF', description: 'Visual report with charts' },
    { value: 'csv', label: 'CSV', description: 'Data tables for analysis' },
    { value: 'json', label: 'JSON', description: 'Raw data format' }
  ];

  const toggleReport = (reportId: string) => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, enabled: !report.enabled }
        : report
    ));
  };

  const deleteReport = (reportId: string) => {
    setReports(prev => prev.filter(report => report.id !== reportId));
  };

  const addRecipient = () => {
    setNewReport(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  const updateRecipient = (index: number, email: string) => {
    setNewReport(prev => ({
      ...prev,
      recipients: prev.recipients.map((recipient, i) => 
        i === index ? email : recipient
      )
    }));
  };

  const removeRecipient = (index: number) => {
    setNewReport(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const createReport = () => {
    const report: ScheduledReport = {
      id: Date.now().toString(),
      ...newReport,
      recipients: newReport.recipients.filter(email => email.trim() !== ''),
      enabled: true,
      nextSend: calculateNextSend(newReport.frequency, newReport.time)
    };

    setReports(prev => [...prev, report]);
    setNewReport({
      name: '',
      frequency: 'weekly',
      time: '09:00',
      recipients: [''],
      template: 'summary',
      format: 'pdf'
    });
    setIsCreating(false);
  };

  const calculateNextSend = (frequency: string, time: string) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);
    
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    switch (frequency) {
      case 'weekly':
        const daysUntilMonday = (8 - next.getDay()) % 7;
        next.setDate(next.getDate() + daysUntilMonday);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1, 1);
        break;
    }
    
    return next.toISOString().slice(0, 16).replace('T', ' ');
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'text-green-500 border-green-500';
      case 'weekly': return 'text-blue-500 border-blue-500';
      case 'monthly': return 'text-purple-500 border-purple-500';
      default: return 'text-gray-500 border-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Clock className="mr-2 h-4 w-4" />
          Scheduled Reports
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Reports
          </DialogTitle>
          <DialogDescription>
            Automate your analytics reporting with scheduled email delivery
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Existing Reports */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Active Reports</h3>
              <Button 
                onClick={() => setIsCreating(true)}
                size="sm"
                className="neon-glow"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Report
              </Button>
            </div>
            
            <div className="space-y-3">
              {reports.map((report) => (
                <Card 
                  key={report.id}
                  className={`transition-all duration-200 ${
                    report.enabled 
                      ? 'border-primary/50 bg-primary/5' 
                      : 'border-border opacity-60'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{report.name}</h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getFrequencyColor(report.frequency)}`}
                          >
                            {report.frequency}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {report.format.toUpperCase()}
                          </Badge>
                          {!report.enabled && (
                            <Badge variant="secondary" className="text-xs opacity-60">
                              Paused
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>{report.time} {report.frequency}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span>{report.recipients.length} recipient(s)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            <span>{templates.find(t => t.value === report.template)?.label}</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {report.lastSent ? (
                            <span>Last sent: {report.lastSent}</span>
                          ) : (
                            <span>Never sent</span>
                          )}
                          {' • '}
                          <span>Next: {report.nextSend}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleReport(report.id)}
                        >
                          {report.enabled ? 'Pause' : 'Resume'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingReport(report.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteReport(report.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {reports.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Scheduled Reports</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first automated report to get started
                    </p>
                    <Button onClick={() => setIsCreating(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Report
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Create New Report Form */}
          {isCreating && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-lg">Create Scheduled Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Report Name</label>
                  <input
                    type="text"
                    value={newReport.name}
                    onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Weekly API Performance Report"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Frequency</label>
                    <select
                      value={newReport.frequency}
                      onChange={(e) => setNewReport(prev => ({ ...prev, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))}
                      className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {frequencies.map(freq => (
                        <option key={freq.value} value={freq.value}>
                          {freq.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Time</label>
                    <input
                      type="time"
                      value={newReport.time}
                      onChange={(e) => setNewReport(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Template</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                    {templates.map(template => {
                      const Icon = template.icon;
                      return (
                        <Card
                          key={template.value}
                          className={`cursor-pointer transition-all duration-200 ${
                            newReport.template === template.value 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setNewReport(prev => ({ ...prev, template: template.value as 'summary' | 'detailed' | 'executive' }))}
                        >
                          <CardContent className="p-3 text-center">
                            <Icon className="h-6 w-6 mx-auto mb-2" />
                            <div className="font-medium text-sm">{template.label}</div>
                            <div className="text-xs text-muted-foreground">{template.description}</div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Format</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {formats.map(format => (
                      <Card
                        key={format.value}
                        className={`cursor-pointer transition-all duration-200 ${
                          newReport.format === format.value 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setNewReport(prev => ({ ...prev, format: format.value as 'pdf' | 'csv' | 'json' }))}
                      >
                        <CardContent className="p-2 text-center">
                          <div className="font-medium text-sm">{format.label}</div>
                          <div className="text-xs text-muted-foreground">{format.description}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Recipients</label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addRecipient}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2 mt-2">
                    {newReport.recipients.map((recipient, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="email"
                          value={recipient}
                          onChange={(e) => updateRecipient(index, e.target.value)}
                          className="flex-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="email@company.com"
                        />
                        {newReport.recipients.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRecipient(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={createReport}
                    disabled={!newReport.name || newReport.recipients.some(r => !r.trim())}
                  >
                    Create Report
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}