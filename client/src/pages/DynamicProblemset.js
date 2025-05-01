import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Button, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, IconButton, Tooltip, CircularProgress, Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LaunchIcon from '@mui/icons-material/Launch';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import questionService from '../services/questionService';

const DynamicProblemset = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fetch dynamic problemset
  const fetchDynamicProblemset = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await questionService.getDynamicProblemset();
      setProblems(data.problemset);
      
      if (data.refreshResult && data.refreshResult.refreshed) {
        setSuccess(`Your dynamic problemset was automatically updated with ${data.refreshResult.added || 0} new problems.`);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 5000);
      }
    } catch (err) {
      setError('Failed to load your dynamic problemset. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDynamicProblemset();
  }, []);

  // Manually refresh the problemset
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const result = await questionService.refreshDynamicProblemset();
      
      // Fetch the updated problemset
      await fetchDynamicProblemset();
      
      setSuccess('Your dynamic problemset was refreshed successfully.');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      setError('Failed to refresh your dynamic problemset. Please try again later.');
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  // Toggle solved status
  const handleToggleSolved = async (problem) => {
    try {
      const { platform_id, question_id, solved } = problem;
      
      if (solved) {
        await questionService.markQuestionAsUnsolved(platform_id, question_id);
      } else {
        await questionService.markQuestionAsSolved(platform_id, question_id);
      }
      
      // Update the local state
      setProblems(prevProblems => 
        prevProblems.map(p => 
          p.platform_id === platform_id && p.question_id === question_id 
            ? { ...p, solved: !solved } 
            : p
        )
      );
    } catch (err) {
      setError('Failed to update solved status. Please try again.');
      console.error(err);
    }
  };

  // Remove from dynamic problemset
  const handleRemove = async (problem) => {
    try {
      const { platform_id, question_id } = problem;
      
      await questionService.removeFromDynamicProblemset(platform_id, question_id);
      
      // Update the local state
      setProblems(prevProblems => 
        prevProblems.filter(p => 
          !(p.platform_id === platform_id && p.question_id === question_id)
        )
      );
      
      setSuccess('Problem removed from your dynamic problemset.');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err) {
      setError('Failed to remove problem. Please try again.');
      console.error(err);
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
        return 'success.main';
      case 'MEDIUM':
        return 'warning.main';
      case 'HARD':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Dynamic Problemset
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={refreshing ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          Refresh Problemset
        </Button>
      </Box>

      <Typography variant="body1" paragraph>
        This is your personalized dynamic problemset that contains problems solved by your friends and other recommended problems. 
        The list automatically updates as your friends solve more problems.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {problems.length > 0 ? (
        <Paper sx={{ width: '100%', mb: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="60px"><Typography variant="subtitle1" fontWeight="bold">Solved</Typography></TableCell>
                  <TableCell width="50%"><Typography variant="subtitle1" fontWeight="bold">Question</Typography></TableCell>
                  <TableCell><Typography variant="subtitle1" fontWeight="bold">Platform</Typography></TableCell>
                  <TableCell><Typography variant="subtitle1" fontWeight="bold">Difficulty</Typography></TableCell>
                  <TableCell><Typography variant="subtitle1" fontWeight="bold">Topics</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle1" fontWeight="bold">Actions</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {problems
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((problem) => (
                    <TableRow
                      key={`${problem.platform_id}-${problem.question_id}`}
                      sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                    >
                      <TableCell>
                        <IconButton 
                          onClick={() => handleToggleSolved(problem)} 
                          color={problem.solved ? "success" : "default"}
                        >
                          {problem.solved ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1">
                          {problem.title || problem.question_id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {problem.question_id}
                        </Typography>
                      </TableCell>
                      <TableCell>{problem.platform_name}</TableCell>
                      <TableCell>
                        <Typography style={{ color: getDifficultyColor(problem.difficulty) }}>
                          {problem.difficulty || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {problem.topics && problem.topics.length > 0 ? (
                            problem.topics.slice(0, 3).map((topic) => (
                              <Typography 
                                key={topic} 
                                variant="caption" 
                                sx={{ 
                                  padding: '2px 8px', 
                                  borderRadius: 1, 
                                  bgcolor: 'primary.light', 
                                  color: 'white',
                                  mr: 0.5, 
                                  mb: 0.5 
                                }}
                              >
                                {topic}
                              </Typography>
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">—</Typography>
                          )}
                          {problem.topics && problem.topics.length > 3 && (
                            <Typography variant="caption" color="text.secondary">
                              +{problem.topics.length - 3} more
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {problem.link && (
                            <Tooltip title="Open question">
                              <IconButton 
                                size="small" 
                                href={problem.link}
                                target="_blank"
                                color="primary"
                              >
                                <LaunchIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Remove from problemset">
                            <IconButton 
                              size="small" 
                              onClick={() => handleRemove(problem)}
                              color="error"
                              sx={{ ml: 1 }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={problems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      ) : (
        <Alert severity="info">
          Your dynamic problemset is empty. Add some friends to see problems they have solved, or refresh to see some recommended problems.
        </Alert>
      )}
    </Container>
  );
};

export default DynamicProblemset;