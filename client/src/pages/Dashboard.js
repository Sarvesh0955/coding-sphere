import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Grid, Paper, Typography, Box, Tabs, Tab, 
  CircularProgress, Divider, Card, CardContent, CardHeader, 
  LinearProgress, Alert, Button, Avatar
} from '@mui/material';
import { 
  Code as CodeIcon, 
  CheckCircle as CheckCircleIcon, 
  PieChart as PieChartIcon, 
  CalendarToday as CalendarTodayIcon,
  TrendingUp as TrendingUpIcon,
  BugReport as BugReportIcon,
  Timer as TimerIcon,
  Bolt as BoltIcon,
  EmojiEvents as EmojiEventsIcon
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
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

const Dashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAccounts, setUserAccounts] = useState([]);
  const [cfData, setCfData] = useState(null);
  const [lcData, setLcData] = useState(null);
  const [combinedData, setCombinedData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [recentActivity, setRecentActivity] = useState(null);
  
  useEffect(() => {
    // Only fetch data if user is logged in
    if (user && user.username) {
      fetchUserAccounts();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Fetch platform data after getting user accounts
    if (userAccounts && userAccounts.length > 0) {
      fetchPlatformStats();
    }
  }, [userAccounts]);

  const fetchUserAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/profile/accounts', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data && response.data.accounts) {
        setUserAccounts(response.data.accounts);
      } else {
        setUserAccounts([]);
      }
    } catch (err) {
      console.error('Error fetching user accounts:', err);
      setError('Failed to fetch your coding platform accounts.');
    }
  };

  const fetchPlatformStats = async () => {
    try {
      // Find Codeforces account
      const cfAccount = userAccounts.find(account => 
        account.platform_name.toLowerCase() === 'codeforces'
      );
      
      // Find LeetCode account
      const lcAccount = userAccounts.find(account => 
        account.platform_name.toLowerCase() === 'leetcode'
      );

      // Fetch Codeforces data if account exists
      if (cfAccount) {
        const cfResponse = await axios.get(`/api/profile/codeforces/${cfAccount.platform_username}`);
        setCfData(cfResponse.data);
        
        // Extract recent activity data
        if (cfResponse.data.submissions && cfResponse.data.submissions.result) {
          const submissions = cfResponse.data.submissions.result;
          // Get last 30 days of submissions
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const recentSubs = submissions
            .filter(sub => new Date(sub.creationTimeSeconds * 1000) >= thirtyDaysAgo)
            .sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds);
            
          setRecentActivity({
            submissions: recentSubs.slice(0, 10), // Last 10 submissions
            platform: 'codeforces'
          });
        }
      }

      // Fetch LeetCode data if account exists
      if (lcAccount) {
        const lcResponse = await axios.get(`/api/profile/leetcode/${lcAccount.platform_username}`);
        setLcData(lcResponse.data);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching platform stats:', err);
      setError('Failed to fetch statistics from coding platforms.');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Combine data when either platform data changes
    if (cfData || lcData) {
      const combined = prepareCombinedData(cfData, lcData);
      setCombinedData(combined);
    }
  }, [cfData, lcData]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const prepareCombinedData = (cfData, lcData) => {
    // Calculate total problems solved
    const cfSolved = cfData ? calculateCFSolvedProblems(cfData) : 0;
    const lcSolved = lcData?.totalSolved || 0;
    const totalSolved = cfSolved + lcSolved;

    // Calculate percentages
    const cfPercent = totalSolved > 0 ? Math.round((cfSolved / totalSolved) * 100) : 0;
    const lcPercent = totalSolved > 0 ? Math.round((lcSolved / totalSolved) * 100) : 0;

    // Difficulty data (LeetCode has this explicitly, for CF we need to estimate from ratings)
    let easyCount = lcData ? lcData.easySolved : 0;
    let mediumCount = lcData ? lcData.mediumSolved : 0;
    let hardCount = lcData ? lcData.hardSolved : 0;

    // For Codeforces, categorize problems by rating into difficulty levels
    if (cfData && cfData.submissions && cfData.submissions.result) {
      const uniqueProblems = new Map();
      
      cfData.submissions.result.forEach(submission => {
        if (submission.verdict === "OK" && submission.problem && submission.problem.rating) {
          const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
          
          if (!uniqueProblems.has(problemKey)) {
            uniqueProblems.set(problemKey, submission.problem.rating);
            
            // Categorize by rating
            if (submission.problem.rating < 1400) {
              easyCount++;
            } else if (submission.problem.rating < 2000) {
              mediumCount++;
            } else {
              hardCount++;
            }
          }
        }
      });
    }

    // Calculate activity data (submissions per day for last 7 days)
    const activityData = calculateActivityData(cfData, lcData);

    // Calculate streak (consecutive days with at least one submission)
    const streak = calculateCurrentStreak(cfData, lcData);

    // Calculate average difficulty trend
    const difficultyTrend = calculateDifficultyTrend(cfData, lcData);

    return {
      totalSolved,
      cfSolved,
      lcSolved,
      cfPercent,
      lcPercent,
      difficulty: {
        easy: easyCount,
        medium: mediumCount,
        hard: hardCount
      },
      activityData,
      streak,
      difficultyTrend
    };
  };

  const calculateDifficultyTrend = (cfData, lcData) => {
    const difficultyByTime = [];
    const today = new Date();
    
    // Get CF submissions with difficulty ratings
    if (cfData && cfData.submissions && cfData.submissions.result) {
      cfData.submissions.result.forEach(sub => {
        if (sub.verdict === "OK" && sub.problem?.rating) {
          const date = new Date(sub.creationTimeSeconds * 1000);
          const daysAgo = Math.floor((today - date) / (1000 * 60 * 60 * 24));
          
          if (daysAgo <= 90) { // Last 90 days
            difficultyByTime.push({
              days: daysAgo,
              difficulty: sub.problem.rating
            });
          }
        }
      });
    }
    
    // Group by week and calculate average
    const weeklyAvg = Array(13).fill(0); // 13 weeks (90 days)
    const weeklyCount = Array(13).fill(0);
    
    difficultyByTime.forEach(item => {
      const weekIndex = Math.floor(item.days / 7);
      if (weekIndex < 13) {
        weeklyAvg[weekIndex] += item.difficulty;
        weeklyCount[weekIndex]++;
      }
    });
    
    // Calculate averages
    for (let i = 0; i < 13; i++) {
      if (weeklyCount[i] > 0) {
        weeklyAvg[i] = Math.round(weeklyAvg[i] / weeklyCount[i]);
      }
    }
    
    return weeklyAvg.reverse();
  };

  const calculateCurrentStreak = (cfData, lcData) => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all submission timestamps and group by day
    const submissionDays = new Set();
    
    // Add Codeforces submissions
    if (cfData && cfData.submissions && cfData.submissions.result) {
      cfData.submissions.result.forEach(submission => {
        const date = new Date(submission.creationTimeSeconds * 1000);
        date.setHours(0, 0, 0, 0);
        submissionDays.add(date.getTime());
      });
    }
    
    // Add LeetCode submissions
    if (lcData && lcData.submissionCalendar) {
      Object.keys(lcData.submissionCalendar).forEach(timestamp => {
        const date = new Date(parseInt(timestamp) * 1000);
        date.setHours(0, 0, 0, 0);
        submissionDays.add(date.getTime());
      });
    }
    
    // Convert to array and sort
    const sortedDays = Array.from(submissionDays).sort((a, b) => b - a);
    
    // Calculate current streak
    if (sortedDays.length > 0) {
      // Check if today has submissions
      const oneDayMs = 24 * 60 * 60 * 1000;
      let currentDay = today.getTime();
      let dayIndex = 0;
      
      // If today doesn't have submission but yesterday does, start from yesterday
      if (sortedDays[0] < currentDay && sortedDays[0] >= currentDay - oneDayMs) {
        currentDay = sortedDays[0];
      }
      
      while (sortedDays[dayIndex] !== undefined) {
        if (currentDay - sortedDays[dayIndex] <= oneDayMs) {
          streak++;
          currentDay -= oneDayMs;
          // Find next day's submission
          while (dayIndex < sortedDays.length && sortedDays[dayIndex] > currentDay) {
            dayIndex++;
          }
        } else {
          break;
        }
      }
    }
    
    return streak;
  };

  const calculateActivityData = (cfData, lcData) => {
    // Create a map for the last 7 days
    const activityMap = {};
    const daysLabels = [];
    const submissionCounts = [];
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayKey = date.getTime();
      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      activityMap[dayKey] = 0;
      daysLabels.push(dayLabel);
    }
    
    // Add Codeforces submissions
    if (cfData && cfData.submissions && cfData.submissions.result) {
      cfData.submissions.result.forEach(submission => {
        const date = new Date(submission.creationTimeSeconds * 1000);
        date.setHours(0, 0, 0, 0);
        const dayKey = date.getTime();
        
        if (activityMap[dayKey] !== undefined) {
          activityMap[dayKey]++;
        }
      });
    }
    
    // Add LeetCode submissions
    if (lcData && lcData.submissionCalendar) {
      Object.entries(lcData.submissionCalendar).forEach(([timestamp, count]) => {
        const date = new Date(parseInt(timestamp) * 1000);
        date.setHours(0, 0, 0, 0);
        const dayKey = date.getTime();
        
        if (activityMap[dayKey] !== undefined) {
          activityMap[dayKey] += parseInt(count);
        }
      });
    }
    
    // Convert to array for chart
    Object.keys(activityMap).sort().forEach(key => {
      submissionCounts.push(activityMap[key]);
    });
    
    return {
      labels: daysLabels,
      data: submissionCounts
    };
  };

  const calculateCFSolvedProblems = (cfData) => {
    if (!cfData || !cfData.submissions || !cfData.submissions.result) {
      return 0;
    }
    
    // Extract unique solved problems
    const uniqueSolved = new Set();
    cfData.submissions.result.forEach(submission => {
      if (submission.verdict === "OK") {
        const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
        uniqueSolved.add(problemKey);
      }
    });
    
    return uniqueSolved.size;
  };

  const calculateCFTopicsDistribution = (cfData) => {
    if (!cfData || !cfData.submissions || !cfData.submissions.result) {
      return { labels: [], data: [] };
    }
    
    // Count problems by tag
    const tagCounts = {};
    const uniqueProblems = new Set();
    
    cfData.submissions.result.forEach(submission => {
      if (submission.verdict === "OK") {
        const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
        
        if (!uniqueProblems.has(problemKey) && submission.problem.tags) {
          uniqueProblems.add(problemKey);
          
          submission.problem.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      }
    });
    
    // Sort tags by count and take top 8
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
      
    return {
      labels: sortedTags.map(([tag]) => tag),
      data: sortedTags.map(([_, count]) => count)
    };
  };

  // Generate chart data for platform distribution
  const platformChartData = {
    labels: ['Codeforces', 'LeetCode'],
    datasets: [
      {
        data: [combinedData?.cfSolved || 0, combinedData?.lcSolved || 0],
        backgroundColor: ['#4285F4', '#9C27B0'],
        borderWidth: 1,
      },
    ],
  };

  // Generate chart data for difficulty distribution
  const difficultyChartData = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [
      {
        data: [
          combinedData?.difficulty.easy || 0,
          combinedData?.difficulty.medium || 0,
          combinedData?.difficulty.hard || 0,
        ],
        backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
        borderWidth: 1,
      },
    ],
  };

  // Create chart data for activity
  const generateActivityChartData = () => {
    return {
      labels: combinedData?.activityData?.labels || [],
      datasets: [
        {
          label: 'Submissions',
          data: combinedData?.activityData?.data || [],
          backgroundColor: '#3f51b5',
          borderColor: '#3f51b5',
          borderWidth: 1,
          borderRadius: 5,
        },
      ],
    };
  };

  // Create chart data for difficulty trend
  const generateDifficultyTrendData = () => {
    const lastThreeMonths = [];
    for (let i = 12; i >= 0; i--) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - i);
      lastThreeMonths.push(date.toLocaleDateString('en-US', { month: 'short' }));
    }
    
    return {
      labels: lastThreeMonths,
      datasets: [
        {
          label: 'Average Difficulty',
          data: combinedData?.difficultyTrend || Array(13).fill(0),
          borderColor: '#ff9800',
          backgroundColor: 'rgba(255, 152, 0, 0.2)',
          fill: true,
          tension: 0.4,
        }
      ]
    };
  };

  // Create chart data for topic distribution
  const generateTopicDistributionData = () => {
    const topicsData = calculateCFTopicsDistribution(cfData);
    
    return {
      labels: topicsData.labels,
      datasets: [
        {
          data: topicsData.data,
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#8CC24A', '#EA526F'
          ],
          borderWidth: 1,
        }
      ]
    };
  };

  // Helper function to get Codeforces color class based on rating
  const getCodeforcesColorClass = (rating) => {
    if (!rating) return 'text-gray-600';
    
    if (rating < 1200) return 'text-gray-600'; // Newbie
    if (rating < 1400) return 'text-success'; // Pupil
    if (rating < 1600) return 'text-info'; // Specialist
    if (rating < 1900) return 'text-primary'; // Expert
    if (rating < 2100) return 'text-violet-600'; // Candidate Master
    if (rating < 2400) return 'text-warning'; // Master
    if (rating < 2600) return 'text-orange-600'; // International Master
    if (rating < 3000) return 'text-danger'; // Grandmaster
    return 'text-danger fw-bold'; // Legendary Grandmaster
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
          Please login to view your coding profile dashboard.
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

  // No accounts state
  if (!loading && userAccounts.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert 
          severity="warning"
          action={
            <Button color="inherit" size="small" component={Link} to="/profile">
              Add Accounts
            </Button>
          }
        >
          You haven't connected any coding platform accounts yet. Please add your accounts in your profile.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Platform Selection Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="platform tabs">
          <Tab label="Combined Stats" />
        </Tabs>
      </Box>

      {/* Combined Stats Tab */}
      {activeTab === 0 && combinedData && (
        <>
          {/* User Summary Card */}
          <Paper 
            sx={{ 
              p: 3, 
              mb: 4, 
              background: 'linear-gradient(45deg, #4285F4 30%, #9C27B0 90%)',
              color: 'white'
            }}
          >
            <Box display="flex" alignItems="center" mb={3}>
              <Avatar 
                alt={user.username} 
                src={user.profilePic} 
                sx={{ width: 64, height: 64, mr: 2 }}
              />
              <Box>
                <Typography variant="h4">{user.firstName || user.username}</Typography>
                <Typography variant="subtitle1">
                  {userAccounts.length} Connected Platforms
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={4}>
              {/* Codeforces Summary */}
              {cfData && (
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                    <Box display="flex" alignItems="center">
                      <Box 
                        sx={{ 
                          bgcolor: 'white', 
                          borderRadius: '50%', 
                          p: 1, 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CodeIcon sx={{ color: '#4285F4' }} />
                      </Box>
                      <Box ml={2}>
                        <Typography variant="h6">
                          {userAccounts.find(a => a.platform_name.toLowerCase() === 'codeforces')?.platform_username || '-'}
                        </Typography>
                        <Typography variant="body2">Codeforces</Typography>
                      </Box>
                    </Box>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      <Grid item xs={4} textAlign="center">
                        <Typography variant="h6" className={getCodeforcesColorClass(cfData.userInfo?.result?.[0]?.rating)}>
                          {cfData.userInfo?.result?.[0]?.rating || '-'}
                        </Typography>
                        <Typography variant="caption">Rating</Typography>
                      </Grid>
                      <Grid item xs={4} textAlign="center">
                        <Typography variant="h6">
                          {cfData.userInfo?.result?.[0]?.rank || '-'}
                        </Typography>
                        <Typography variant="caption">Rank</Typography>
                      </Grid>
                      <Grid item xs={4} textAlign="center">
                        <Typography variant="h6">
                          {combinedData.cfSolved}
                        </Typography>
                        <Typography variant="caption">Problems</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}
              
              {/* LeetCode Summary */}
              {lcData && (
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                    <Box display="flex" alignItems="center">
                      <Box 
                        sx={{ 
                          bgcolor: 'white', 
                          borderRadius: '50%', 
                          p: 1, 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CodeIcon sx={{ color: '#9C27B0' }} />
                      </Box>
                      <Box ml={2}>
                        <Typography variant="h6">
                          {userAccounts.find(a => a.platform_name.toLowerCase() === 'leetcode')?.platform_username || '-'}
                        </Typography>
                        <Typography variant="body2">LeetCode</Typography>
                      </Box>
                      {/* Add LeetCode Profile Link */}
                      <Box ml="auto">
                        <Button 
                          variant="outlined" 
                          size="small" 
                          href={userAccounts.find(a => a.platform_name.toLowerCase() === 'leetcode')?.profile_url || `https://leetcode.com/${userAccounts.find(a => a.platform_name.toLowerCase() === 'leetcode')?.platform_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ 
                            color: 'white',
                            borderColor: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              borderColor: 'white'
                            }
                          }}
                        >
                          Visit Profile
                        </Button>
                      </Box>
                    </Box>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      <Grid item xs={4} textAlign="center">
                        <Typography variant="h6">
                          {lcData.totalSolved || '-'}
                        </Typography>
                        <Typography variant="caption">Solved</Typography>
                      </Grid>
                      <Grid item xs={4} textAlign="center">
                        <Typography variant="h6">
                          {lcData.ranking ? `#${lcData.ranking}` : '-'}
                        </Typography>
                        <Typography variant="caption">Ranking</Typography>
                      </Grid>
                      <Grid item xs={4} textAlign="center">
                        <Typography variant="h6">
                          {lcData.acceptanceRate ? `${lcData.acceptanceRate}%` : '-'}
                        </Typography>
                        <Typography variant="caption">Acceptance</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Stats Cards Row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Total Problems Solved */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="h3">Problems Solved</Typography>
                    <Box sx={{ bgcolor: 'blue.50', borderRadius: '50%', p: 1 }}>
                      <CheckCircleIcon color="primary" />
                    </Box>
                  </Box>
                  <Box mt={3}>
                    <Typography variant="h3">{combinedData.totalSolved}</Typography>
                    <Typography variant="body2" color="textSecondary">across all platforms</Typography>
                  </Box>

                  <Box mt={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center">
                        <Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#4285F4', mr: 1 }} />
                        <Typography variant="body2">CF</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="medium">{combinedData.cfSolved}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <Box display="flex" alignItems="center">
                        <Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#9C27B0', mr: 1 }} />
                        <Typography variant="body2">LC</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="medium">{combinedData.lcSolved}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Current Streak */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="h3">Current Streak</Typography>
                    <Box sx={{ bgcolor: 'orange.50', borderRadius: '50%', p: 1 }}>
                      <BoltIcon sx={{ color: 'orange' }} />
                    </Box>
                  </Box>
                  <Box mt={3}>
                    <Typography variant="h3">{combinedData.streak || 0}</Typography>
                    <Typography variant="body2" color="textSecondary">consecutive days coding</Typography>
                  </Box>
                  <Box mt={2}>
                    <Typography variant="body2">
                      {combinedData.streak > 0 
                        ? `Keep up the momentum! You've been coding for ${combinedData.streak} days in a row.` 
                        : "Start solving problems today to build your streak!"}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Recent Activity */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="h3">This Week</Typography>
                    <Box sx={{ bgcolor: 'indigo.50', borderRadius: '50%', p: 1 }}>
                      <CalendarTodayIcon sx={{ color: 'indigo' }} />
                    </Box>
                  </Box>
                  <Box mt={3}>
                    <Typography variant="h3">
                      {combinedData.activityData?.data?.reduce((a, b) => a + b, 0) || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">submissions in last 7 days</Typography>
                  </Box>
                  <Box mt={2}>
                    <Bar 
                      data={generateActivityChartData()} 
                      options={{ 
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: { grid: { display: false } },
                          y: { 
                            grid: { display: false },
                            ticks: { precision: 0 }
                          }
                        }
                      }} 
                      height={60} 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Contest Achievement */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" component="h3">Best Contest</Typography>
                    <Box sx={{ bgcolor: 'yellow.50', borderRadius: '50%', p: 1 }}>
                      <EmojiEventsIcon sx={{ color: 'gold' }} />
                    </Box>
                  </Box>
                  <Box mt={3}>
                    {cfData && cfData.ratings && cfData.ratings.result && cfData.ratings.result.length > 0 ? (
                      <>
                        <Typography variant="h3">
                          {Math.min(...cfData.ratings.result.map(r => r.rank))}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">best rank in Codeforces</Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="h3">-</Typography>
                        <Typography variant="body2" color="textSecondary">no contest data available</Typography>
                      </>
                    )}
                  </Box>
                  <Box mt={2}>
                    {cfData && cfData.ratings && cfData.ratings.result && cfData.ratings.result.length > 0 && (
                      <Typography variant="body2">
                        Participated in {cfData.ratings.result.length} contests
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts Row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Topic Distribution Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Problem Topics" 
                  subheader="Distribution of topics you've solved"
                />
                <Divider />
                <CardContent>
                  <Box height={300} display="flex" justifyContent="center" alignItems="center">
                    <Box width="90%" height="90%">
                      {cfData ? (
                        <Pie 
                          data={generateTopicDistributionData()}
                          options={{
                            plugins: {
                              legend: {
                                position: 'right',
                                labels: {
                                  boxWidth: 15,
                                  font: { size: 10 }
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary" align="center">
                          No Codeforces data available
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Difficulty Trend Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Difficulty Progression" 
                  subheader="Weekly average problem difficulty"
                />
                <Divider />
                <CardContent>
                  <Box height={300}>
                    {cfData ? (
                      <Line 
                        data={generateDifficultyTrendData()}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false }
                          },
                          scales: {
                            y: {
                              min: 800,
                              ticks: {
                                callback: function(value) {
                                  if (value === 0) return '';
                                  return value;
                                }
                              }
                            }
                          }
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="textSecondary" align="center">
                        No Codeforces data available
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Platform Comparison & Difficulty Distribution */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Platform Comparison" />
                <Divider />
                <CardContent>
                  <Box height={300} display="flex" justifyContent="center" alignItems="center">
                    <Box width="80%" height="80%">
                      <Pie data={platformChartData} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Difficulty Distribution" />
                <Divider />
                <CardContent>
                  <Box height={300} display="flex" justifyContent="center" alignItems="center">
                    <Box width="80%" height="80%">
                      <Pie data={difficultyChartData} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Activity */}
          {recentActivity && (
            <Card sx={{ mb: 4 }}>
              <CardHeader 
                title="Recent Activity" 
                subheader="Your latest problem submissions"
              />
              <Divider />
              <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                <CardContent>
                  {recentActivity.submissions.length > 0 ? (
                    <Grid container spacing={2}>
                      {recentActivity.submissions.map((sub, index) => (
                        <Grid item xs={12} key={index}>
                          <Paper 
                            sx={{ 
                              p: 2,
                              borderLeft: '4px solid',
                              borderLeftColor: sub.verdict === 'OK' ? '#4caf50' : '#f44336'
                            }}
                            variant="outlined"
                          >
                            <Grid container spacing={1}>
                              <Grid item xs={12} sm={8}>
                                <Typography variant="subtitle1" fontWeight="medium">
                                  {sub.problem.name}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {sub.problem.contestId}-{sub.problem.index} • {sub.problem.tags?.join(', ')}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={4} textAlign={{ sm: 'right' }}>
                                <Typography 
                                  variant="body2" 
                                  color={sub.verdict === 'OK' ? 'success.main' : 'error.main'}
                                  fontWeight="medium"
                                >
                                  {sub.verdict}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {new Date(sub.creationTimeSeconds * 1000).toLocaleDateString()}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="textSecondary" align="center">
                      No recent submissions found
                    </Typography>
                  )}
                </CardContent>
              </Box>
            </Card>
          )}
        </>
      )}

      {/* Codeforces Tab */}
      {activeTab === 1 && cfData && (
        <Box component={Link} to="/codeforces" sx={{ textDecoration: 'none' }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" mb={3}>
              View detailed Codeforces statistics
            </Typography>
            <Button variant="contained" color="primary">
              Go to Codeforces Dashboard
            </Button>
          </Paper>
        </Box>
      )}

      {/* LeetCode Tab */}
      {activeTab === 2 && lcData && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="LeetCode Statistics" />
              <Divider />
              <CardContent>
                <Box>
                  {[
                    { label: 'Username', value: userAccounts.find(a => a.platform_name.toLowerCase() === 'leetcode')?.platform_username || '-' },
                    { label: 'Total Solved', value: lcData.totalSolved || '-' },
                    { label: 'Total Questions', value: lcData.totalQuestions || '-' },
                    { label: 'Easy Solved', value: `${lcData.easySolved || '-'} / ${lcData.totalEasy || '-'}` },
                    { label: 'Medium Solved', value: `${lcData.mediumSolved || '-'} / ${lcData.totalMedium || '-'}` },
                    { label: 'Hard Solved', value: `${lcData.hardSolved || '-'} / ${lcData.totalHard || '-'}` },
                    { label: 'Acceptance Rate', value: lcData.acceptanceRate ? `${lcData.acceptanceRate}%` : '-' },
                    { label: 'Ranking', value: lcData.ranking ? `#${lcData.ranking}` : '-' },
                  ].map((item, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <Divider />}
                      <Box py={1.5} display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">{item.label}</Typography>
                        <Typography variant="body1" fontWeight="medium">{item.value}</Typography>
                      </Box>
                    </React.Fragment>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Problem Difficulty" />
              <Divider />
              <CardContent>
                <Box height={300} display="flex" justifyContent="center" alignItems="center">
                  <Pie
                    data={{
                      labels: ['Easy', 'Medium', 'Hard'],
                      datasets: [{
                        data: [lcData.easySolved, lcData.mediumSolved, lcData.hardSolved],
                        backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
                      }]
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Recent Submissions" />
              <Divider />
              <CardContent>
                <Typography variant="body2" color="textSecondary" align="center">
                  Submission calendar would be displayed here using the submissionCalendar data
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard;