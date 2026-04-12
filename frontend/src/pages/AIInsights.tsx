import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Paper
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PersonIcon from '@mui/icons-material/Person';
import MessageIcon from '@mui/icons-material/Message';
import SendIcon from '@mui/icons-material/Send';
import { analyzeDemand, getCustomerInsights, getDealRecommendations, generateMessage } from '../api/ai';
import { sendMessage } from '../api/messages';
import { getCustomers } from '../api/customers';
import { Customer } from '../types';
import toast from 'react-hot-toast';

const AIInsights: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [demandResults, setDemandResults] = useState<any>(null);
  const [dealResults, setDealResults] = useState<any>(null);
  const [customerInsights, setCustomerInsights] = useState<any>(null);
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [insightCustomer, setInsightCustomer] = useState<number | ''>('');
  const [msgCustomer, setMsgCustomer] = useState<number | ''>('');
  const [msgType, setMsgType] = useState<'promotion' | 'deal' | 'follow_up'>('promotion');
  const [loadingDemand, setLoadingDemand] = useState(false);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    getCustomers().then(r => setCustomers(r.data)).catch(() => {});
  }, []);

  const handleAnalyzeDemand = async () => {
    setLoadingDemand(true);
    try {
      const res = await analyzeDemand();
      setDemandResults(res.data);
      toast.success('Demand analysis complete!');
    } catch { toast.error('Failed to analyze demand'); } finally { setLoadingDemand(false); }
  };

  const handleDealRecommendations = async () => {
    setLoadingDeals(true);
    try {
      const res = await getDealRecommendations();
      setDealResults(res.data);
      toast.success('Deal recommendations ready!');
    } catch { toast.error('Failed to get recommendations'); } finally { setLoadingDeals(false); }
  };

  const handleCustomerInsights = async () => {
    if (!insightCustomer) { toast.error('Select a customer'); return; }
    setLoadingInsights(true);
    try {
      const res = await getCustomerInsights(insightCustomer as number);
      setCustomerInsights(res.data);
      toast.success('Customer insights ready!');
    } catch { toast.error('Failed to get insights'); } finally { setLoadingInsights(false); }
  };

  const handleGenerateMessage = async () => {
    if (!msgCustomer) { toast.error('Select a customer'); return; }
    setLoadingMsg(true);
    try {
      const res = await generateMessage(msgCustomer as number, msgType);
      setGeneratedMessage(res.data?.message || res.data?.content || JSON.stringify(res.data));
      toast.success('Message generated!');
    } catch { toast.error('Failed to generate message'); } finally { setLoadingMsg(false); }
  };

  const handleSendMessage = async () => {
    if (!msgCustomer || !generatedMessage) { toast.error('Generate a message first'); return; }
    setSendingMsg(true);
    try {
      await sendMessage(msgCustomer as number, { type: msgType, content: generatedMessage });
      toast.success('Message sent!');
      setGeneratedMessage('');
    } catch { toast.error('Failed to send message'); } finally { setSendingMsg(false); }
  };

  const renderJSON = (data: any) => {
    if (!data) return null;
    if (Array.isArray(data)) {
      return data.map((item, i) => (
        <Card key={i} sx={{ mb: 1 }} variant="outlined">
          <CardContent sx={{ pb: '12px !important' }}>
            {Object.entries(item).map(([k, v]) => (
              <Box key={k} sx={{ display: 'flex', gap: 1, mb: 0.3 }}>
                <Typography variant="body2" color="textSecondary" sx={{ minWidth: 120, textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</Typography>
                <Typography variant="body2">{String(v)}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      ));
    }
    return (
      <Card variant="outlined">
        <CardContent sx={{ pb: '12px !important' }}>
          {Object.entries(data).map(([k, v]) => (
            <Box key={k} sx={{ display: 'flex', gap: 1, mb: 0.3 }}>
              <Typography variant="body2" color="textSecondary" sx={{ minWidth: 120, textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</Typography>
              <Typography variant="body2">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <AutoAwesomeIcon color="primary" />
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>AI Insights</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Demand Analysis */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrendingUpIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>Demand Analysis</Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Analyze product demand trends and inventory forecasts.
            </Typography>
            <Button variant="contained" onClick={handleAnalyzeDemand} disabled={loadingDemand} startIcon={loadingDemand ? <CircularProgress size={16} /> : <TrendingUpIcon />} sx={{ mb: 2 }}>
              {loadingDemand ? 'Analyzing...' : 'Analyze Demand'}
            </Button>
            {demandResults && <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>{renderJSON(demandResults)}</Box>}
          </Paper>
        </Grid>

        {/* Deal Recommendations */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocalOfferIcon color="secondary" />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>Deal Recommendations</Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Get AI-powered deal and discount recommendations.
            </Typography>
            <Button variant="contained" color="secondary" onClick={handleDealRecommendations} disabled={loadingDeals} startIcon={loadingDeals ? <CircularProgress size={16} /> : <LocalOfferIcon />} sx={{ mb: 2 }}>
              {loadingDeals ? 'Loading...' : 'Get Deal Recommendations'}
            </Button>
            {dealResults && <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>{renderJSON(dealResults)}</Box>}
          </Paper>
        </Grid>

        {/* Customer Insights */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PersonIcon color="info" />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>Customer Insights</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl size="small" sx={{ flexGrow: 1 }}>
                <InputLabel>Select Customer</InputLabel>
                <Select value={insightCustomer} onChange={e => setInsightCustomer(e.target.value as number)} label="Select Customer">
                  {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="contained" color="info" onClick={handleCustomerInsights} disabled={loadingInsights || !insightCustomer}>
                {loadingInsights ? <CircularProgress size={20} /> : 'Get Insights'}
              </Button>
            </Box>
            {customerInsights && <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>{renderJSON(customerInsights)}</Box>}
          </Paper>
        </Grid>

        {/* Generate & Send Message */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <MessageIcon color="success" />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>Generate & Send Message</Typography>
            </Box>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={12}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Customer</InputLabel>
                  <Select value={msgCustomer} onChange={e => setMsgCustomer(e.target.value as number)} label="Customer">
                    {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Message Type</InputLabel>
                  <Select value={msgType} onChange={e => setMsgType(e.target.value as 'promotion' | 'deal' | 'follow_up')} label="Message Type">
                    <MenuItem value="promotion">📢 Promotion</MenuItem>
                    <MenuItem value="deal">🏷️ Deal</MenuItem>
                    <MenuItem value="follow_up">👋 Follow-up</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={12}>
                <Button variant="outlined" color="success" onClick={handleGenerateMessage} disabled={loadingMsg || !msgCustomer} startIcon={loadingMsg ? <CircularProgress size={16} /> : <AutoAwesomeIcon />} fullWidth>
                  {loadingMsg ? 'Generating...' : 'Generate Message'}
                </Button>
              </Grid>
            </Grid>
            {generatedMessage && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>Preview:</Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#f9f9f9' }}>
                  <Typography variant="body2">{generatedMessage}</Typography>
                </Paper>
                <Button variant="contained" color="success" onClick={handleSendMessage} disabled={sendingMsg} startIcon={sendingMsg ? <CircularProgress size={16} /> : <SendIcon />} fullWidth>
                  {sendingMsg ? 'Sending...' : 'Send Message'}
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIInsights;
