module.exports = {
  apps: [
    {
      name: 'remotehive-admin',
      script: 'npm',
      args: 'run preview',
      cwd: '/opt/remotehive/admin-panel',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      // Logging
      log_file: '/opt/remotehive/logs/admin-panel.log',
      out_file: '/opt/remotehive/logs/admin-panel-out.log',
      error_file: '/opt/remotehive/logs/admin-panel-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Process management
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Advanced settings
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Environment variables from file
      env_file: '/opt/remotehive/.env.production'
    },
    {
      name: 'remotehive-public',
      script: 'npm',
      args: 'run preview',
      cwd: '/opt/remotehive/public-website',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5173,
        HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5173,
        HOST: '0.0.0.0'
      },
      // Logging
      log_file: '/opt/remotehive/logs/public-website.log',
      out_file: '/opt/remotehive/logs/public-website-out.log',
      error_file: '/opt/remotehive/logs/public-website-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Process management
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Advanced settings
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Environment variables from file
      env_file: '/opt/remotehive/.env.production'
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'remotehive',
      host: ['210.79.129.9'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/remotehive.git',
      path: '/opt/remotehive',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },
    staging: {
      user: 'remotehive',
      host: ['210.79.129.9'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/remotehive.git',
      path: '/opt/remotehive-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  },
  
  // Global PM2 settings
  pm2_serve_path: '/opt/remotehive/public',
  pm2_serve_port: 8080,
  pm2_serve_spa: true,
  pm2_serve_homepage: '/index.html',
  
  // Monitoring and metrics
  pmx: true,
  
  // Error handling
  error_file: '/opt/remotehive/logs/pm2-error.log',
  out_file: '/opt/remotehive/logs/pm2-out.log',
  log_file: '/opt/remotehive/logs/pm2.log',
  
  // Process monitoring
  monitoring: {
    http: true,
    https: false,
    port: 9615,
    refresh: 5000
  }
};