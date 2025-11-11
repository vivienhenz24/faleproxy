const request = require('supertest');
const nock = require('nock');
const axios = require('axios');
const app = require('../app');
const { sampleHtmlWithYale } = require('./test-utils');

describe('API Endpoints', () => {
  beforeAll(() => {
    // Disable real HTTP requests during testing
    nock.disableNetConnect();
    // Allow localhost connections for supertest
    nock.enableNetConnect('127.0.0.1');
  });

  afterAll(() => {
    // Clean up nock
    nock.cleanAll();
    nock.enableNetConnect();
  });

  afterEach(() => {
    // Clear any lingering nock interceptors after each test
    nock.cleanAll();
    jest.restoreAllMocks();
  });

  test('GET / should serve the landing page', async () => {
    const response = await request(app).get('/');

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('<!DOCTYPE html>');
    expect(response.text).toContain('Faleproxy');
  });

  test('POST /fetch should return 400 if URL is missing', async () => {
    const response = await request(app)
      .post('/fetch')
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('URL is required');
  });

  test('POST /fetch should fetch and replace Yale with Fale', async () => {
    // Mock the external URL
    nock('https://example.com')
      .get('/')
      .reply(200, sampleHtmlWithYale);

    const response = await request(app)
      .post('/fetch')
      .send({ url: 'https://example.com/' });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.title).toBe('Fale University Test Page');
    expect(response.body.content).toContain('Welcome to Fale University');
    expect(response.body.content).toContain('https://www.yale.edu/about');  // URL should be unchanged
    expect(response.body.content).toContain('>About Fale<');  // Link text should be changed
  });

  test('POST /fetch should use axios when URL is not example.com', async () => {
    const sampleHtml = `
      <html>
        <head><title>Yale Club</title></head>
        <body>
          <p>Welcome Yale alumni!</p>
          <a href="https://yale.edu">Visit Yale</a>
        </body>
      </html>
    `;

    nock('https://another-site.com')
      .get('/')
      .reply(200, sampleHtml);

    const axiosSpy = jest.spyOn(axios, 'get');

    const response = await request(app)
      .post('/fetch')
      .send({ url: 'https://another-site.com/' });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.title).toBe('Fale Club');
    expect(response.body.content).toContain('Welcome Fale alumni!');
    expect(response.body.content).toContain('https://yale.edu');
    expect(axiosSpy).toHaveBeenCalled();
  });

  test('POST /fetch should handle errors from external sites', async () => {
    // Mock a failing URL
    nock('https://error-site.com')
      .get('/')
      .replyWithError('Connection refused');

    const response = await request(app)
      .post('/fetch')
      .send({ url: 'https://error-site.com/' });

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toContain('Failed to fetch content');
  });
});
