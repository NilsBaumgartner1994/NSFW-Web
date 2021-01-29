// this should be the entry point to your library
module.exports = {
    ServerWeb: require('./ServerWeb').default, // eslint-disable-line global-require
    App: require('./App').default, // eslint-disable-line global-require
    HomeComponent: require('./screens/home/HomeComponent').default, // eslint-disable-line global-require
    Login: require('./screens/auth/Login').default, // eslint-disable-line global-require
};