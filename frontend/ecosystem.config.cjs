module.exports = {
  apps: [
    {
      name: 'tmj-mes-frontend',
      script: 'node_modules/.bin/react-scripts',
      args: 'start',
      cwd: '/home/user/tmj-mes/frontend',
      env: {
        PORT: 3000,
        HOST: '0.0.0.0',
        BROWSER: 'none',
        REACT_APP_API_URL: 'http://localhost:8088/api',
        DANGEROUSLY_DISABLE_HOST_CHECK: 'true',
        WDS_SOCKET_HOST: '0.0.0.0',
        CI: 'false',
        GENERATE_SOURCEMAP: 'false',
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
    }
  ]
};
