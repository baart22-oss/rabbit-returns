import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import Home from './Home';
import Auth from './Auth';
import Dashboard from './Dashboard';
import Invest from './Invest';
import Raffle from './Raffle';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Switch>
          <Route path='/' exact component={Home} />
          <Route path='/auth' component={Auth} />
          <Route path='/dashboard' component={Dashboard} />
          <Route path='/invest' component={Invest} />
          <Route path='/raffle' component={Raffle} />
        </Switch>
      </Router>
    </AuthProvider>
  );
};

export default App;