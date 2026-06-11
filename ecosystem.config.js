module.exports = {
  apps: [
    {
      name: 'mes-app',
      script: 'node_modules/.bin/serve',
      args: '-s build -l 3000',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'production',
      },
      watch: false,
      instances: 1,
      autorestart: true,
    },
  ],
};
