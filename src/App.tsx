import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact>
          <div>Home Page</div>
        </Route>
        <Route path="/about">
          <div>About Page</div>
        </Route>
        {/* Add more routes here */}
      </Switch>
    </Router>
  );
};

export default App;
