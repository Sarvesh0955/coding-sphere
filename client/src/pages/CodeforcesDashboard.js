import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Grid, Paper, Typography, Box, CircularProgress, Divider, Card, CardContent, CardHeader, 
  Alert, Button, Avatar, Chip, Link as MuiLink, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { 
  Code as CodeIcon, 
  TrendingUp as TrendingUpIcon,
  EmojiEvents as EmojiEventsIcon,
  BarChart as BarChartIcon,
  Tag as TagIcon,
  Timeline as TimelineIcon,
  DoneAll as DoneAllIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Bar, Line, Radar } from 'react-chartjs-2';
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

const CodeforcesDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cfAccount, setCfAccount] = useState(null);
  const [cfData, setCfData] = useState(null);
  const [problemStats, setProblemStats] = useState(null);
  const [ratingHistory, setRatingHistory] = useState(null);
  
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
        const cfAcc = response.data.accounts.find(account => 
          account.platform_name.toLowerCase() === 'codeforces'
        );
        
        if (cfAcc) {
          setCfAccount(cfAcc);
          fetchCodeforcesData(cfAcc.platform_username);
        } else {
          setError("No Codeforces account found. Please add a Codeforces account in your profile.");
          setLoading(false);
        }
      } else {
        setError("No accounts found. Please add a Codeforces account in your profile.");
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching user accounts:', err);
      setError('Failed to fetch your coding platform accounts.');
      setLoading(false);
    }
  };

  const fetchCodeforcesData = async (username) => {
    try {
      const response = await axios.get(`/api/profile/codeforces/${username}`);
      setCfData(response.data);
      
      // Process and organize the data
      if (response.data.submissions && response.data.submissions.result) {
        processProblemStats(response.data.submissions.result);
      }
      
      if (response.data.ratings && response.data.ratings.result) {
        processRatingHistory(response.data.ratings.result);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching Codeforces data:', err);
      setError('Failed to fetch Codeforces statistics.');
      setLoading(false);
    }
  };

  const processProblemStats = (submissions) => {
    // Extract unique solved problems
    const uniqueProblems = new Map();
    const uniqueAccepted = new Set();
    const uniqueAttempted = new Set();
    const verdictCounts = {};
    const languageCounts = {};
    const difficultyLevels = Array(35).fill(0);  // For ratings 800-4000
    const tagCounts = {};
    let totalSubmissions = submissions.length;
    
    submissions.forEach(submission => {
      const problemKey = `${submission.problem.contestId}-${submission.problem.index}`;
      
      // Count submissions by language
      const lang = submission.programmingLanguage;
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
      
      // Count submissions by verdict
      const verdict = submission.verdict;
      verdictCounts[verdict] = (verdictCounts[verdict] || 0) + 1;
      
      // Track attempted and accepted problems
      uniqueAttempted.add(problemKey);
      if (verdict === "OK") {
        uniqueAccepted.add(problemKey);
      }
      
      // Only process each problem once for tags and rating
      if (!uniqueProblems.has(problemKey) && verdict === "OK") {
        uniqueProblems.set(problemKey, submission.problem);
        
        // Process tags
        if (submission.problem.tags) {
          submission.problem.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
        
        // Process difficulty level
        if (submission.problem.rating) {
          const index = Math.floor((submission.problem.rating - 800) / 100);
          if (index >= 0 && index < difficultyLevels.length) {
            difficultyLevels[index]++;
          }
        }
      }
    });
    
    // Calculate acceptance rate
    const acceptanceRate = verdictCounts["OK"] ? 
      ((verdictCounts["OK"] / totalSubmissions) * 100).toFixed(1) : 0;
    
    // Sort languages by usage
    const topLanguages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Sort tags by frequency
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    // Processing for heatmap (submissions by day)
    const submissionsByDay = {};
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    submissions.forEach(submission => {
      const date = new Date(submission.creationTimeSeconds * 1000);
      if (date >= oneYearAgo) {
        const dateStr = date.toISOString().split('T')[0];
        submissionsByDay[dateStr] = (submissionsByDay[dateStr] || 0) + 1;
      }
    });
    
    setProblemStats({
      uniqueProblems: uniqueProblems.size,
      uniqueAccepted: uniqueAccepted.size,
      uniqueAttempted: uniqueAttempted.size,
      verdictCounts,
      languageCounts,
      difficultyLevels,
      topLanguages,
      topTags,
      acceptanceRate,
      submissionsByDay,
      totalSubmissions
    });
  };

  const processRatingHistory = (ratings) => {
    // Sort ratings by time
    const sortedRatings = [...ratings].sort((a, b) => a.ratingUpdateTimeSeconds - b.ratingUpdateTimeSeconds);
    
    const ratingTimeline = sortedRatings.map(contest => ({
      contestName: contest.contestName,
      rank: contest.rank,
      oldRating: contest.oldRating,
      newRating: contest.newRating,
      date: new Date(contest.ratingUpdateTimeSeconds * 1000),
      ratingChange: contest.newRating - contest.oldRating
    }));
    
    // Calculate best and worst performances
    const bestContest = sortedRatings.reduce((best, current) => {
      const currentChange = current.newRating - current.oldRating;
      const bestChange = best ? best.newRating - best.oldRating : -Infinity;
      return currentChange > bestChange ? current : best;
    }, null);
    
    const worstContest = sortedRatings.reduce((worst, current) => {
      const currentChange = current.newRating - current.oldRating;
      const worstChange = worst ? worst.newRating - worst.oldRating : Infinity;
      return currentChange < worstChange ? current : worst;
    }, null);
    
    setRatingHistory({
      timeline: ratingTimeline,
      bestContest,
      worstContest,
      contestCount: sortedRatings.length,
      maxRating: Math.max(...sortedRatings.map(r => r.newRating)),
      minRating: Math.min(...sortedRatings.map(r => r.oldRating > 0 ? r.oldRating : r.newRating)),
      currentRating: sortedRatings.length > 0 ? sortedRatings[sortedRatings.length - 1].newRating : 0
    });
  };

  // Helper function to generate color for Codeforces rating
  const getRatingColor = (rating) => {
    if (!rating) return '#a0a0a0';
    
    if (rating < 1200) return '#a0a0a0'; // Newbie
    if (rating < 1400) return '#4CAF50'; // Pupil
    if (rating < 1600) return '#03A9F4'; // Specialist
    if (rating < 1900) return '#2196F3'; // Expert
    if (rating < 2100) return '#9C27B0'; // Candidate Master
    if (rating < 2400) return '#FF9800'; // Master
    if (rating < 2600) return '#FF5722'; // International Master
    if (rating < 3000) return '#f44336'; // Grandmaster
    return '#f44336'; // Legendary Grandmaster
  };

  const getRatingText = (rating) => {
    if (!rating) return 'Unrated';
    
    if (rating < 1200) return 'Newbie';
    if (rating < 1400) return 'Pupil';
    if (rating < 1600) return 'Specialist';
    if (rating < 1900) return 'Expert';
    if (rating < 2100) return 'Candidate Master';
    if (rating < 2400) return 'Master';
    if (rating < 2600) return 'International Master';
    if (rating < 3000) return 'Grandmaster';
    return 'Legendary Grandmaster';
  };

  // Chart data generation functions
  const generateRatingChartData = () => {
    if (!ratingHistory || !ratingHistory.timeline) return null;
    
    return {
      labels: ratingHistory.timeline.map(item => item.contestName),
      datasets: [
        {
          label: 'Rating',
          data: ratingHistory.timeline.map(item => item.newRating),
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.2)',
          fill: true,
          tension: 0.1,
        }
      ]
    };
  };

  const generateVerdictChartData = () => {
    if (!problemStats || !problemStats.verdictCounts) return null;
    
    const labels = [];
    const data = [];
    const colors = [];
    
    // Map verdict keys to readable labels and assign colors
    const verdictMap = {
      "OK": { label: "Accepted", color: "#4CAF50" },
      "WRONG_ANSWER": { label: "Wrong Answer", color: "#F44336" },
      "TIME_LIMIT_EXCEEDED": { label: "Time Limit", color: "#FF9800" },
      "MEMORY_LIMIT_EXCEEDED": { label: "Memory Limit", color: "#9C27B0" },
      "RUNTIME_ERROR": { label: "Runtime Error", color: "#2196F3" },
      "COMPILATION_ERROR": { label: "Compilation Error", color: "#607D8B" },
      "SKIPPED": { label: "Skipped", color: "#795548" },
      "CHALLENGED": { label: "Challenged", color: "#E91E63" },
      "PRESENTATION_ERROR": { label: "Presentation Error", color: "#673AB7" },
      "IDLENESS_LIMIT_EXCEEDED": { label: "Idleness Limit", color: "#FFEB3B" }
    };
    
    Object.entries(problemStats.verdictCounts).forEach(([verdict, count]) => {
      const mappedVerdict = verdictMap[verdict] || { label: verdict, color: "#9E9E9E" };
      labels.push(mappedVerdict.label);
      data.push(count);
      colors.push(mappedVerdict.color);
    });
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 1,
        }
      ]
    };
  };

  const generateTagsChartData = () => {
    if (!problemStats || !problemStats.topTags) return null;
    
    return {
      labels: problemStats.topTags.map(([tag]) => tag),
      datasets: [
        {
          label: 'Problems per Tag',
          data: problemStats.topTags.map(([_, count]) => count),
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  const generateLanguagesChartData = () => {
    if (!problemStats || !problemStats.topLanguages) return null;
    
    return {
      labels: problemStats.topLanguages.map(([lang]) => lang),
      datasets: [
        {
          data: problemStats.topLanguages.map(([_, count]) => count),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ],
          borderWidth: 1,
        }
      ]
    };
  };

  const generateDifficultyChartData = () => {
    if (!problemStats || !problemStats.difficultyLevels) return null;
    
    const labels = [];
    for (let i = 0; i < problemStats.difficultyLevels.length; i++) {
      if (problemStats.difficultyLevels[i] > 0) {
        labels.push(`${800 + i * 100}`);
      }
    }
    
    const data = problemStats.difficultyLevels.filter(count => count > 0);
    
    return {
      labels,
      datasets: [
        {
          label: 'Problems Solved',
          data,
          backgroundColor: labels.map(rating => getRatingColor(parseInt(rating))),
          borderWidth: 1,
          borderRadius: 5,
        }
      ]
    };
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
          Please login to view your Codeforces dashboard.
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

  // Error state (no Codeforces account)
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
          background: `linear-gradient(45deg, ${getRatingColor(ratingHistory?.currentRating)} 30%, #2196F3 90%)`,
          color: 'white'
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center">
              {cfData?.userInfo?.result?.[0]?.titlePhoto && (
                <Avatar 
                  src={cfData.userInfo.result[0].titlePhoto} 
                  alt={cfAccount.platform_username}
                  sx={{ width: 80, height: 80, mr: 2 }}
                />
              )}
              <Box>
                <Typography variant="h4">
                  {cfAccount.platform_username}
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {cfData?.userInfo?.result?.[0]?.rating ? (
                    <Chip 
                      label={`${cfData.userInfo.result[0].rating} (${getRatingText(cfData.userInfo.result[0].rating)})`}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  ) : (
                    <Chip label="Unrated" sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white' }} />
                  )}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box textAlign="right">
              <Typography variant="body2">
                {cfData?.userInfo?.result?.[0]?.city && cfData?.userInfo?.result?.[0]?.country && (
                  <span>
                    {cfData.userInfo.result[0].city}, {cfData.userInfo.result[0].country}
                  </span>
                )}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {cfData?.userInfo?.result?.[0]?.organization && (
                  <span>
                    {cfData.userInfo.result[0].organization}
                  </span>
                )}
              </Typography>
              <Box mt={2}>
                <MuiLink 
                  href={`https://codeforces.com/profile/${cfAccount.platform_username}`}
                  target="_blank"
                  rel="noopener"
                  sx={{ color: 'white', textDecoration: 'underline' }}
                >
                  View on Codeforces
                </MuiLink>
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
                  <DoneAllIcon color="primary" />
                </Box>
              </Box>
              <Box mt={3}>
                <Typography variant="h3">{problemStats?.uniqueAccepted || 0}</Typography>
                <Typography variant="body2" color="textSecondary">unique problems</Typography>
              </Box>
              <Box mt={2} display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Attempted</Typography>
                <Typography variant="body2" fontWeight="medium">{problemStats?.uniqueAttempted || 0}</Typography>
              </Box>
              <Box mt={1} display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Accuracy</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {problemStats ? 
                    `${(problemStats.uniqueAccepted / problemStats.uniqueAttempted * 100).toFixed(1)}%` : 
                    '-'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Contest Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" component="h3">Contest Stats</Typography>
                <Box sx={{ bgcolor: 'orange.50', borderRadius: '50%', p: 1 }}>
                  <EmojiEventsIcon sx={{ color: 'orange' }} />
                </Box>
              </Box>
              <Box mt={3}>
                <Typography variant="h3">{ratingHistory?.contestCount || 0}</Typography>
                <Typography variant="body2" color="textSecondary">contests participated</Typography>
              </Box>
              <Box mt={2} display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Max Rating</Typography>
                <Typography variant="body2" fontWeight="medium">{ratingHistory?.maxRating || '-'}</Typography>
              </Box>
              <Box mt={1} display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Best Rank</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {ratingHistory?.timeline ? 
                    Math.min(...ratingHistory.timeline.map(c => c.rank)) : '-'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Submissions */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" component="h3">Submissions</Typography>
                <Box sx={{ bgcolor: 'green.50', borderRadius: '50%', p: 1 }}>
                  <BarChartIcon color="success" />
                </Box>
              </Box>
              <Box mt={3}>
                <Typography variant="h3">{problemStats?.totalSubmissions || 0}</Typography>
                <Typography variant="body2" color="textSecondary">total submissions</Typography>
              </Box>
              <Box mt={2} display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Acceptance</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {problemStats?.verdictCounts?.OK ? 
                    `${problemStats.verdictCounts.OK} (${problemStats.acceptanceRate}%)` : '0 (0%)'}
                </Typography>
              </Box>
              <Box mt={1} display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Languages</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {problemStats?.topLanguages?.length || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Rating */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" component="h3">Current Rating</Typography>
                <Box sx={{ borderRadius: '50%', p: 1 }} style={{ backgroundColor: `rgba(${getRatingColor(ratingHistory?.currentRating || 0).replace(/[^\d,]/g, '')}, 0.2)` }}>
                  <SchoolIcon sx={{ color: getRatingColor(ratingHistory?.currentRating || 0) }} />
                </Box>
              </Box>
              <Box mt={3}>
                <Typography variant="h3" sx={{ color: getRatingColor(ratingHistory?.currentRating || 0) }}>
                  {ratingHistory?.currentRating || '-'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {getRatingText(ratingHistory?.currentRating)}
                </Typography>
              </Box>
              <Box mt={2} display="flex" justifyContent="space-between">
                <Typography variant="body2" color="textSecondary">Last Change</Typography>
                {ratingHistory?.timeline && ratingHistory.timeline.length > 0 && (
                  <Typography 
                    variant="body2" 
                    fontWeight="medium" 
                    color={ratingHistory.timeline[ratingHistory.timeline.length-1].ratingChange >= 0 ? 'success.main' : 'error.main'}
                  >
                    {ratingHistory.timeline[ratingHistory.timeline.length-1].ratingChange > 0 ? '+' : ''}
                    {ratingHistory.timeline[ratingHistory.timeline.length-1].ratingChange}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Rating History Chart */}
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="Rating History" 
          subheader={`${ratingHistory?.contestCount || 0} contests participated`}
          action={
            <Chip 
              label={`Max: ${ratingHistory?.maxRating || 0}`} 
              color="primary"
              size="small" 
            />
          }
        />
        <Divider />
        <CardContent>
          <Box height={400}>
            {ratingHistory?.timeline && ratingHistory.timeline.length > 0 ? (
              <Line 
                data={generateRatingChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      display: false
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        title: function(tooltipItems) {
                          const idx = tooltipItems[0].dataIndex;
                          return ratingHistory.timeline[idx].contestName;
                        },
                        label: function(tooltipItem) {
                          const idx = tooltipItem.dataIndex;
                          const item = ratingHistory.timeline[idx];
                          return [
                            `Rating: ${item.newRating}`,
                            `Change: ${item.ratingChange > 0 ? '+' : ''}${item.ratingChange}`,
                            `Rank: ${item.rank}`,
                            `Date: ${item.date.toLocaleDateString()}`
                          ];
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography variant="body2" color="textSecondary">
                  No contest history available
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Problem Statistics & Verdicts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Problem Difficulty Distribution" 
              subheader="Problems solved by difficulty rating"
            />
            <Divider />
            <CardContent>
              <Box height={300}>
                {problemStats?.difficultyLevels ? (
                  <Bar 
                    data={generateDifficultyChartData()}
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
                      No problem difficulty data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Verdict Distribution" />
            <Divider />
            <CardContent>
              <Box height={300} display="flex" justifyContent="center" alignItems="center">
                {problemStats?.verdictCounts ? (
                  <Pie
                    data={generateVerdictChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.formattedValue;
                              const total = problemStats.totalSubmissions;
                              const percentage = ((context.raw / total) * 100).toFixed(1);
                              return `${label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No verdict data available
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tags & Languages */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Problem Tags" 
              subheader="Distribution of problems solved by topic"
              action={
                <Chip 
                  icon={<TagIcon />} 
                  label={`${problemStats?.topTags?.length || 0} tags`} 
                  size="small" 
                  color="primary"
                />
              }
            />
            <Divider />
            <CardContent>
              <Box height={300}>
                {problemStats?.topTags && problemStats.topTags.length > 0 ? (
                  <Bar 
                    data={generateTagsChartData()}
                    options={{
                      indexAxis: 'y',
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        x: {
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
                      No tag data available
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Programming Languages" />
            <Divider />
            <CardContent>
              <Box height={300} display="flex" justifyContent="center" alignItems="center">
                {problemStats?.topLanguages && problemStats.topLanguages.length > 0 ? (
                  <Pie
                    data={generateLanguagesChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.formattedValue;
                              const total = problemStats.totalSubmissions;
                              const percentage = ((context.raw / total) * 100).toFixed(1);
                              return `${label}: ${value} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No language data available
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Best & Worst Contests */}
      {ratingHistory?.bestContest && ratingHistory?.worstContest && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader 
                title="Best Performance" 
                sx={{ bgcolor: 'success.light', color: 'white' }}
              />
              <CardContent>
                <Typography variant="h6">
                  {ratingHistory.bestContest.contestName}
                </Typography>
                <Box mt={2} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Rating Change</Typography>
                  <Typography variant="body1" fontWeight="medium" color="success.main">
                    +{ratingHistory.bestContest.newRating - ratingHistory.bestContest.oldRating}
                  </Typography>
                </Box>
                <Box mt={1} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">New Rating</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {ratingHistory.bestContest.newRating}
                  </Typography>
                </Box>
                <Box mt={1} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Rank</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {ratingHistory.bestContest.rank}
                  </Typography>
                </Box>
                <Box mt={1} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Date</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {new Date(ratingHistory.bestContest.ratingUpdateTimeSeconds * 1000).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader 
                title="Worst Performance" 
                sx={{ bgcolor: 'error.light', color: 'white' }}
              />
              <CardContent>
                <Typography variant="h6">
                  {ratingHistory.worstContest.contestName}
                </Typography>
                <Box mt={2} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Rating Change</Typography>
                  <Typography variant="body1" fontWeight="medium" color="error.main">
                    {ratingHistory.worstContest.newRating - ratingHistory.worstContest.oldRating}
                  </Typography>
                </Box>
                <Box mt={1} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">New Rating</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {ratingHistory.worstContest.newRating}
                  </Typography>
                </Box>
                <Box mt={1} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Rank</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {ratingHistory.worstContest.rank}
                  </Typography>
                </Box>
                <Box mt={1} display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Date</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {new Date(ratingHistory.worstContest.ratingUpdateTimeSeconds * 1000).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Recent Contests */}
      {ratingHistory?.timeline && ratingHistory.timeline.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardHeader 
            title="Recent Contests" 
            subheader="Your last 5 contest performances"
          />
          <Divider />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Contest</TableCell>
                  <TableCell align="center">Rank</TableCell>
                  <TableCell align="center">Old Rating</TableCell>
                  <TableCell align="center">New Rating</TableCell>
                  <TableCell align="center">Change</TableCell>
                  <TableCell align="right">Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ratingHistory.timeline.slice(-5).reverse().map((contest, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <MuiLink 
                        href={`https://codeforces.com/contest/${contest.contestId}`}
                        target="_blank"
                        rel="noopener"
                        sx={{ textDecoration: 'none' }}
                      >
                        {contest.contestName}
                      </MuiLink>
                    </TableCell>
                    <TableCell align="center">{contest.rank}</TableCell>
                    <TableCell align="center">{contest.oldRating}</TableCell>
                    <TableCell align="center">{contest.newRating}</TableCell>
                    <TableCell align="center">
                      <Typography 
                        variant="body2" 
                        color={contest.ratingChange >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {contest.ratingChange > 0 ? '+' : ''}
                        {contest.ratingChange}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {contest.date.toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Container>
  );
};

export default CodeforcesDashboard;