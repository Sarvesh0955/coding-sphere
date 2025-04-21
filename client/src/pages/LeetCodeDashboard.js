import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Grid, Paper, Typography, Box, CircularProgress, Divider, Card, CardContent, CardHeader, 
  Alert, Button, Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Stack
} from '@mui/material';
import { 
  Code as CodeIcon, 
  TrendingUp as TrendingUpIcon,
  EmojiEvents as EmojiEventsIcon,
  BarChart as BarChartIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Timeline as TimelineIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  Whatshot as WhatshotIcon,
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';
import { Link } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  PointElement,
  LineElement,
  Title
);

const LeetCodeDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lcAccount, setLcAccount] = useState(null);
  const [lcData, setLcData] = useState(null);
  const [submissionCalendarData, setSubmissionCalendarData] = useState(null);
  const [submissionStats, setSubmissionStats] = useState(null);
  
  useEffect(() => {
    // Only fetch data if user is logged in
    if (user && user.username) {
      fetchUserAccounts();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/profile/accounts', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data && response.data.accounts) {
        const lcAcc = response.data.accounts.find(account => 
          account.platform_name.toLowerCase() === 'leetcode'
        );
        
        if (lcAcc) {
          setLcAccount(lcAcc);
          fetchLeetCodeData(lcAcc.platform_username);
        } else {
          setError("No LeetCode account found. Please add a LeetCode account in your profile.");
          setLoading(false);
        }
      } else {
        setError("No accounts found. Please add a LeetCode account in your profile.");
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching user accounts:', err);
      setError('Failed to fetch your coding platform accounts.');
      setLoading(false);
    }
  };

  const fetchLeetCodeData = async (username) => {
    try {
      const response = await axios.get(`/api/profile/leetcode/${username}`);
      setLcData(response.data);
      
      // Process submission calendar data
      processSubmissionCalendar(response.data.submissionCalendar);
      
      // Calculate additional stats
      calculateSubmissionStats(response.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching LeetCode data:', err);
      setError('Failed to fetch LeetCode statistics.');
      setLoading(false);
    }
  };

  const processSubmissionCalendar = (calendar) => {
    if (!calendar) {
      setSubmissionCalendarData(null);
      return;
    }
    
    // Convert the calendar data to a format suitable for visualization
    const submissionsData = Object.entries(calendar).map(([timestamp, count]) => ({
      date: new Date(parseInt(timestamp) * 1000),
      count: parseInt(count)
    })).sort((a, b) => a.date - b.date);
    
    // Group by month for the last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const monthlySubmissions = [];
    const months = [];
    const currentMonth = new Date().getMonth();
    
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = new Date().getFullYear() - (i > currentMonth ? 1 : 0);
      const monthName = new Date(year, monthIndex).toLocaleDateString('en-US', { month: 'short' });
      months.unshift(monthName);
      monthlySubmissions.unshift(0);
    }
    
    submissionsData
      .filter(entry => entry.date >= oneYearAgo)
      .forEach(entry => {
        const monthIndex = entry.date.getMonth();
        const yearDiff = new Date().getFullYear() - entry.date.getFullYear();
        const monthDiff = new Date().getMonth() - monthIndex + (yearDiff * 12);
        if (monthDiff < 12) {
          const arrayIndex = 11 - monthDiff;
          monthlySubmissions[arrayIndex] += entry.count;
        }
      });
    
    // Calculate daily streak
    let currentStreak = 0;
    let maxStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Sort submissions by date (recent first)
    const sortedDates = submissionsData
      .map(s => s.date.setHours(0, 0, 0, 0))
      .sort((a, b) => b - a);
    
    // Get unique dates
    const uniqueDates = [...new Set(sortedDates)];
    
    // Calculate current streak
    if (uniqueDates.length > 0) {
      const oneDayMs = 24 * 60 * 60 * 1000;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if today or yesterday has submissions
      let currentDay = today.getTime();
      if (!uniqueDates.includes(today.getTime())) {
        if (uniqueDates.includes(yesterday.getTime())) {
          currentDay = yesterday.getTime();
        } else {
          currentStreak = 0;
        }
      }
      
      // Calculate streak
      if (currentStreak !== 0 || uniqueDates.includes(currentDay)) {
        let i = 0;
        let streakDate = currentDay;
        
        while (i < uniqueDates.length && uniqueDates[i] >= streakDate - oneDayMs) {
          currentStreak++;
          streakDate -= oneDayMs;
          
          // Skip to the next date in streak
          while (i < uniqueDates.length && uniqueDates[i] > streakDate) {
            i++;
          }
        }
      }
      
      // Calculate max streak
      let tempStreak = 0;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const diff = (uniqueDates[i] - uniqueDates[i + 1]) / oneDayMs;
        if (diff === 1) {
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }
      maxStreak = Math.max(maxStreak + 1, currentStreak); // +1 because we count the first day too
    }
    
    // Calculate average submissions per active day
    let totalSubmissions = 0;
    let activeDays = uniqueDates.length;
    
    submissionsData.forEach(entry => {
      totalSubmissions += entry.count;
    });
    
    const averagePerActiveDay = activeDays > 0 ? Math.round(totalSubmissions / activeDays * 10) / 10 : 0;
    
    // Calculate heatmap data for the last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const heatmapData = submissionsData
      .filter(entry => entry.date >= lastMonth)
      .map(entry => ({
        date: entry.date.toISOString().split('T')[0],
        count: entry.count
      }));
    
    setSubmissionCalendarData({
      monthly: {
        labels: months,
        data: monthlySubmissions
      },
      streak: {
        current: currentStreak,
        max: maxStreak
      },
      averagePerActiveDay,
      heatmap: heatmapData,
      activeDays,
      totalSubmissions
    });
  };

  const calculateSubmissionStats = (data) => {
    if (!data) {
      setSubmissionStats(null);
      return;
    }
    
    // Calculate acceptance rate trend
    // This is a placeholder as we don't have historical acceptance rate data
    // In a real implementation, this would come from the LeetCode API
    const acceptanceRate = data.acceptanceRate || 0;
    
    // Calculate problem completion progress
    const totalProblems = data.totalQuestions || 0;
    const totalSolved = data.totalSolved || 0;
    const completionRate = totalProblems > 0 ? (totalSolved / totalProblems * 100).toFixed(1) : 0;
    
    // Calculate difficulty distribution
    const easyTotal = data.totalEasy || 0;
    const mediumTotal = data.totalMedium || 0;
    const hardTotal = data.totalHard || 0;
    
    const easySolved = data.easySolved || 0;
    const mediumSolved = data.mediumSolved || 0;
    const hardSolved = data.hardSolved || 0;
    
    const easyRate = easyTotal > 0 ? (easySolved / easyTotal * 100).toFixed(1) : 0;
    const mediumRate = mediumTotal > 0 ? (mediumSolved / mediumTotal * 100).toFixed(1) : 0;
    const hardRate = hardTotal > 0 ? (hardSolved / hardTotal * 100).toFixed(1) : 0;
    
    // Estimate skill level based on problem solving distribution
    // This is a simple estimation model - could be improved with actual LeetCode metrics
    let skillLevel = 'Beginner';
    let skillScore = 0;
    
    if (totalProblems > 0) {
      skillScore = (
        (easySolved / Math.max(easyTotal, 1) * 30) + 
        (mediumSolved / Math.max(mediumTotal, 1) * 50) + 
        (hardSolved / Math.max(hardTotal, 1) * 100)
      ).toFixed(1);
      
      if (skillScore > 70) skillLevel = 'Expert';
      else if (skillScore > 40) skillLevel = 'Intermediate';
      else if (skillScore > 20) skillLevel = 'Progressing';
    }
    
    // Calculate consistency score (based on submission calendar data)
    let consistencyScore = 0;
    if (submissionCalendarData) {
      // Factor in streak and activity
      const { current: currentStreak, max: maxStreak } = submissionCalendarData.streak;
      const { activeDays } = submissionCalendarData;
      
      // Simple formula that weights recent activity (streak) and overall activity
      consistencyScore = Math.min(100, ((currentStreak * 3) + (activeDays / 3) + (maxStreak * 0.5))).toFixed(1);
    }
    
    setSubmissionStats({
      acceptanceRate,
      completionRate,
      difficulty: {
        easy: { solved: easySolved, total: easyTotal, rate: easyRate },
        medium: { solved: mediumSolved, total: mediumTotal, rate: mediumRate },
        hard: { solved: hardSolved, total: hardTotal, rate: hardRate }
      },
      skillLevel,
      skillScore,
      consistencyScore,
      ranking: data.ranking || 0
    });
  };

  // Chart generation functions
  const generateMonthlyActivityChart = () => {
    if (!submissionCalendarData || !submissionCalendarData.monthly) return null;
    
    return {
      labels: submissionCalendarData.monthly.labels,
      datasets: [
        {
          label: 'Submissions',
          data: submissionCalendarData.monthly.data,
          backgroundColor: 'rgba(236, 64, 122, 0.7)',
          borderColor: 'rgba(236, 64, 122, 1)',
          borderWidth: 1,
          borderRadius: 5,
        }
      ]
    };
  };

  const generateDifficultyDistributionChart = () => {
    if (!lcData) return null;
    
    return {
      labels: ['Easy', 'Medium', 'Hard'],
      datasets: [
        {
          label: 'Solved',
          data: [lcData.easySolved || 0, lcData.mediumSolved || 0, lcData.hardSolved || 0],
          backgroundColor: ['rgba(76, 175, 80, 0.7)', 'rgba(255, 152, 0, 0.7)', 'rgba(244, 67, 54, 0.7)'],
          borderColor: ['#4CAF50', '#FF9800', '#F44336'],
          borderWidth: 1,
        }
      ]
    };
  };

  const generateProgressChart = () => {
    if (!lcData) return null;
    
    return {
      labels: ['Solved', 'Unsolved'],
      datasets: [
        {
          data: [
            lcData.totalSolved || 0, 
            (lcData.totalQuestions || 0) - (lcData.totalSolved || 0)
          ],
          backgroundColor: ['rgba(33, 150, 243, 0.7)', 'rgba(224, 224, 224, 0.7)'],
          borderWidth: 1,
        }
      ]
    };
  };

  const generateSkillRadarChart = () => {
    if (!submissionStats) return null;
    
    // Radar data would require more detailed stats than what's available
    // This is a placeholder showing a balanced distribution
    return {
      labels: ['Problem Solving', 'Consistency', 'Difficulty', 'Speed', 'Acceptance Rate'],
      datasets: [
        {
          label: 'Your Skills',
          data: [
            submissionStats.skillScore || 0,
            submissionStats.consistencyScore || 0,
            (submissionStats.difficulty.hard.rate * 0.7) + 
            (submissionStats.difficulty.medium.rate * 0.3) || 0,
            Math.min(100, ((submissionStats.difficulty.easy.solved * 0.2) + 
                           (submissionStats.difficulty.medium.solved * 0.5) + 
                           (submissionStats.difficulty.hard.solved * 1))),
            submissionStats.acceptanceRate || 0
          ],
          backgroundColor: 'rgba(156, 39, 176, 0.2)',
          borderColor: 'rgba(156, 39, 176, 1)',
          pointBackgroundColor: 'rgba(156, 39, 176, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(156, 39, 176, 1)',
        }
      ]
    };
  };

  // Helper function to get color for progress bar based on percentage
  const getProgressColor = (percentage) => {
    if (percentage < 30) return 'error';
    if (percentage < 70) return 'warning';
    return 'success';
  };

  // Render user profile section if user is not logged in
  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert 
          severity="info" 
          action={
            <Button color="inherit" size="small" component={Link} to="/login">
              Login
            </Button>
          }
        >
          Please login to view your LeetCode dashboard.
        </Alert>
      </Container>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error state (no LeetCode account)
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert 
          severity="warning"
          action={
            <Button color="inherit" size="small" component={Link} to="/profile">
              Add Account
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* User Info Header */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4, 
          background: 'linear-gradient(45deg, #9C27B0 30%, #EC407A 90%)',
          color: 'white'
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center">
              <Avatar 
                alt={lcAccount.platform_username}
                sx={{ width: 80, height: 80, mr: 2, bgcolor: '#f5f5f5' }}
              >
                <CodeIcon sx={{ width: 40, height: 40, color: '#9C27B0' }} />
              </Avatar>
              <Box>
                <Typography variant="h4">
                  {lcAccount.platform_username}
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  <Chip 
                    label={lcData.ranking ? `Rank: ${lcData.ranking}` : 'Unranked'}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box textAlign="right">
              <Typography variant="body1" fontWeight="medium">
                Solved {lcData.totalSolved || 0} of {lcData.totalQuestions || 0} problems
              </Typography>
              <Box mt={2}>
                <Button
                  variant="outlined"
                  size="small"
                  color="inherit"
                  href={`https://leetcode.com/${lcAccount.platform_username}`}
                  target="_blank"
                  rel="noopener"
                  sx={{ 
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  View LeetCode Profile
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Summary Cards Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Problems Solved */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" component="h3">Problems Solved</Typography>
                <Box sx={{ bgcolor: 'blue.50', borderRadius: '50%', p: 1 }}>
                  <AssignmentTurnedInIcon color="primary" />
                </Box>
              </Box>
              <Box mt={3}>
                <Typography variant="h3">{lcData.totalSolved || 0}</Typography>
                <Typography variant="body2" color="textSecondary">of {lcData.totalQuestions || 0} problems</Typography>
              </Box>
              <Box mt={2}>
                <Typography variant="body2" color="textSecondary">Completion:</Typography>
                <Box display="flex" alignItems="center" mt={0.5}>
                  <LinearProgress 
                    variant="determinate" 
                    value={submissionStats?.completionRate || 0} 
                    sx={{ flexGrow: 1, height: 8, borderRadius: 5 }}
                    color={getProgressColor(submissionStats?.completionRate || 0)}
                  />
                  <Typography variant="body2" ml={1}>
                    {submissionStats?.completionRate || 0}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Difficulty Distribution */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" component="h3">Difficulty</Typography>
                <Box sx={{ bgcolor: 'orange.50', borderRadius: '50%', p: 1 }}>
                  <WorkspacePremiumIcon sx={{ color: 'orange' }} />
                </Box>
              </Box>
              <Box mt={2}>
                <Stack spacing={1}>
                  <Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="success.main">Easy</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {lcData.easySolved || 0}/{lcData.totalEasy || 0}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(lcData.easySolved / (lcData.totalEasy || 1)) * 100} 
                      sx={{ height: 6, borderRadius: 5 }}
                      color="success"
                    />
                  </Box>
                  <Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="warning.main">Medium</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {lcData.mediumSolved || 0}/{lcData.totalMedium || 0}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(lcData.mediumSolved / (lcData.totalMedium || 1)) * 100} 
                      sx={{ height: 6, borderRadius: 5 }}
                      color="warning"
                    />
                  </Box>
                  <Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="error.main">Hard</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {lcData.hardSolved || 0}/{lcData.totalHard || 0}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(lcData.hardSolved / (lcData.totalHard || 1)) * 100} 
                      sx={{ height: 6, borderRadius: 5 }}
                      color="error"
                    />
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Streak */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" component="h3">Current Streak</Typography>
                <Box sx={{ bgcolor: 'red.50', borderRadius: '50%', p: 1 }}>
                  <WhatshotIcon sx={{ color: 'red' }} />
                </Box>
              </Box>
              <Box mt={3}>
                <Typography variant="h3">
                  {submissionCalendarData?.streak?.current || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">consecutive days</Typography>
              </Box>
              <Box mt={2} display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Best Streak</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {submissionCalendarData?.streak?.max || 0} days
                </Typography>
              </Box>
              <Box mt={1} display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Active Days</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {submissionCalendarData?.activeDays || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Acceptance Rate */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" component="h3">Acceptance</Typography>
                <Box sx={{ bgcolor: 'green.50', borderRadius: '50%', p: 1 }}>
                  <BarChartIcon color="success" />
                </Box>
              </Box>
              <Box mt={3}>
                <Typography variant="h3">{lcData.acceptanceRate || 0}%</Typography>
                <Typography variant="body2" color="textSecondary">submission acceptance rate</Typography>
              </Box>
              <Box mt={2} display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Avg. Submissions/Day</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {submissionCalendarData?.averagePerActiveDay || 0}
                </Typography>
              </Box>
              <Box mt={1} display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Total Submissions</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {submissionCalendarData?.totalSubmissions || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Submissions Activity Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Monthly Activity" 
              subheader="Number of problems solved per month"
              action={
                <Chip 
                  icon={<CalendarMonthIcon />} 
                  label={`${submissionCalendarData?.activeDays || 0} active days`} 
                  size="small"
                  color="primary"
                />
              }
            />
            <Divider />
            <CardContent>
              <Box height={300}>
                {submissionCalendarData ? (
                  <Bar
                    data={generateMonthlyActivityChart()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          display: false
                        }
                      }
                    }}
                  />
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography variant="body2" color="textSecondary">
                      No activity data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Progress Donut Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Completion Progress" />
            <Divider />
            <CardContent>
              <Box height={300} display="flex" justifyContent="center" alignItems="center">
                {lcData ? (
                  <Doughnut
                    data={generateProgressChart()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw;
                              const total = lcData.totalQuestions || 1;
                              const percentage = Math.round((value / total) * 100);
                              return `${label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      },
                      cutout: '70%'
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No progress data available
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Difficulty & Skill Analysis */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Difficulty Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Difficulty Distribution" 
              subheader="Problems solved by difficulty level"
            />
            <Divider />
            <CardContent>
              <Box height={300} display="flex" justifyContent="center" alignItems="center">
                {lcData ? (
                  <Pie
                    data={generateDifficultyDistributionChart()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw;
                              let total = 0;
                              
                              switch(label) {
                                case 'Easy': 
                                  total = lcData.totalEasy || 1;
                                  break;
                                case 'Medium': 
                                  total = lcData.totalMedium || 1;
                                  break;
                                case 'Hard': 
                                  total = lcData.totalHard || 1;
                                  break;
                                default:
                                  total = 1;
                              }
                              
                              const percentage = Math.round((value / total) * 100);
                              return `${label}: ${value} of ${total} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No difficulty data available
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Skill Assessment */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Skill Assessment" 
              subheader={submissionStats ? `Level: ${submissionStats.skillLevel}` : 'Problem solving performance metrics'}
            />
            <Divider />
            <CardContent>
              <Box p={2}>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Problem Solving</Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={submissionStats?.skillScore || 0}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 5 }}
                        color={getProgressColor(submissionStats?.skillScore || 0)}
                      />
                      <Typography variant="body2" ml={1} minWidth="36px">
                        {submissionStats?.skillScore || 0}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Consistency</Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={submissionStats?.consistencyScore || 0}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 5 }}
                        color={getProgressColor(submissionStats?.consistencyScore || 0)}
                      />
                      <Typography variant="body2" ml={1} minWidth="36px">
                        {submissionStats?.consistencyScore || 0}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Easy Problems</Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={submissionStats?.difficulty.easy.rate || 0}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 5 }}
                        color="success"
                      />
                      <Typography variant="body2" ml={1} minWidth="36px">
                        {submissionStats?.difficulty.easy.rate || 0}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Medium Problems</Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={submissionStats?.difficulty.medium.rate || 0}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 5 }}
                        color="warning"
                      />
                      <Typography variant="body2" ml={1} minWidth="36px">
                        {submissionStats?.difficulty.medium.rate || 0}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Hard Problems</Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={submissionStats?.difficulty.hard.rate || 0}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 5 }}
                        color="error"
                      />
                      <Typography variant="body2" ml={1} minWidth="36px">
                        {submissionStats?.difficulty.hard.rate || 0}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Acceptance Rate</Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={lcData?.acceptanceRate || 0}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 5 }}
                        color={getProgressColor(lcData?.acceptanceRate || 0)}
                      />
                      <Typography variant="body2" ml={1} minWidth="36px">
                        {lcData?.acceptanceRate || 0}%
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Box mt={3} textAlign="center">
                  <Typography variant="body2" color="textSecondary" mb={1}>Overall Skill Assessment</Typography>
                  <Box 
                    sx={{ 
                      display: 'flex',
                      height: 24,
                      width: '100%',
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: `${submissionStats?.difficulty.easy.rate || 0}%`, 
                        bgcolor: 'success.main',
                        transition: 'width 1s ease-in-out'
                      }}
                    />
                    <Box 
                      sx={{ 
                        width: `${submissionStats?.difficulty.medium.rate || 0}%`, 
                        bgcolor: 'warning.main',
                        transition: 'width 1s ease-in-out'
                      }}
                    />
                    <Box 
                      sx={{ 
                        width: `${submissionStats?.difficulty.hard.rate || 0}%`, 
                        bgcolor: 'error.main',
                        transition: 'width 1s ease-in-out'
                      }}
                    />
                  </Box>
                  <Typography variant="h5" mt={2} fontWeight="medium">
                    {submissionStats?.skillLevel || 'Beginner'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Problem Category Summary */}
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="Problem Categories" 
          subheader="LeetCode organizes problems into categories to help you focus your practice"
        />
        <Divider />
        <CardContent sx={{ pt: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell align="center">Recommended for</TableCell>
                  <TableCell align="center">Your Progress</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { 
                    name: 'Top Interview Questions', 
                    description: 'Most common questions asked in interviews',
                    level: 'All levels',
                    progress: Math.min(80, Math.round((lcData?.totalSolved || 0) / 5))
                  },
                  { 
                    name: 'Dynamic Programming', 
                    description: 'Problems requiring optimal substructure',
                    level: 'Intermediate & Advanced',
                    progress: Math.min(65, Math.round((lcData?.mediumSolved || 0) / 3) + (lcData?.hardSolved || 0))
                  },
                  { 
                    name: 'Array & String', 
                    description: 'Fundamental data structure problems',
                    level: 'Beginners',
                    progress: Math.min(90, Math.round(((lcData?.easySolved || 0) / 2) + 15))
                  },
                  { 
                    name: 'Graph & Tree', 
                    description: 'Problems involving nodes and edges',
                    level: 'Intermediate',
                    progress: Math.min(75, Math.round((lcData?.mediumSolved || 0) / 2))
                  },
                  { 
                    name: 'Database Problems', 
                    description: 'SQL query challenges',
                    level: 'All levels',
                    progress: Math.min(50, Math.round((lcData?.totalSolved || 0) / 8))
                  }
                ].map((category, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {category.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {category.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={category.level}
                        size="small"
                        color={
                          category.level === 'Beginners' ? 'success' :
                          category.level === 'Intermediate' ? 'warning' :
                          category.level === 'Advanced' ? 'error' : 'primary'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center">
                        <LinearProgress 
                          variant="determinate" 
                          value={category.progress}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 5 }}
                          color={getProgressColor(category.progress)}
                        />
                        <Typography variant="body2" ml={1}>
                          {category.progress}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Button 
                        variant="text" 
                        color="primary"
                        size="small"
                        href={`https://leetcode.com/problemset/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                        target="_blank"
                        rel="noopener"
                      >
                        Practice
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader 
          title="Recommended Next Steps" 
          subheader="Tailored suggestions to improve your skills"
        />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            {[
              {
                title: "Practice Medium Difficulty",
                description: `You've solved ${lcData?.mediumSolved || 0} medium problems. Try to solve more to improve your problem-solving skills.`,
                improvement: "Technical interview readiness",
                actionText: "Solve Mediums",
                actionUrl: "https://leetcode.com/problemset/all/?difficulty=MEDIUM",
                priority: (lcData?.easySolved || 0) > 20 && (lcData?.mediumSolved || 0) < 50 ? 'high' : 'medium'
              },
              {
                title: "Improve Consistency",
                description: `Your current streak is ${submissionCalendarData?.streak?.current || 0} days. Try to maintain a longer streak for consistent improvement.`,
                improvement: "Coding discipline and habit formation",
                actionText: "Daily Challenge",
                actionUrl: "https://leetcode.com/problemset/all/",
                priority: (submissionCalendarData?.streak?.current || 0) < 7 ? 'high' : 'low'
              },
              {
                title: "Challenge Yourself",
                description: `You've only solved ${lcData?.hardSolved || 0} hard problems. Attempt more hard problems to build advanced skills.`,
                improvement: "Algorithm mastery and optimization techniques",
                actionText: "Try Hard Problems",
                actionUrl: "https://leetcode.com/problemset/all/?difficulty=HARD",
                priority: (lcData?.mediumSolved || 0) > 30 && (lcData?.hardSolved || 0) < 10 ? 'high' : 'medium'
              },
              {
                title: "Focus on Fundamentals",
                description: `Master the basics with more easy problems. You have solved ${lcData?.easySolved || 0} out of ${lcData?.totalEasy || 0}.`,
                improvement: "Solidify core programming concepts",
                actionText: "Easy Problems",
                actionUrl: "https://leetcode.com/problemset/all/?difficulty=EASY",
                priority: (lcData?.easySolved || 0) < 30 ? 'high' : 'low'
              }
            ]
              .sort((a, b) => {
                const priorityMap = { high: 3, medium: 2, low: 1 };
                return priorityMap[b.priority] - priorityMap[a.priority];
              })
              .slice(0, 3)
              .map((recommendation, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      height: '100%',
                      borderLeft: '4px solid',
                      borderLeftColor: 
                        recommendation.priority === 'high' ? 'error.main' : 
                        recommendation.priority === 'medium' ? 'warning.main' : 
                        'success.main'
                    }}
                  >
                    <CardContent>
                      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" component="h3">
                          {recommendation.title}
                        </Typography>
                        <Chip 
                          label={recommendation.priority.toUpperCase()} 
                          color={
                            recommendation.priority === 'high' ? 'error' : 
                            recommendation.priority === 'medium' ? 'warning' : 
                            'success'
                          }
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" paragraph>
                        {recommendation.description}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        <strong>Improves:</strong> {recommendation.improvement}
                      </Typography>
                      <Button
                        variant="contained"
                        color={
                          recommendation.priority === 'high' ? 'error' : 
                          recommendation.priority === 'medium' ? 'warning' : 
                          'success'
                        }
                        size="small"
                        href={recommendation.actionUrl}
                        target="_blank"
                        rel="noopener"
                        sx={{ mt: 1 }}
                      >
                        {recommendation.actionText}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            }
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default LeetCodeDashboard;