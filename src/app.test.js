import { expect } from 'chai'
import request from 'supertest'

import { build } from './app.js'
import { getConfig, setConfig } from './config.js'

let app

describe('api', () => {
  beforeEach(async () => {
    app = await build()
  })

  describe('GET /', () => {
    it('GET / => hello', (done) => {
      request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(/{"message":"verification-service server status: ok."}/, done)
    })
  })

  describe('GET /unknown', () => {
    it('unknown endpoint returns 404', (done) => {
      request(app).get('/unknown').expect(404, done)
    }, 10000)
  })

  describe('POST /credentials/verify', () => {
    it('returns 400 if no body', (done) => {
      request(app)
        .post('/credentials/verify')
        .expect('Content-Type', /json/)
        .expect(400, done)
    })

    describe('/healthz', () => {
      it('returns 200 when healthy', async () => {
        await request(app)
          .get(`/healthz`)
          .expect('Content-Type', /json/)
          .expect((res) => {
            expect(res.body.message).to.contain('ok')
          })
          .expect(200)
      })
    })

    describe('/healthz fail', () => {
      // to force an error with the health check, we remove the
      // registries list

      beforeEach(async () => {
        getConfig().registries = []
      })
      afterEach(async () => {
        setConfig()
      })

      it('returns 503 when not healthy', async () => {
        await request(app)
          .get(`/healthz`)
          .expect('Content-Type', /json/)
          .expect((res) => {
            expect(res.body.error).to.contain('error')
          })
          .expect(503)
      })
    })
  })
})
