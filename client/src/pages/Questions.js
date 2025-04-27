import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, TextField, Grid, Card, CardContent, 
  Button, Select, MenuItem, FormControl, InputLabel, Chip,
  Dialog, DialogActions, DialogContent, DialogTitle, 
  FormControlLabel, Checkbox, IconButton, Divider,
  Paper, InputAdornment, CircularProgress, Alert,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate } from 'react-router-dom';
import questionService from '../services/questionService';
import { getUserFromToken, getToken } from '../services/authService';

const Questions = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [topics, setTopics] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  
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
  
  // Filter questions based on search term, topic, and company
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = !searchTerm || 
      question.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.question_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesTopic = !selectedTopic || 
      (question.topics && question.topics.includes(selectedTopic));
      
    const matchesCompany = !selectedCompany || 
      (question.companies && question.companies.includes(selectedCompany));
      
    return matchesSearch && matchesTopic && matchesCompany;
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
          
          <Grid item xs={6} sm={1}>
            {isAuthenticated && (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => handleOpen('add')}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Questions List */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : filteredQuestions.length > 0 ? (
        <Grid container spacing={3}>
          {filteredQuestions.map((question) => (
            <Grid item xs={12} md={6} lg={4} key={`${question.platform_id}-${question.question_id}`}>
              <Card 
                elevation={3} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 6
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      component="h2" 
                      gutterBottom
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        flexGrow: 1,
                        mr: 1
                      }}
                    >
                      {question.title}
                    </Typography>
                    
                    <Chip 
                      label={question.difficulty || 'Unknown'} 
                      size="small"
                      sx={{ 
                        color: 'white',
                        backgroundColor: getDifficultyColor(question.difficulty),
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Platform: {question.platform_name}
                  </Typography>
                  
                  {question.topics && question.topics.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {question.topics.map((topic) => (
                        <Chip 
                          key={topic} 
                          label={topic} 
                          size="small" 
                          variant="outlined"
                          color="primary"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  )}
                  
                  {question.companies && question.companies.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Companies: {question.companies.join(', ')}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
                  {question.link && (
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      href={question.link}
                      target="_blank"
                      sx={{ mr: 1 }}
                    >
                      Open
                    </Button>
                  )}
                  
                  {isAuthenticated && (
                    <>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpen('edit', question)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(question)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
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