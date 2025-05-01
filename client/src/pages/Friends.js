import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Avatar, 
  Box, 
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { PersonAdd, PersonRemove, Search, People } from '@mui/icons-material';
import { searchUsers, getUserFriends, addFriend, removeFriend } from '../services/profileService';

const Friends = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Fetch user's friends on component mount
  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const response = await getUserFriends();
        setFriends(response.friends);
      } catch (err) {
        setError('Failed to fetch friends. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
    fetchAllUsers();
  }, []);

  // Fetch all users
  const fetchAllUsers = async () => {
    setUsersLoading(true);
    try {
      // Use an empty search term to get all users (we'll implement this on the backend)
      const response = await searchUsers("");
      setAllUsers(response.users);
    } catch (err) {
      console.error('Error fetching all users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle user search
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setSearchLoading(true);
    setError('');
    
    try {
      const response = await searchUsers(searchTerm);
      setSearchResults(response.users);
      if (response.users.length === 0) {
        setError('No users found matching your search');
      }
    } catch (err) {
      setError('Error searching for users. Please try again.');
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle adding a friend
  const handleAddFriend = async (username) => {
    try {
      await addFriend(username);
      
      // Update the search results to show that this user is now a friend
      setSearchResults(prevResults => 
        prevResults.map(user => 
          user.username === username ? { ...user, isFriend: true } : user
        )
      );
      
      // Update all users list
      setAllUsers(prevUsers => 
        prevUsers.map(user => 
          user.username === username ? { ...user, isFriend: true } : user
        )
      );
      
      // Fetch updated friends list
      const response = await getUserFriends();
      setFriends(response.friends);
      
      setSuccess(`${username} added as a friend!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add friend. Please try again.');
      console.error(err);
    }
  };

  // Handle removing a friend
  const handleRemoveFriend = async (username) => {
    try {
      await removeFriend(username);
      
      // Update the search results if the removed friend is in there
      setSearchResults(prevResults => 
        prevResults.map(user => 
          user.username === username ? { ...user, isFriend: false } : user
        )
      );
      
      // Update all users list
      setAllUsers(prevUsers => 
        prevUsers.map(user => 
          user.username === username ? { ...user, isFriend: false } : user
        )
      );
      
      // Update the friends list
      setFriends(prevFriends => prevFriends.filter(friend => friend.username !== username));
      
      setSuccess(`${username} removed from friends!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to remove friend. Please try again.');
      console.error(err);
    }
  };

  // Helper function to display user name
  const displayName = (user) => {
    if (user.first_name || user.lastName) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.username;
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Friends
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="friends tabs">
          <Tab label="My Friends" />
          <Tab label="Find Friends" />
          <Tab label="All Users" />
        </Tabs>
      </Box>

      {/* Error and Success Messages */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      {/* Tab 0: My Friends */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            My Friends
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <CircularProgress />
            </Box>
          ) : friends.length > 0 ? (
            <Grid container spacing={2}>
              {friends.map((friend) => (
                <Grid item xs={12} sm={6} md={4} key={friend.username}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          src={friend.profile_pic} 
                          alt={friend.username} 
                          sx={{ mr: 2 }}
                        >
                          {friend.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{displayName(friend)}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            @{friend.username}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        startIcon={<PersonRemove />} 
                        onClick={() => handleRemoveFriend(friend.username)}
                        size="small"
                        color="error"
                        fullWidth
                      >
                        Remove Friend
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">You don't have any friends yet. Search for users to add friends!</Alert>
          )}
        </Box>
      )}
      
      {/* Tab 1: Find Friends (Search) */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Find Friends
          </Typography>
          
          <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <TextField
              label="Search by username or name"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mr: 2 }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              startIcon={searchLoading ? <CircularProgress size={24} color="inherit" /> : <Search />}
              disabled={searchLoading}
            >
              Search
            </Button>
          </Box>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Search Results
              </Typography>
              <Grid container spacing={2}>
                {searchResults.map((user) => (
                  <Grid item xs={12} sm={6} md={4} key={user.username}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar 
                            src={user.profile_pic} 
                            alt={user.username} 
                            sx={{ mr: 2 }}
                          >
                            {user.username.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="h6">{displayName(user)}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              @{user.username}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                      <CardActions>
                        {!user.isFriend ? (
                          <Button 
                            startIcon={<PersonAdd />} 
                            onClick={() => handleAddFriend(user.username)}
                            size="small"
                            color="primary"
                            fullWidth
                          >
                            Add Friend
                          </Button>
                        ) : (
                          <Button 
                            startIcon={<PersonRemove />} 
                            onClick={() => handleRemoveFriend(user.username)}
                            size="small"
                            color="error"
                            fullWidth
                          >
                            Remove Friend
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      )}
      
      {/* Tab 2: All Users */}
      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center">
            <People sx={{ mr: 1 }} /> All Users
          </Typography>
          
          {usersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <CircularProgress />
            </Box>
          ) : allUsers.length > 0 ? (
            <Grid container spacing={2}>
              {allUsers.map((user) => (
                <Grid item xs={12} sm={6} md={4} key={user.username}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          src={user.profile_pic} 
                          alt={user.username} 
                          sx={{ mr: 2 }}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{displayName(user)}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            @{user.username}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions>
                      {!user.isFriend ? (
                        <Button 
                          startIcon={<PersonAdd />} 
                          onClick={() => handleAddFriend(user.username)}
                          size="small"
                          color="primary"
                          fullWidth
                        >
                          Add Friend
                        </Button>
                      ) : (
                        <Button 
                          startIcon={<PersonRemove />} 
                          onClick={() => handleRemoveFriend(user.username)}
                          size="small"
                          color="error"
                          fullWidth
                        >
                          Remove Friend
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">No users found.</Alert>
          )}
        </Box>
      )}
    </Container>
  );
};

export default Friends;