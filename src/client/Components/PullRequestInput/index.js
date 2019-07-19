import React, { Component } from "react";

import axios from "axios";
import './index.css'

export default class PullRequestInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pullRequestUrl: "",
      analysisLines: []
    };
  }

  changePullRequest = (e) => {
    this.setState({
      pullRequestUrl: e.target.value
    })
  }

  onKeyDown = (e) => {
    if (e.key === 'Enter') {
      this.analyzePR();
    }
  }

  analyzePR = async () => {
    let pullRequest = this.state.pullRequestUrl.trim();

    // https://github.com/hudl/hudl-leroy/pull/2696/files
    if (!pullRequest || pullRequest.indexOf('github') === -1 || pullRequest.indexOf('pull') === -1) {
      console.log("Invalid URL")
      return;
    }

    let prSplit = pullRequest.split('/')

    // No HTTP or HTTPS
    if (prSplit[0] === "github.com") {
      pullRequest = `https://${pullRequest}`
      prSplit = pullRequest.split('/')
    }

    // Viewing /files instead of normal
    if (prSplit.length === 8 && prSplit[7] === 'files') {
      pullRequest = pullRequest.replace('/files', '')
    }

    // Viewing /files instead of normal
    if (prSplit.length === 8 && prSplit[7] === 'commits') {
      pullRequest = pullRequest.replace('/commits', '')
    }

    var analysisLines = await axios.post('/analyze-pr', { pullRequest })

    this.setState({
      analysisLines: analysisLines.data
    })
  }

  render() {
    return(
      <div id="pull-request-wrapper" className="form-group">
        <h1>Pull Request Analyzer</h1>

        <input type="text" className="form-control" placeholder="https://github.com/domain/repo/pull/XXXX" onChange={this.changePullRequest} onKeyDown={this.onKeyDown}/>
      
        { 
          this.state.analysisLines.map((line) => <div>{line.fileName} : {line.lineNumber} - {line.message}</div>)
        }
      </div>
    )
  }
}
