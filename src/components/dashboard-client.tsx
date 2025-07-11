'use client';

import { useState, useTransition, type ChangeEvent, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { BarChart2, Search, Send, Wand2, Users, Mail, Play, Pause, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { StatsCard } from '@/components/stats-card';
import { findContactsAction, getSummaryAction, sendEmailAction, type Recipient } from '@/app/actions';
import { Badge } from './ui/badge';
import { HighTechTemplate } from './email/high-tech-template';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { emailTemplates } from './email/templates';
import { Progress } from './ui/progress';

type RecipientStatus = 'Pending' | 'Queued' | 'Sending' | 'Sent' | 'Failed' | 'Skipped (Duplicate)' | 'Skipped (Daily Limit)';
type RecipientWithStatus = Recipient & { status: RecipientStatus, error?: string };
type Stats = { deliveries: number; opens: number; bounces: number; totalSent: number };
type RecipientSource = 'ai' | 'csv' | 'manual';
type SentRecord = { email: string; timestamp: number };
type CampaignState = 'idle' | 'running' | 'paused' | 'finished';

const DAILY_LIMIT = 100;
const SEND_INTERVAL_MS = 60 * 1000; // 1 minute

export function DashboardClient() {
  const [recipientSource, setRecipientSource] = useState<RecipientSource>('ai');
  const [recipients, setRecipients] = useState<RecipientWithStatus[]>([]);
  const [emailSubject, setEmailSubject] = useState('Free Job Postings on AirborneHRS');
  const [fromEmail, setFromEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(emailTemplates[0].id);
  const [stats, setStats] = useState<Stats | null>(null);
  const [summary, setSummary] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('Head of HR');
  const [manualRecipients, setManualRecipients] = useState('');
  const [campaignState, setCampaignState] = useState<CampaignState>('idle');
  const [sentCount, setSentCount] = useState(0);

  const { toast } = useToast();
  const [isFinding, startFinding] = useTransition();
  const [isSummarizing, startSummarizing] = useTransition();

  const queueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentRecipientIndexRef = useRef(0);

  const setRecipientStatus = useCallback((email: string, status: RecipientStatus, error?: string) => {
    setRecipients(recs => recs.map(r => r.email === email ? { ...r, status, error } : r));
  }, []);

  const getSentHistory = (): SentRecord[] => {
    try {
      const history = localStorage.getItem('sentHistory');
      return history ? JSON.parse(history) : [];
    } catch (e) {
      console.error("Failed to read from localStorage", e);
      return [];
    }
  };

  const addSentRecord = (email: string) => {
    try {
      const history = getSentHistory();
      history.push({ email, timestamp: Date.now() });
      localStorage.setItem('sentHistory', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to write to localStorage", e);
    }
  };

  const processQueue = useCallback(async () => {
    if (campaignState === 'paused') return;

    const recipient = recipients[currentRecipientIndexRef.current];
    if (!recipient) {
      setCampaignState('finished');
      toast({ title: 'Campaign Finished', description: 'All emails have been processed.' });
      return;
    }

    setRecipientStatus(recipient.email, 'Sending');
    const template = emailTemplates.find(t => t.id === selectedTemplate);
    if (template) {
      const result = await sendEmailAction(recipient, emailSubject, template.body, fromEmail);
      setRecipientStatus(recipient.email, result.status, result.error);
      if (result.status === 'Sent') {
        addSentRecord(recipient.email);
        setSentCount(prev => prev + 1);
        const totalSent = sentCount + 1;
        const bounces = Math.floor(totalSent * 0.05);
        const deliveries = totalSent - bounces > 0 ? totalSent - bounces : 0;
        const opens = Math.floor(deliveries * 0.3);
        setStats({ totalSent, deliveries, opens, bounces });
      }
    }

    currentRecipientIndexRef.current++;
    if (currentRecipientIndexRef.current < recipients.length) {
      queueTimerRef.current = setTimeout(processQueue, SEND_INTERVAL_MS);
    } else {
      setCampaignState('finished');
      toast({ title: 'Campaign Finished', description: 'All emails have been processed.' });
    }
  }, [recipients, fromEmail, emailSubject, selectedTemplate, toast, setRecipientStatus, campaignState, sentCount]);


  const startCampaign = () => {
    if (!fromEmail || !fromEmail.includes('@')) {
      toast({ variant: 'destructive', title: 'Invalid "From" Email', description: 'Please enter a valid email address.' });
      return;
    }

    const sentHistory = getSentHistory();
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const sentToday = sentHistory.filter(r => r.timestamp > twentyFourHoursAgo);

    let dailyLimitReached = false;

    const queuedRecipients = recipients.map(r => {
      if (r.status !== 'Pending') return r;
      if (sentHistory.some(s => s.email === r.email)) {
        return { ...r, status: 'Skipped (Duplicate)' as const };
      }
      if (sentToday.length + (recipients.filter(rec => rec.status === 'Queued').length) >= DAILY_LIMIT) {
        dailyLimitReached = true;
        return { ...r, status: 'Skipped (Daily Limit)' as const };
      }
      return { ...r, status: 'Queued' as const };
    });
    
    setRecipients(queuedRecipients);

    if (dailyLimitReached) {
        toast({ variant: 'destructive', title: 'Daily Limit Reached', description: `You can send a maximum of ${DAILY_LIMIT} emails per day.` });
    }
    
    currentRecipientIndexRef.current = 0;
    setSentCount(0);
    setCampaignState('running');
    toast({ title: 'Campaign Started!', description: 'Emails are being sent according to the schedule.' });
    processQueue();
  };

  const pauseCampaign = () => {
    if (queueTimerRef.current) {
      clearTimeout(queueTimerRef.current);
    }
    setCampaignState('paused');
    toast({ title: 'Campaign Paused' });
  };

  const resumeCampaign = () => {
    setCampaignState('running');
    toast({ title: 'Campaign Resumed' });
    processQueue();
  };

  const stopCampaign = () => {
    if (queueTimerRef.current) {
      clearTimeout(queueTimerRef.current);
    }
    setCampaignState('idle');
    setRecipients(recs => recs.map(r => ({ ...r, status: 'Pending' })));
    toast({ title: 'Campaign Stopped' });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = (results.data as any[])
            .filter(row => row.email && row.email.includes('@'))
            .map((row) => ({ email: row.email, name: row.name || '', status: 'Pending' as const }));
          if (parsedData.length === 0) {
            toast({ variant: 'destructive', title: 'Invalid File', description: 'CSV must contain an "email" column.' });
            return;
          }
          setRecipients(parsedData);
          toast({ title: 'File Uploaded', description: `${parsedData.length} recipients loaded.` });
        },
        error: (error: any) => {
          toast({ variant: 'destructive', title: 'Parsing Error', description: error.message });
        }
      });
      event.target.value = '';
    }
  };

  const handleFindContacts = () => {
    startFinding(async () => {
      const result = await findContactsAction({ companyName, role });
      if (result.success && result.contacts) {
        if (result.contacts.length === 0) {
          toast({ title: 'No Contacts Found', description: `Could not find contacts for ${role}${companyName ? ` at ${companyName}` : ''}.` });
        } else {
          setRecipients(result.contacts.map(c => ({ ...c, status: 'Pending' })));
          toast({ title: 'Contacts Found', description: `Found ${result.contacts.length} potential contacts.` });
        }
      } else {
        toast({ variant: 'destructive', title: 'Failed to Find Contacts', description: result.error });
      }
    });
  };

  const handleManualAdd = () => {
    const lines = manualRecipients.split('\n').filter(line => line.trim() !== '');
    const newRecipients = lines.map(line => {
      const parts = line.split(',');
      const email = parts[0]?.trim();
      const name = parts[1]?.trim() || '';
      if (email && email.includes('@')) {
        return { email, name, status: 'Pending' as const };
      }
      return null;
    }).filter((r): r is RecipientWithStatus => r !== null);
    if (newRecipients.length > 0) {
      setRecipients(newRecipients);
      toast({ title: 'Recipients Added', description: `Added ${newRecipients.length} recipients.` });
    } else {
      toast({ variant: 'destructive', title: 'Invalid Format', description: 'Please use "email,name" format, one per line.' });
    }
  };

  const handleSummarize = () => {
    if (!stats) return;
    startSummarizing(async () => {
      const result = await getSummaryAction(stats);
      if (result.success && result.summary) {
        setSummary(result.summary);
      } else {
        toast({ variant: 'destructive', title: 'Summary Failed', description: result.error });
      }
    });
  };

  const currentTemplate = emailTemplates.find(t => t.id === selectedTemplate) ?? emailTemplates[0];
  const previewHtml = HighTechTemplate({
    name: recipients[0]?.name || 'Recipient',
    content: currentTemplate.body.replace(/{{name}}/gi, recipients[0]?.name || 'Recipient')
  });

  const queuedCount = recipients.filter(r => r.status === 'Queued').length;
  const progress = recipients.length > 0 ? (sentCount / (sentCount + queuedCount)) * 100 : 0;
  
  const getBadgeVariant = (status: RecipientStatus) => {
    switch (status) {
        case 'Sent': return 'default';
        case 'Failed': return 'destructive';
        case 'Queued': return 'secondary';
        case 'Sending': return 'secondary';
        case 'Skipped (Duplicate)': return 'outline';
        case 'Skipped (Daily Limit)': return 'outline';
        default: return 'secondary';
    }
  };


  return (
    <div className="grid gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Sent" value={stats?.totalSent ?? 0} icon={<Send />} />
        <StatsCard title="Deliveries" value={stats?.deliveries ?? 0} icon={<Mail />} />
        <StatsCard title="Opens" value={stats?.opens ?? 0} icon={<Users />} />
        <StatsCard title="Bounces" value={stats?.bounces ?? 0} icon={<BarChart2 />} />
      </div>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>AI Performance Summary</CardTitle>
            <CardDescription>An AI-generated analysis of your campaign performance.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            {summary ? (
              <p className="text-sm text-muted-foreground">{summary}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Click the button to generate a summary.</p>
            )}
            <Button onClick={handleSummarize} disabled={isSummarizing || !stats}>
              {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Generate Summary
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Create Campaign</CardTitle>
            <CardDescription>Add recipients, choose your template, and send your email blast.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label>1. Add Recipients</Label>
              <Tabs value={recipientSource} onValueChange={(v) => setRecipientSource(v as RecipientSource)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="ai">Auto-Fetch (AI)</TabsTrigger>
                  <TabsTrigger value="csv">Upload CSV</TabsTrigger>
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>
                <TabsContent value="ai" className="mt-4 grid gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="company-name">Company Name (Optional)</Label>
                      <Input id="company-name" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g., Acme Corp" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Input id="role" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g., CEO, Head of HR" />
                    </div>
                  </div>
                  <Button onClick={handleFindContacts} disabled={isFinding || !role || campaignState !== 'idle'}>
                    {isFinding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Find Contacts
                  </Button>
                </TabsContent>
                <TabsContent value="csv" className="mt-4">
                  <div className="grid w-full max-w-sm items-center gap-2">
                    <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} disabled={campaignState !== 'idle'} className="cursor-pointer file:text-primary file:font-semibold" />
                    <p className="text-xs text-muted-foreground">CSV must have 'email' and 'name' columns.</p>
                  </div>
                </TabsContent>
                <TabsContent value="manual" className="mt-4 grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="manual-recipients">Enter Recipients</Label>
                    <Textarea id="manual-recipients" value={manualRecipients} onChange={(e) => setManualRecipients(e.target.value)} disabled={campaignState !== 'idle'} placeholder="email@example.com,John Doe\nanother@email.com,Jane Doe" className="min-h-[100px] font-mono" />
                    <p className="text-xs text-muted-foreground">One recipient per line, format: email,name</p>
                  </div>
                  <Button onClick={handleManualAdd} disabled={campaignState !== 'idle'}>Add Recipients</Button>
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid gap-4">
              <h3 className="font-semibold">2. Compose Email</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input id="email-subject" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Your email subject" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="from-email">"From" Email Address</Label>
                  <Input id="from-email" type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="you@yourdomain.com" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Email Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {emailTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Preview & Send</h3>
              <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg border bg-gray-800">
                <iframe
                  srcDoc={previewHtml}
                  className="h-full w-full"
                  title="Email Preview"
                />
              </div>
              {campaignState === 'idle' || campaignState === 'finished' ? (
                <Button onClick={startCampaign} disabled={recipients.length === 0} size="lg">
                  <Play className="mr-2 h-4 w-4" />
                  Start Campaign ({recipients.filter(r => r.status === 'Pending').length} pending)
                </Button>
              ) : (
                <div className="flex flex-col gap-4">
                    <div className='flex items-center gap-4'>
                        {campaignState === 'running' && <Button onClick={pauseCampaign} size="lg" variant="secondary"><Pause className="mr-2 h-4 w-4" />Pause</Button>}
                        {campaignState === 'paused' && <Button onClick={resumeCampaign} size="lg"><Play className="mr-2 h-4 w-4" />Resume</Button>}
                        <Button onClick={stopCampaign} size="lg" variant="destructive"><Square className="mr-2 h-4 w-4" />Stop</Button>
                    </div>
                    <div>
                        <Progress value={progress} className="w-full" />
                        <p className="text-sm text-muted-foreground mt-2">{sentCount} of {sentCount + queuedCount} emails sent.</p>
                    </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipients ({recipients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.length > 0 ? recipients.map((r, i) => (
                  <TableRow key={`${r.email}-${i}`}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(r.status)} className="capitalize">
                        {r.status === 'Sending' && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Add recipients using one of the methods above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
