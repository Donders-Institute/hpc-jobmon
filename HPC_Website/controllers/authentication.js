module.exports.isAuthenticated = (req, res, next) => {
  if (req.session && typeof req.session.user !== 'undefined' && typeof req.session.authenticated !== 'undefined') {
    if (req.session.authenticated == true) {
      next();
    }else{
      res.redirect('/login');
    }
  }else{
    res.redirect('/login');
  }
}

module.exports.logout = (req, res, next) => {
  req.session.destroy();
  res.redirect('/login');
}
