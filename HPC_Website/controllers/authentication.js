module.exports.isAuthenticated = (req, res, next) => {
  if (req.session && typeof req.session.user !== 'undefined' && typeof req.session.authenticated !== 'undefined') {
    if (req.session.authenticated == true) {
      if (typeof req.session.isAdmin !== 'undefined' && req.session.isAdmin) {
        res.render('stats');
      }else{
        next();
      }
    }else{
      res.redirect('/login');
    }
  }else{
    res.redirect('/login');
  }
}

module.exports.isAdmin = (req, res, next) => {
  if (typeof req.session.isAdmin !== 'undefined' && req.session.isAdmin) {
    next();
  }else{
    res.redirect('/login');
  }
}

module.exports.logout = (req, res, next) => {
  req.session.destroy();
  res.redirect('/login');
}
