export const environment = {
  production: false,
  auth0: {
    domain: 'dev-skrc3oude0nhleqs.us.auth0.com',
    clientId: '6XEiW5SoTUaBmWQjqXC6xmJhvjp6PqJW',
    authorizationParams: {
      redirect_uri:
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200',
    },
    httpInterceptor: {
      allowedList: ['/api/*'],
    },
  },
};
