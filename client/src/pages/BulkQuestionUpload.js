import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, Paper, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress, Grid, Dialog, DialogTitle, DialogContent, DialogActions, ToggleButtonGroup, ToggleButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import questionService from '../services/questionService';

const BulkQuestionUpload = () => {
  const [fileData, setFileData] = useState('');
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ success: null, message: '' });
  // New state for company dialog and input
  const [openAddCompany, setOpenAddCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);
  // New state for file format and preview
  const [fileFormat, setFileFormat] = useState('json');
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [previewData, setPreviewData] = useState([]);

  useEffect(() => {
    // Fetch companies when component mounts
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const companiesData = await questionService.getAllCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleFormatChange = (event, newFormat) => {
    if (newFormat !== null) {
      setFileFormat(newFormat);
      // Clear previous file data when changing format
      setFileData('');
      setParsedData(null);
      setPreviewData([]);
      setFileName('');
    }
  };

  // File input handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target.result;
      setFileData(content);
      
      try {
        if (fileFormat === 'json') {
          const jsonData = JSON.parse(content);
          setParsedData(jsonData);
          setPreviewData(jsonData.slice(0, 5)); // Preview first 5 items
        } else if (fileFormat === 'csv') {
          const parsedCSV = parseCSV(content);
          setParsedData(parsedCSV);
          setPreviewData(parsedCSV.slice(0, 5)); // Preview first 5 items
        }
        setResult({ success: null, message: '' });
      } catch (error) {
        setResult({ 
          success: false, 
          message: `Error parsing ${fileFormat.toUpperCase()} file: ${error.message}` 
        });
        setParsedData(null);
        setPreviewData([]);
      }
    };
    
    reader.onerror = () => {
      setResult({ 
        success: false, 
        message: 'Error reading file' 
      });
    };
    
    reader.readAsText(file);
  };

  // Parse CSV content to array of question objects
  const parseCSV = (csvContent) => {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    
    // Validate required headers
    const requiredHeaders = ['platformId', 'questionId', 'title', 'link'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }
    
    return lines.slice(1)
      .filter(line => line.trim() !== '')
      .map(line => {
        const values = line.split(',').map(val => val.trim());
        const question = {};
        
        headers.forEach((header, index) => {
          if (header === 'topics') {
            // Handle topics as an array
            question[header] = values[index] ? values[index].split(';').map(t => t.trim()) : [];
          } else if (header === 'platformId') {
            // Ensure platformId is a number
            question[header] = parseInt(values[index], 10);
          } else {
            question[header] = values[index];
          }
        });
        
        return question;
      });
  };

  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
  };

  // Handlers for adding a new company
  const handleAddCompanyOpen = () => {
    setOpenAddCompany(true);
  };

  const handleAddCompanyClose = () => {
    setOpenAddCompany(false);
    setNewCompanyName('');
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    
    setAddingCompany(true);
    try {
      await questionService.createCompany(newCompanyName);
      // Refresh companies list
      await fetchCompanies();
      handleAddCompanyClose();
    } catch (error) {
      console.error('Error adding company:', error);
      setResult({ 
        success: false, 
        message: `Failed to add company: ${error.message}` 
      });
    } finally {
      setAddingCompany(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult({ success: null, message: '' });

    try {
      if (!parsedData || parsedData.length === 0) {
        throw new Error('No valid data to upload');
      }

      // Add company ID to each question
      const questionsWithCompany = parsedData.map(question => ({
        ...question,
        companyId: parseInt(selectedCompany)
      }));

      // Send to API
      const response = await questionService.bulkCreateQuestions(questionsWithCompany);
      
      setResult({ 
        success: true, 
        message: `Successfully uploaded ${response.successCount || questionsWithCompany.length} questions. ${response.failedCount ? `Failed: ${response.failedCount}` : ''}` 
      });
    } catch (error) {
      setResult({ 
        success: false, 
        message: `Error uploading questions: ${error.message || 'Unknown error'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const exampleJson = JSON.stringify([
    {
      platformId: 1, // 1 for LeetCode, 2 for Codeforces, etc.
      questionId: "1", // Platform-specific ID
      title: "Two Sum",
      link: "https://leetcode.com/problems/two-sum/",
      topics: ["Array", "Hash Table"],
      difficulty: "Easy"
    }
  ], null, 2);

  const exampleCsv = `platformId,questionId,title,link,topics,difficulty
1,1,Two Sum,https://leetcode.com/problems/two-sum/,"Array;Hash Table",Easy
1,2,Add Two Numbers,https://leetcode.com/problems/add-two-numbers/,"Linked List;Math",Medium`;

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bulk Question Upload
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          {result.success !== null && (
            <Alert 
              severity={result.success ? 'success' : 'error'} 
              sx={{ mb: 2 }}
            >
              {result.message}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={9}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="company-select-label">Company</InputLabel>
                  <Select
                    labelId="company-select-label"
                    id="company-select"
                    value={selectedCompany}
                    label="Company"
                    onChange={handleCompanyChange}
                    required
                  >
                    {companies && companies.length > 0 ? (
                      companies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          {company.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled value="">
                        No companies available
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={3}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={handleAddCompanyOpen}
                  sx={{ mt: 2 }}
                >
                  Add Company
                </Button>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Choose File Format
              </Typography>
              <ToggleButtonGroup
                value={fileFormat}
                exclusive
                onChange={handleFormatChange}
                aria-label="file format"
                sx={{ mb: 2 }}
              >
                <ToggleButton value="json" aria-label="JSON format">
                  JSON
                </ToggleButton>
                <ToggleButton value="csv" aria-label="CSV format">
                  CSV
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Typography variant="subtitle1" gutterBottom>
                Upload {fileFormat.toUpperCase()} File
              </Typography>
              <input
                accept={fileFormat === 'json' ? 'application/json' : '.csv,text/csv'}
                style={{ display: 'none' }}
                id="contained-button-file"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="contained-button-file">
                <Button variant="contained" component="span">
                  Choose File
                </Button>
              </label>
              {fileName && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  File selected: {fileName}
                </Alert>
              )}
            </Box>

            {previewData.length > 0 && (
              <Box sx={{ mt: 3, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Preview (first 5 rows)
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Platform ID</TableCell>
                        <TableCell>Question ID</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Difficulty</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.platformId}</TableCell>
                          <TableCell>{item.questionId}</TableCell>
                          <TableCell>{item.title}</TableCell>
                          <TableCell>{item.difficulty}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  Total records: {parsedData ? parsedData.length : 0}
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 2 }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                disabled={loading || !parsedData || !selectedCompany}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Upload Questions'}
              </Button>
            </Box>
          </form>
        </Paper>
        
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {fileFormat.toUpperCase()} Format Example
          </Typography>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '1rem', 
            borderRadius: '4px', 
            overflow: 'auto',
            maxHeight: '300px' 
          }}>
            {fileFormat === 'json' ? exampleJson : exampleCsv}
          </pre>
        </Paper>
      </Box>

      {/* Dialog for adding a new company */}
      <Dialog open={openAddCompany} onClose={handleAddCompanyClose}>
        <DialogTitle>Add New Company</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="companyName"
            label="Company Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddCompanyClose} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleAddCompany} 
            color="primary" 
            disabled={addingCompany || !newCompanyName.trim()}
          >
            {addingCompany ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BulkQuestionUpload;