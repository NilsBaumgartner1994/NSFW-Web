// this should be the entry point to your library
module.exports = {
    ServerWeb: require('./ServerWeb').default, // eslint-disable-line global-require
    App: require('./App').default, // eslint-disable-line global-require
    AppMenu: require('./AppMenu').default, // eslint-disable-line global-require
};