
export const config = {
  runtime: 'edge', // 开启极速边缘网络
};

export default async function handler(request) {
  // 处理跨域预检
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

  // 自动兼容 OpenAI 格式路径
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
