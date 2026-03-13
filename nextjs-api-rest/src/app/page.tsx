export default function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>99Freela API REST</h1>
      <p>API desenvolvida com Next.js API Routes</p>

      <h2>Endpoints Disponíveis:</h2>
      <ul>
        <li><strong>POST</strong> <code>/api/auth/register</code> - Registrar usuário</li>
        <li><strong>POST</strong> <code>/api/auth/login</code> - Autenticar</li>
        <li><strong>GET</strong> <code>/api/auth/me</code> - Obter dados do usuário autenticado</li>
        <li><strong>GET</strong> <code>/api/users</code> - Listar usuários (com filtros)</li>
        <li><strong>POST</strong> <code>/api/users</code> - Criar usuário</li>
        <li><strong>GET</strong> <code>/api/users/:id</code> - Obter usuário por ID</li>
        <li><strong>PUT</strong> <code>/api/users/:id</code> - Atualizar usuário</li>
        <li><strong>DELETE</strong> <code>/api/users/:id</code> - Excluir usuário</li>
        <li><strong>GET</strong> <code>/api/health</code> - Health check</li>
        <li><strong>GET</strong> <code>/api/docs</code> - Documentação da API (Swagger UI)</li>
      </ul>

      <h2>Autenticação:</h2>
      <p>Use o token JWT recebido no login no header:</p>
      <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '4px' }}>
        Authorization: Bearer {token}
      </pre>

      <h2>Usuários de Teste:</h2>
      <ul>
        <li>Admin: <code>admin@99freela.com</code> / <code>admin123</code></li>
        <li>Usuário: <code>user@99freela.com</code> / <code>user123</code></li>
      </ul>
    </div>
  );
}
