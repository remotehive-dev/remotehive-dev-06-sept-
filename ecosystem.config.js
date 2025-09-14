module.exports = {
  apps: [
    {
      name: 'remotehive-admin',
      cwd: './remotehive-admin',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'http://localhost:8000',
        NEXT_PUBLIC_AUTOSCRAPER_API_URL: 'http://localhost:8001'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'http://localhost:8000',
        NEXT_PUBLIC_AUTOSCRAPER_API_URL: 'http://localhost:8001'
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'http://localhost:8000',
        NEXT_PUBLIC_AUTOSCRAPER_API_URL: 'http://localhost:8001'
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'http://localhost:8000',
        NEXT_PUBLIC_AUTOSCRAPER_API_URL: 'http://localhost:8001'
      },
      error_file: '/var/log/pm2/remotehive-admin-error.log',
      out_file: '/var/log/pm2/remotehive-admin-out.log',
      log_file: '/var/log/pm2/remotehive-admin.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'remotehive-public',
      cwd: './remotehive-public',
      script: 'npx',
      args: 'serve -s dist -l 5173',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 5173
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5173
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5173
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5173
      },
      error_file: '/var/log/pm2/remotehive-public-error.log',
      out_file: '/var/log/pm2/remotehive-public-out.log',
      log_file: '/var/log/pm2/remotehive-public.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'remotehive-celery-worker',
      cwd: './',
      script: 'celery',
      args: '-A app.tasks.celery_app worker --loglevel=info --concurrency=2',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PYTHONPATH: '.',
        C_FORCE_ROOT: 'true'
      },
      env_production: {
        PYTHONPATH: '.',
        C_FORCE_ROOT: 'true',
        CELERY_LOG_LEVEL: 'INFO'
      },
      env_staging: {
        PYTHONPATH: '.',
        C_FORCE_ROOT: 'true',
        CELERY_LOG_LEVEL: 'DEBUG'
      },
      env_development: {
        PYTHONPATH: '.',
        C_FORCE_ROOT: 'true',
        CELERY_LOG_LEVEL: 'DEBUG'
      },
      error_file: '/var/log/pm2/remotehive-celery-worker-error.log',
      out_file: '/var/log/pm2/remotehive-celery-worker-out.log',
      log_file: '/var/log/pm2/remotehive-celery-worker.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'remotehive-celery-beat',
      cwd: './',
      script: 'celery',
      args: '-A app.tasks.celery_app beat --loglevel=info',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        PYTHONPATH: '.',
        C_FORCE_ROOT: 'true'
      },
      env_production: {
        PYTHONPATH: '.',
        C_FORCE_ROOT: 'true',
        CELERY_LOG_LEVEL: 'INFO'
      },
      env_staging: {
        PYTHONPATH: '.',
        C_FORCE_ROOT: 'true',
        CELERY_LOG_LEVEL: 'DEBUG'
      },
      env_development: {
        PYTHONPATH: '.',
        C_FORCE_ROOT: 'true',
        CELERY_LOG_LEVEL: 'DEBUG'
      },
      error_file: '/var/log/pm2/remotehive-celery-beat-error.log',
      out_file: '/var/log/pm2/remotehive-celery-beat-out.log',
      log_file: '/var/log/pm2/remotehive-celery-beat.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: process.env.VPC_HOST || 'localhost',
      ref: 'origin/main',
      repo: process.env.GIT_REPO || 'https://github.com/YOUR_USERNAME/RemoteHive.git',
      path: '/home/ubuntu/RemoteHive',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'ubuntu',
      host: process.env.VPC_HOST || 'localhost',
      ref: 'origin/develop',
      repo: process.env.GIT_REPO || 'https://github.com/YOUR_USERNAME/RemoteHive.git',
      path: '/home/ubuntu/RemoteHive-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    }
  }
};