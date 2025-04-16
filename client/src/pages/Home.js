import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="jumbotron">
      <h1 className="display-4">Welcome to Postgres App</h1>
      <p className="lead">
        This is a simple application that demonstrates authentication and user management with PostgreSQL database.
      </p>
      <hr className="my-4" />
      <p>
        Get started by creating an account or logging in if you already have one.
      </p>
      <div className="d-flex gap-2">
        <Link to="/signup" className="btn btn-success">Sign Up</Link>
        <Link to="/login" className="btn btn-primary">Login</Link>
      </div>
    </div>
  );
};

export default Home;