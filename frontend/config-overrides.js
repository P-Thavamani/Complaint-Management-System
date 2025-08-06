// config-overrides.js
module.exports = function override(config, env) {
  // Return the modified config
  return config;
};

// Fix for webpack-dev-server deprecation warnings
module.exports.devServer = function(configFunction) {
  return function(proxy, allowedHost) {
    const config = configFunction(proxy, allowedHost);
    
    // Replace deprecated onBeforeSetupMiddleware
    delete config.onBeforeSetupMiddleware;
    
    // Replace deprecated onAfterSetupMiddleware
    delete config.onAfterSetupMiddleware;
    
    // Add new setupMiddlewares function
    config.setupMiddlewares = (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      if (config.onBeforeSetupMiddleware) {
        config.onBeforeSetupMiddleware(devServer);
      }
      
      // Keep the middleware functionality
      const fs = require('fs');
      const paths = require('react-scripts/config/paths');
      const evalSourceMapMiddleware = require('react-dev-utils/evalSourceMapMiddleware');
      const noopServiceWorkerMiddleware = require('react-dev-utils/noopServiceWorkerMiddleware');
      const redirectServedPath = require('react-dev-utils/redirectServedPathMiddleware');
      
      // This lets us fetch source contents from webpack for the error overlay
      devServer.app.use(evalSourceMapMiddleware(devServer));
      
      if (fs.existsSync(paths.proxySetup)) {
        // This registers user provided middleware for proxy reasons
        require(paths.proxySetup)(devServer.app);
      }
      
      // Redirect to `PUBLIC_URL` or `homepage` from `package.json` if url not match
      devServer.app.use(redirectServedPath(paths.publicUrlOrPath));
      
      // This service worker file is effectively a 'no-op' that will reset any
      // previous service worker registered for the same host:port combination.
      devServer.app.use(noopServiceWorkerMiddleware(paths.publicUrlOrPath));
      
      return middlewares;
    };
    
    return config;
  };
};