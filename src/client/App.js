import React, { Component } from 'react';
import './App.css';

import { BrowserRouter as Router, Route } from "react-router-dom";

import PullRequestInput from "./Components/PullRequestInput/index";

class App extends Component {
  render() {
    return (
      <Router>
        <Route path="/" exact component={ PullRequestInput } />
      </Router>
    );
  }
}

export default App;
