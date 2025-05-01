import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, TextField, Grid, 
  Button, Select, MenuItem, FormControl, InputLabel, Chip,
  Dialog, DialogActions, DialogContent, DialogTitle, 
  Paper, InputAdornment, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Link, IconButton, Tooltip, Checkbox
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import LaunchIcon from '@mui/icons-material/Launch';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import questionService from '../services/questionService';
import { getUserFromToken, getToken } from '../services/authService';

const Questions = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [topics, setTopics] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [showSolvedOnly, setShowSolvedOnly] = useState(false);
  
  // Add/Edit Question Dialog
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    platformId: '',
    title: '',
    link: '',
    difficulty: '',
    topics: [],
    companies: []
  });
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  
  // New Company State
  const [newCompany, setNewCompany] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);
  const [companyError, setCompanyError] = useState('');

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const token = getToken();
      const user = token ? getUserFromToken() : null;
      setIsAuthenticated(!!user);
      
      // Check if user is an admin
      if (user) {
        setIsAdmin(user.is_admin === true);
      }
    };
    
    // Load questions and filter options
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch questions, topics, companies, and platforms in parallel
        const [questionsData, topicsData, companiesData, platformsData] = await Promise.all([
          questionService.getAllQuestions(),
          questionService.getAllTopics(),
          questionService.getAllCompanies(),
          questionService.getAllPlatforms()
        ]);
        
        setQuestions(questionsData);
        setTopics(topicsData);
        setCompanies(companiesData);
        setPlatforms(platformsData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load questions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    loadData();
  }, []);
  
  // Filter questions based on search term, topic, company, and solved status
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = !searchTerm || 
      question.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.question_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesTopic = !selectedTopic || 
      (question.topics && question.topics.includes(selectedTopic));
      
    const matchesCompany = !selectedCompany || 
      (question.companies && question.companies.includes(selectedCompany));
    
    const matchesSolvedFilter = !showSolvedOnly || question.solved;
      
    return matchesSearch && matchesTopic && matchesCompany && matchesSolvedFilter;
  });
  
  // Handle filter changes
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleTopicChange = (e) => setSelectedTopic(e.target.value);
  const handleCompanyChange = (e) => setSelectedCompany(e.target.value);
  
  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTopic('');
    setSelectedCompany('');
  };
  
  // Form handlers for add/edit dialog
  const handleOpen = (mode = 'add', question = null) => {
    setDialogMode(mode);
    
    if (mode === 'add') {
      setFormData({
        platformId: platforms[0]?.platform_id || '',
        title: '',
        link: '',
        difficulty: 'Medium',
        topics: [],
        companies: []
      });
      setSelectedTopics([]);
      setSelectedCompanies([]);
    } else if (mode === 'edit' && question) {
      setFormData({
        platformId: question.platform_id,
        questionId: question.question_id,
        title: question.title || '',
        link: question.link || '',
        difficulty: question.difficulty || 'Medium',
        topics: question.topics || [],
        companies: question.companies || []
      });
      setSelectedTopics(question.topics || []);
      setSelectedCompanies(question.companies || []);
    }
    
    setOpen(true);
  };
  
  const handleClose = () => setOpen(false);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleTopicSelect = (topic) => {
    if (!selectedTopics.includes(topic)) {
      setSelectedTopics([...selectedTopics, topic]);
      setFormData({
        ...formData,
        topics: [...selectedTopics, topic]
      });
    }
  };
  
  const handleTopicDelete = (topicToDelete) => {
    const newSelectedTopics = selectedTopics.filter(topic => topic !== topicToDelete);
    setSelectedTopics(newSelectedTopics);
    setFormData({
      ...formData,
      topics: newSelectedTopics
    });
  };
  
  const handleAddNewTopic = () => {
    if (newTopic && !selectedTopics.includes(newTopic)) {
      const updatedTopics = [...selectedTopics, newTopic];
      setSelectedTopics(updatedTopics);
      setFormData({
        ...formData,
        topics: updatedTopics
      });
      setNewTopic('');
    }
  };
  
  const handleCompanySelect = (e) => {
    const companyId = parseInt(e.target.value);
    const companyName = companies.find(c => c.company_id === companyId)?.company_name;
    
    if (companyName && !selectedCompanies.includes(companyName)) {
      setSelectedCompanies([...selectedCompanies, companyName]);
      setFormData({
        ...formData,
        companies: [...(formData.companies || []), companyId]
      });
    }
  };
  
  const handleCompanyDelete = (companyToDelete) => {
    const newSelectedCompanies = selectedCompanies.filter(c => c !== companyToDelete);
    const companyToDeleteId = companies.find(c => c.company_name === companyToDelete)?.company_id;
    
    setSelectedCompanies(newSelectedCompanies);
    setFormData({
      ...formData,
      companies: formData.companies.filter(id => id !== companyToDeleteId)
    });
  };
  
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (dialogMode === 'add') {
        await questionService.createQuestion(formData);
      } else if (dialogMode === 'edit') {
        await questionService.updateQuestion(
          formData.platformId,
          formData.questionId,
          formData
        );
      }
      
      // Refresh the questions list and all data
      const [updatedQuestions, updatedTopics] = await Promise.all([
        questionService.getAllQuestions(),
        questionService.getAllTopics()
      ]);
      
      setQuestions(updatedQuestions);
      setTopics(updatedTopics);
      
      handleClose();
    } catch (err) {
      console.error('Error saving question:', err);
      setError('Failed to save question. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (question) => {
    if (window.confirm(`Are you sure you want to delete "${question.title}"?`)) {
      try {
        setLoading(true);
        await questionService.deleteQuestion(question.platform_id, question.question_id);
        
        // Refresh the questions list and topics
        const [updatedQuestions, updatedTopics] = await Promise.all([
          questionService.getAllQuestions(),
          questionService.getAllTopics()
        ]);
        
        setQuestions(updatedQuestions);
        setTopics(updatedTopics);
      } catch (err) {
        console.error('Error deleting question:', err);
        setError('Failed to delete question. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'success.main';
      case 'Medium': return 'warning.main';
      case 'Hard': return 'error.main';
      default: return 'text.primary';
    }
  };
  
  // Add a new company to the database
  const handleAddNewCompany = async () => {
    if (!newCompany) return;
    
    try {
      setAddingCompany(true);
      setCompanyError('');
      
      const result = await questionService.createCompany(newCompany);
      
      // If the company was newly created or already existed, add it to the companies list
      const companyData = result.company;
      
      // Check if company is already in the list
      const companyExists = companies.some(c => c.company_id === companyData.company_id);
      
      if (!companyExists) {
        // Add the new company to the companies list
        setCompanies([...companies, companyData]);
      }
      
      // Add company to the selected companies
      if (!selectedCompanies.includes(companyData.company_name)) {
        setSelectedCompanies([...selectedCompanies, companyData.company_name]);
        setFormData({
          ...formData,
          companies: [...(formData.companies || []), companyData.company_id]
        });
      }
      
      // Reset the newCompany input
      setNewCompany('');
    } catch (err) {
      console.error('Error creating company:', err);
      setCompanyError('Failed to create company. Please try again.');
    } finally {
      setAddingCompany(false);
    }
  };

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

  // Toggle solved status for a question
  const handleToggleSolved = async (question) => {
    if (!isAuthenticated) {
      // If not authenticated, prompt to login
      navigate('/login');
      return;
    }
    
    try {
      const { platform_id, question_id, solved } = question;
      
      if (solved) {
        // If already solved, mark as unsolved
        await questionService.markQuestionAsUnsolved(platform_id, question_id);
      } else {
        // If not solved, mark as solved
        await questionService.markQuestionAsSolved(platform_id, question_id);
      }
      
      // Update local state
      setQuestions(prev => prev.map(q => 
        q.platform_id === platform_id && q.question_id === question_id 
          ? { ...q, solved: !solved } 
          : q
      ));
    } catch (err) {
      console.error('Error toggling solved status:', err);
      setError('Failed to update solved status. Please try again.');
    }
  };
  
  // Toggle to show only solved questions
  const handleToggleSolvedFilter = () => {
    setShowSolvedOnly(!showSolvedOnly);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Coding Questions
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Filter Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Search Questions"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="topic-filter-label">Filter by Topic</InputLabel>
              <Select
                labelId="topic-filter-label"
                label="Filter by Topic"
                value={selectedTopic}
                onChange={handleTopicChange}
              >
                <MenuItem value="">All Topics</MenuItem>
                {topics.map((topic) => (
                  <MenuItem key={topic} value={topic}>
                    {topic}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="company-filter-label">Filter by Company</InputLabel>
              <Select
                labelId="company-filter-label"
                label="Filter by Company"
                value={selectedCompany}
                onChange={handleCompanyChange}
              >
                <MenuItem value="">All Companies</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.company_id} value={company.company_name}>
                    {company.company_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} sm={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearFilters}
              startIcon={<FilterListIcon />}
            >
              Clear
            </Button>
          </Grid>
          
          {isAuthenticated && (
            <Grid item xs={6} sm={1}>
              <Button
                fullWidth
                variant={showSolvedOnly ? "contained" : "outlined"}
                color="success"
                onClick={handleToggleSolvedFilter}
                startIcon={showSolvedOnly ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
              >
                Solved
              </Button>
            </Grid>
          )}
          
          {isAdmin && (
            <Grid item xs={12} sm={12} textAlign="right">
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpen('add')}
              >
                Add Question
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {/* Questions List - Table View */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : filteredQuestions.length > 0 ? (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
            <Table stickyHeader aria-label="coding questions table">
              <TableHead>
                <TableRow>
                  {isAuthenticated && (
                    <TableCell width="60px"><Typography variant="subtitle1" fontWeight="bold">Solved</Typography></TableCell>
                  )}
                  <TableCell width="50%"><Typography variant="subtitle1" fontWeight="bold">Question</Typography></TableCell>
                  <TableCell><Typography variant="subtitle1" fontWeight="bold">Platform</Typography></TableCell>
                  <TableCell><Typography variant="subtitle1" fontWeight="bold">Difficulty</Typography></TableCell>
                  <TableCell><Typography variant="subtitle1" fontWeight="bold">Topics</Typography></TableCell>
                  <TableCell><Typography variant="subtitle1" fontWeight="bold">Companies</Typography></TableCell>
                  <TableCell align="right"><Typography variant="subtitle1" fontWeight="bold">Actions</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredQuestions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((question) => (
                    <TableRow
                      key={`${question.platform_id}-${question.question_id}`}
                      sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                    >
                      {isAuthenticated && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            icon={<CheckCircleOutlineIcon />}
                            checkedIcon={<CheckCircleIcon />}
                            checked={!!question.solved}
                            onChange={() => handleToggleSolved(question)}
                            color="success"
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {question.title}
                        </Typography>
                      </TableCell>
                      <TableCell>{question.platform_name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={question.difficulty || 'Unknown'} 
                          size="small"
                          sx={{ 
                            color: 'white',
                            backgroundColor: getDifficultyColor(question.difficulty),
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {question.topics && question.topics.length > 0 ? (
                            question.topics.map((topic) => (
                              <Chip 
                                key={topic} 
                                label={topic} 
                                size="small" 
                                variant="outlined"
                                color="primary"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">—</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {question.companies && question.companies.length > 0 ? (
                          <Typography variant="body2">
                            {question.companies.join(', ')}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {question.link && (
                            <Tooltip title="Open question">
                              <IconButton 
                                size="small" 
                                href={question.link}
                                target="_blank"
                                color="primary"
                              >
                                <LaunchIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {isAdmin && (
                            <>
                              <Tooltip title="Edit question">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleOpen('edit', question)}
                                  color="primary"
                                  sx={{ ml: 1 }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete question">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDelete(question)}
                                  color="error"
                                  sx={{ ml: 1 }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredQuestions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      ) : (
        <Box textAlign="center" py={4}>
          <Typography variant="h6">No questions found matching your filters.</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={clearFilters}
            sx={{ mt: 2 }}
          >
            Clear Filters
          </Button>
        </Box>
      )}
      
      {/* Add/Edit Question Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Question' : 'Edit Question'}
        </DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="platform-select-label">Platform</InputLabel>
                <Select
                  labelId="platform-select-label"
                  name="platformId"
                  value={formData.platformId}
                  onChange={handleInputChange}
                  label="Platform"
                  disabled={dialogMode === 'edit'}
                >
                  {platforms.map((platform) => (
                    <MenuItem key={platform.platform_id} value={platform.platform_id}>
                      {platform.platform_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="difficulty-select-label">Difficulty</InputLabel>
                <Select
                  labelId="difficulty-select-label"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  label="Difficulty"
                  required
                >
                  <MenuItem value="Easy">Easy</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="normal"
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="normal"
                label="Link"
                name="link"
                value={formData.link}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Topics
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {selectedTopics.map((topic) => (
                  <Chip
                    key={topic}
                    label={topic}
                    onDelete={() => handleTopicDelete(topic)}
                    color="primary"
                  />
                ))}
              </Box>
              
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel id="topic-select-label">Add Existing Topic</InputLabel>
                    <Select
                      labelId="topic-select-label"
                      label="Add Existing Topic"
                      value=""
                      onChange={(e) => handleTopicSelect(e.target.value)}
                    >
                      {topics
                        .filter(topic => !selectedTopics.includes(topic))
                        .map((topic) => (
                          <MenuItem key={topic} value={topic}>
                            {topic}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={8} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Add New Topic"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={4} sm={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleAddNewTopic}
                    disabled={!newTopic}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Companies
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {selectedCompanies.map((company) => (
                  <Chip
                    key={company}
                    label={company}
                    onDelete={() => handleCompanyDelete(company)}
                    color="secondary"
                  />
                ))}
              </Box>
              
              {/* Add Company Section */}
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6} mb={2}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel id="company-select-label">Add Existing Company</InputLabel>
                    <Select
                      labelId="company-select-label"
                      label="Add Existing Company"
                      value=""
                      onChange={handleCompanySelect}
                    >
                      {companies
                        .filter(company => !selectedCompanies.includes(company.company_name))
                        .map((company) => (
                          <MenuItem key={company.company_id} value={company.company_id}>
                            {company.company_name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={8} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Add New Company"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    error={!!companyError}
                    helperText={companyError}
                  />
                </Grid>
                
                <Grid item xs={4} sm={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleAddNewCompany}
                    disabled={!newCompany || addingCompany}
                    color="secondary"
                  >
                    {addingCompany ? <CircularProgress size={24} /> : 'Add'}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Questions;