import express from 'express'
import cors from 'cors'
import axios from 'axios'
import accessLogger from './middleware/accessLogger.js'
import errorHandler from './middleware/errorHandler.js'
import errorLogger from './middleware/errorLogger.js'
import invalidPathHandler from './middleware/invalidPathHandler.js'
import VerificationException from './VerificationException.js'
import { verifyCredential } from './verify.js'
import { getSignedVC } from './test-fixtures/vc.js'

export async function build() {
  var app = express()

  // Add middleware to write http access logs
  app.use(accessLogger())
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))
  app.use(cors())

  app.get('/healthz', async function (req, res) {
    try {
      const { data } = await axios.post(
        `${req.protocol}://${req.headers.host}/credentials/verify`,
        getSignedVC()
      )
      console.log('the verification result in healthz:')
      console.log(data)
      if (!data.verified)
        throw new VerificationException(
          503,
          'transaction-service healthz failed'
        )
    } catch (e) {
      console.log(`exception in healthz: ${JSON.stringify(e)}`)
      return res.status(503).json({
        error: `verification-service healthz check failed with error: ${e}`,
        healthy: false
      })
    }
    res.send({
      message: 'verification-service server status: ok.',
      healthy: true
    })
  })

  app.get('/', function (req, res) {
    res.send({ message: 'verification-service server status: ok.' })
  })

  app.post('/credentials/verify', async (req, res, next) => {
    try {
      const vc = req.body?.verifiableCredential
      if (!req.body || !Object.keys(req.body).length) {
        throw new VerificationException(
          400,
          'A verifiableCredential property must be provided in the body and it must contain a verifiable credential.'
        )
      }
      const verificationResult = await verifyCredential(vc)

      if (verificationResult.verified) {
        return res.json(verificationResult)
      } else {
        throw new VerificationException(400, 'invalid input!')
      }
    } catch (e) {
      // catch the async errors and pass them to the error logger and handler
      next(e)
    }
  })

  // Attach the error handling middleware calls, in the order that they should run
  app.use(errorLogger)
  app.use(errorHandler)
  app.use(invalidPathHandler)

  return app
}
