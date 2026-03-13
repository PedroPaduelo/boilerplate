import { NextRequest, NextResponse } from 'next/server';

const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: '99Freela API REST',
    description: 'API REST completa com Next.js - Autenticação, CRUD de Usuários, Validação e Documentação',
    version: '1.0.0',
    contact: {
      name: '99Freela',
      url: 'https://99freela.com.br'
    }
  },
  servers: [
    {
      url: 'http://localhost:4001',
      description: 'Servidor de desenvolvimento'
    }
  ],
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Autenticar usuário',
        description: 'Autentica um usuário com email e senha e retorna um token JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@example.com' },
                  password: { type: 'string', minLength: 6, example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Autenticação bem-sucedida',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string' }
                      }
                    },
                    token: { type: 'string' }
                  }
                }
              }
            }
          },
          '401': { description: 'Credenciais inválidas' }
        }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar novo usuário',
        description: 'Cria um novo usuário e retorna o token JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', minLength: 6, example: 'password123' },
                  role: { type: 'string', enum: ['USER', 'ADMIN'], default: 'USER' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Usuário criado com sucesso' },
          '400': { description: 'Dados inválidos' },
          '409': { description: 'Email já existe' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Obter dados do usuário autenticado',
        description: 'Retorna os dados do usuário logado atualmente',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Dados do usuário' },
          '401': { description: 'Não autorizado' }
        }
      }
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'Listar usuários',
        description: 'Lista todos os usuários com paginação e filtros',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'number', default: 10 } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['ADMIN', 'USER'] } },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Lista de usuários' },
          '401': { description: 'Não autorizado' }
        }
      },
      post: {
        tags: ['Users'],
        summary: 'Criar usuário',
        description: 'Cria um novo usuário (requer autenticação)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  role: { type: 'string', enum: ['USER', 'ADMIN'], default: 'USER' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Usuário criado' },
          '400': { description: 'Dados inválidos' },
          '401': { description: 'Não autorizado' },
          '409': { description: 'Email já existe' }
        }
      }
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Obter usuário por ID',
        description: 'Retorna os dados de um usuário específico',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Dados do usuário' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Usuário não encontrado' }
        }
      },
      put: {
        tags: ['Users'],
        summary: 'Atualizar usuário',
        description: 'Atualiza os dados de um usuário',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  role: { type: 'string', enum: ['USER', 'ADMIN'] },
                  isActive: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Usuário atualizado' },
          '400': { description: 'Dados inválidos' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Usuário não encontrado' }
        }
      },
      delete: {
        tags: ['Users'],
        summary: 'Excluir usuário',
        description: 'Remove um usuário do sistema',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '204': { description: 'Usuário excluído' },
          '401': { description: 'Não autorizado' },
          '404': { description: 'Usuário não encontrado' }
        }
      }
    },
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Verifica se a API está funcionando',
        responses: {
          '200': { description: 'API está funcionando' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtido em /api/auth/login'
      }
    }
  },
  tags: [
    { name: 'Auth', description: 'Endpoints de autenticação' },
    { name: 'Users', description: 'Gerenciamento de usuários' },
    { name: 'Health', description: 'Verificação de saúde da API' }
  ]
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const format = url.searchParams.get('format');

  if (format === 'json') {
    return NextResponse.json(openApiSpec);
  }

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>99Freela API - Documentação</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui.css">
  <style>
    body { margin: 0; padding: 0; }
    .topbar { display: none; }
    .swagger-ui .info { margin: 30px 0; }
    .swagger-ui .info .title { font-size: 2.5em; }
    .language-select { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        spec: ${JSON.stringify(openApiSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: 'StandaloneLayout',
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        supportedSubmitMethods: ['get', 'put', 'post', 'delete', 'options', 'head', 'patch']
      });
    };
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html'
    }
  });
}
