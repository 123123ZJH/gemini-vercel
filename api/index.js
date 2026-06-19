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

  // 2. 核心：处理获取模型列表的请求 (GET /v1/models)
  if (request.method === 'GET' && url.pathname === '/v1/models') {
      url.pathname = '/v1beta/models';
      
      const newRequest = new Request(url, request);
      newRequest.headers.set('Host', 'generativelanguage.googleapis.com');
      
      const response = await fetch(newRequest);
      const data = await response.json();
      
      // 将 Google 返回的模型格式转换为 OpenAI 兼容的格式
      const openaiModels = data.models
          .filter(model => model.name.includes('gemini')) // 只保留 gemini 系列
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

  // 3. 处理对话请求 (POST /v1/chat/completions)
  if (url.pathname === '/v1/chat/completions') {
    url.pathname = '/v1beta/openai/v1/chat/completions';
  }

  const newRequest = new Request(url, request);
  newRequest.headers.set('Host', 'generativelanguage.googleapis.com');

  const response = await fetch(newRequest);
  
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  
  return newResponse;
}
