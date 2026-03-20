module.exports = {
  apps: [
    {
      name: 'docs-boilerplate',
      script: 'serve',
      args: 'docs/ -l 4006 --no-clipboard',
      cwd: '/workspace/temp-orquestrador/users/5aaf347f-952f-4355-8513-ac3f4024b43e/projetos/boilerplate',
      interpreter: '/usr/bin/node',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
