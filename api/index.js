export const config = {
  runtime: 'edge', // 开启极速边缘网络
};

export default async function handler(request) {
  // 1. 处理跨域预检请求 (OPTIONS)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      }
    });
  }

  const url = new URL(request.url);
  url.hostname = 'generativelanguage.googleapis.com';

  // 2. 核心修复：处理获取模型列表的请求，并“翻译” API 密钥
  if (request.method === 'GET' && url.pathname.includes('/models')) {
      url.pathname = '/v1beta/models';
      
      const newHeaders = new Headers(request.headers);
      newHeaders.set('Host', 'generativelanguage.googleapis.com');
      
      // 【关键修复点】：把 OpenAI 格式的密钥转换成 Google 认识的专属格式
      const authHeader = newHeaders.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
          const apiKey = authHeader.split(' ')[1]; // 提取出真实的密钥
          newHeaders.set('x-goog-api-key', apiKey); // 贴上 Google 的专属标签
          newHeaders.delete('Authorization'); // 撕掉旧标签
      }

      const newRequest = new Request(url, {
          method: 'GET',
          headers: newHeaders
      });
      
      const response = await fetch(newRequest);
      const data = await response.json();
      
      // 提取所有 gemini 模型并转换为 Chatbox 认识的格式
      const openaiModels = (data.models || [])
          .filter(model => model.name.includes('gemini'))
          .map(model => ({
              id: model.name.replace('models/', ''),
              object: 'model',
              created: Math.floor(Date.now() / 1000),
              owned_by: 'google',
          }));

      return new Response(JSON.stringify({ object: 'list', data: openaiModels }), {
          headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
          }
      });
  }

  // 3. 处理对话请求 (自动兼容 OpenAI 格式路径)
  if (url.pathname.includes('/chat/completions')) {
    url.pathname = '/v1beta/openai/v1/chat/completions';
  }

  const newRequest = new Request(url, request);
  newRequest.headers.set('Host', 'generativelanguage.googleapis.com');

  const response = await fetch(newRequest);
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  
  return newResponse;
}
