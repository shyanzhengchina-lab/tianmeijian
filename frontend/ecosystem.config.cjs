module.exports = {
  apps: [
    {
      name: 'tmj-mes-frontend',
      script: 'node_modules/.bin/react-scripts',
      args: 'start',
      cwd: '/home/user/tmj-mes/frontend',
      env: {
        PORT: 3000,
        HOST: '127.0.0.1',
        BROWSER: 'none',
        REACT_APP_API_URL: '',
        DANGEROUSLY_DISABLE_HOST_CHECK: 'true',
        WDS_SOCKET_HOST: '0.0.0.0',
        WDS_SOCKET_PORT: '0',
        CI: 'false',
        GENERATE_SOURCEMAP: 'false',
        FAST_REFRESH: 'false',
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
    }
  ]
};
