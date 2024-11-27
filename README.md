# Digital Credentials Consortium Verifiable Credentials Verification Service

[![Build status](https://img.shields.io/github/actions/workflow/status/digitalcredentials/verification-service/main.yml?branch=main)](https://github.com/digitalcredentials/verification-service/actions?query=workflow%3A%22Node.js+CI%22)

IMPORTANT NOTE ABOUT VERSIONING: If you are using a Docker Hub image of this repository, make sure you are reading the version of this README that corresponds to your Docker Hub version.  If, for example, you are using the image `digitalcredentials/verification-service:0.1.0` then you'll want to use the corresponding tagged repo: [https://github.com/digitalcredentials/verification-service/tree/v0.1.0](https://github.com/digitalcredentials/verification-service/tree/v0.1.0). If you are new here, then just read on...

## Table of Contents

- [Summary](#summary)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [DID Registries](#did-registries)
- [Usage](#usage)
  - [Verify a credential](#verify-a-credential)
    - [Verifiable Credential](#verifiable-credential)
    - [Verifiable Presentation](#verifiable-presentation)
- [Versioning](#versioning)
- [Logging](#logging)
- [Health Check](#health-check)
- [Development](#development)
  - [Testing](#testing)
- [Contribute](#contribute)
- [License](#license)

## Summary

Use this express server to verify a [Verifiable Credential](https://www.w3.org/TR/vc-data-model/) or a [Verifiable Presentation](https://www.w3.org/TR/vc-data-model-2.0/#presentations). This is a conforming implemetation of the [VC-API Specification](https://w3c-ccg.github.io/vc-api/).

Implements three http endpoints:

 * POST /credentials/verify

Which verifies a [Verifiable Credential](https://www.w3.org/TR/vc-data-model/) that has been posted to it, as defined by the [VC-API Specification](https://w3c-ccg.github.io/vc-api/#verify-credential)

 * GET /presentations/verify

 https://w3c-ccg.github.io/vc-api/#verify-presentation

Which verifies a [Verifiable Presentation](https://www.w3.org/TR/vc-data-model-2.0/#presentations) that has been posted to it, as defined by the [VC-API Specification](https://w3c-ccg.github.io/vc-api/#verify-presentation)

* GET /healthz

Which is an endpoint typically meant to be called by the Docker [HEALTHCHECK](https://docs.docker.com/reference/dockerfile/#healthcheck) option for a specific service. Read more below in the [Health Check](#health-check) section.

The verification endpoints are meant to be called as a RESTful service from any software wanting to verify a credential.

## Quick Start

You can try this verification-service in about three minutes:

1. Install Docker, which is made very easy with the [Docker installers for Windows, Mac, and Linux](https://docs.docker.com/engine/install/).

2. From a terminal prompt, run:

```
docker run -dp 4009:4009 digitalcredentials/verification-service:0.1.0
```

You can now verify credentials as explained in the [Verify a Credential](#verify-a-credential) section.


## Configuration

### Environment Variables

There is a sample .env file provided called .env.example to help you get started with your own .env file. The supported fields:

| Key | Description | Default | Required |
| --- | --- | --- | --- |
| `PORT` | http port on which to run the express app | 4006 | no |
| `ENABLE_ACCESS_LOGGING` | log all http calls to the service - see [Logging](#logging) | true | no |
| `ERROR_LOG_FILE` | log file for all errors - see [Logging](#logging) | no | no |
| `LOG_ALL_FILE` | log file for everything - see [Logging](#logging) | no | no |
| `CONSOLE_LOG_LEVEL` | console log level - see [Logging](#logging) | silly | no |
| `LOG_LEVEL` | log level for application - see [Logging](#logging) | silly | no |
| `HEALTH_CHECK_SMTP_HOST` | SMTP host for unhealthy notification emails - see [Health Check](#health-check) | no | no |
| `HEALTH_CHECK_SMTP_USER` | SMTP user for unhealthy notification emails - see [Health Check](#health-check) | no | no |
| `HEALTH_CHECK_SMTP_PASS` | SMTP password for unhealthy notification emails - see [Health Check](#health-check) | no | no |
| `HEALTH_CHECK_EMAIL_FROM` | name of email sender for unhealthy notifications emails - see [Health Check](#health-check) | no | no |
| `HEALTH_CHECK_EMAIL_RECIPIENT` | recipient when unhealthy - see [Health Check](#health-check) | no | no |
| `HEALTH_CHECK_EMAIL_SUBJECT` | email subject when unhealthy - see [Health Check](#health-check) | no | no |
| `HEALTH_CHECK_WEB_HOOK` | posted to when unhealthy - see [Health Check](#health-check) | no | no |
| `HEALTH_CHECK_SERVICE_URL` | local url for this service - see [Health Check](#health-check) | http://SIGNER:4006/healthz | no |
| `HEALTH_CHECK_SERVICE_NAME` | service name to use in error messages - see [Health Check](#health-check) | SIGNING-SERVICE | no |


### DID Registries

So that a verifier knows that a credential was signed by a key that is really owned by the claimed issuer, the key (encoded as a [DID](https://www.w3.org/TR/did-core/)) has to be confirmed as really belonging to that issuer.  This is typically done by adding the DID to a well known registry that the verifier checks when verifying a credential.

The DCC provides a number of registries that are pre-configured to work with this verifier. The DCC registries use Github for storage.  To request that your [DID](https://www.w3.org/TR/did-core/) be added to a registry, submit a pull request in which you've added your [DID](https://www.w3.org/TR/did-core/) to the registry file.

You can also use different registries by following the example of the DCC [issuer-registry-client](https://github.com/digitalcredentials/issuer-registry-client) to create your own registry client and then simply import that in package.json.

## Usage

This express app can be run a few different ways:

#### NPM

You can start the script using NPM, like is done with the `start` script in package.json

#### Directly from DockerHub

You can directly from the DockerHub image, using a default configuration, with:

  `docker run -dp 4009:4009 digitalcredentials/verification-service:0.1.0`

To run it with your own configuration:

``docker run --env-file .env -dp 4009:4009 digitalcredentials/verification-service:0.1.0`

where the `.env` file contains your environment variables. See [.env.example](./.env.example).

#### With Docker Compose

See how we do that in the [DCC admin dashboard](https://github.com/digitalcredentials/docs/blob/main/deployment-guide/docker-compose-files/dashboard-dns-compose.yaml) which also provides an example of how to configure your DNS with nginx and ngnix-proxy.

Note that to run this with Docker, you'll of course need to install Docker, which is very easy with the [Docker installers for Windows, Mac, and Linux](https://docs.docker.com/engine/install/).

### Verify a credential

Try it out with this CURL command, which you simply paste into the terminal (once you've got your verifier running on your computer, as described above):

<details> 
<summary>Show code</summary>
  
```
curl --location 'http://localhost:4009/credentials/verify' \
--header 'Content-Type: application/json' \
--data-raw '{
  "verifiableCredential":{
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json",
        "https://w3id.org/security/suites/ed25519-2020/v1"
    ],
    "id": "urn:uuid:2fe53dc9-b2ec-4939-9b2c-0d00f6663b6c",
    "type": [
        "VerifiableCredential",
        "OpenBadgeCredential"
    ],
    "name": "DCC Test Credential",
    "issuer": {
        "type": [
            "Profile"
        ],
        "id": "did:key:z6MknNQD1WHLGGraFi6zcbGevuAgkVfdyCdtZnQTGWVVvR5Q",
        "name": "Digital Credentials Consortium Test Issuer",
        "url": "https://dcconsortium.org",
        "image": "https://user-images.githubusercontent.com/752326/230469660-8f80d264-eccf-4edd-8e50-ea634d407778.png"
    },
    "issuanceDate": "2023-08-02T17:43:32.903Z",
    "credentialSubject": {
        "type": [
            "AchievementSubject"
        ],
        "achievement": {
            "id": "urn:uuid:bd6d9316-f7ae-4073-a1e5-2f7f5bd22922",
            "type": [
                "Achievement"
            ],
            "achievementType": "Diploma",
            "name": "Badge",
            "description": "This is a sample credential issued by the Digital Credentials Consortium to demonstrate the functionality of Verifiable Credentials for wallets and verifiers.",
            "criteria": {
                "type": "Criteria",
                "narrative": "This credential was issued to a student that demonstrated proficiency in the Python programming language that occurred from **February 17, 2023** to **June 12, 2023**."
            },
            "image": {
                "id": "https://user-images.githubusercontent.com/752326/214947713-15826a3a-b5ac-4fba-8d4a-884b60cb7157.png",
                "type": "Image"
            }
        },
        "name": "Jane Doe"
    },
    "proof": {
        "type": "Ed25519Signature2020",
        "created": "2023-10-05T11:17:41Z",
        "verificationMethod": "did:key:z6MknNQD1WHLGGraFi6zcbGevuAgkVfdyCdtZnQTGWVVvR5Q#z6MknNQD1WHLGGraFi6zcbGevuAgkVfdyCdtZnQTGWVVvR5Q",
        "proofPurpose": "assertionMethod",
        "proofValue": "z5fk6gq9upyZvcFvJdRdeL5KmvHr69jxEkyDEd2HyQdyhk9VnDEonNSmrfLAcLEDT9j4gGdCG24WHhojVHPbRsNER"
    }
  }
}'
```
</details>

This should return a result, printed to the terminal, that should look something like this (it may be all smushed up, but you can format it in something like [json lint](https://jsonlint.com):

<details> 
<summary>Show code</summary>
  
```
TODO: add verification result
```
</details>

NOTE: CURL can get a bit clunky if you want to experiment - you might consider trying [Postman](https://www.postman.com/downloads/) which makes it a bit easier to construct and send http calls.

## Versioning

For convenience we've published docker images for the verification-service to Docker Hub so that you don't have to build it locally yourself from the github repositories.

The images on Docker Hub will of course at times be updated to add new functionality and fix bugs. Rather than overwrite the default (`latest`) version on Docker Hub for each update, we've adopted the [Semantic Versioning Guidelines](https://semver.org) with our docker image tags.

We DO NOT provide a `latest` tag so you must provide a tag name (i.e, the version number) for the images in your docker compose file.

If you do ever want to work from the source code in the repository and build your own images, we've tagged the commits in Github that were used to build the corresponding Docker image. So a github tag of v0.1.0 coresponds to a docker image tag of 0.1.0

## Logging

We support the following log levels:

```
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
```

Logging is configured with environment variables, as defined in the [Environment Variables](#environment-variables) section.

By default, everything is logged to the console (log level `silly`).

All http calls to the service are logged by default, which might bloat the log. You can disable access logging with:

```ENABLE_ACCESS_LOGGING=false```

You may set the log level for the application as whole, e.g.,

```LOG_LEVEL=http```

Which would only log messages with severity 'http' and all below it (info, warn, error).

The default is to log everything (level 'silly').

You can also set the log level for console logging, e.g.,

```CONSOLE_LOG_LEVEL=debug```

This would log everything for severity 'debug' and lower (i.e., verbose, http, info, warn, error). This of course assumes that you've set the log level for the application as a whole to at least the same level.

The default log level for the console is 'silly', which logs everything.

There are also two log files that can be enabled:

* errors (only logs errors)
* all (logs everything - all log levels)

Enable each log by setting an env variable for each, indicating the path to the appropriate file, like this example:

```
LOG_ALL_FILE=logs/all.log
ERROR_LOG_FILE=logs/error.log
```
## Health Check

Docker has a [HEALTHCHECK](https://docs.docker.com/reference/dockerfile/#healthcheck) option for monitoring the
state (health) of a container. We've included an endpoint `GET healthz` that checks the health of the signing service (by running a test signature). The endpoint can be directly specified in a CURL or WGET call on the HEALTHCHECK, but we also provide a [healthcheck.js](./healthcheck.js) function that can be similarly invoked by the HEALTHCHECK and which itself hits the `healthz` endpoint, but additionally provides options for both email and Slack notifications when the service is unhealthy. 

You can see how we've configured the HEALTHCHECK in our [example compose files](https://github.com/digitalcredentials/docs/blob/main/deployment-guide/DCCDeploymentGuide.md#docker-compose-examples). Our compose files also include an example of how to use [autoheal](https://github.com/willfarrell/docker-autoheal) together with HEALTHCHECK to restart an unhealthy container.

If you want notifications sent to a Slack channel, you'll have to set up a Slack [web hook](https://api.slack.com/messaging/webhooks).

If you want notifications sent to an email address, you'll need an SMTP server to which you can send emails, so something like sendgrid, mailchimp, mailgun, or even your own email account if it allows direct SMTP sends. Gmail can apparently be configured to so so.

## Development

### Installation

Clone code then cd into directory and:

```
npm install
npm run dev
```

If for whatever reason you need to run the server over https, you can set the `ENABLE_HTTPS_FOR_DEV` environment variable to true.  Note, though, that this should ONLY be used for development.

### Testing

Testing uses supertest, jest, and nock to test the endpoints.  To run tests:

```npm run test```

Because the revocation (status) system uses github to store status, calls are made out to github during issuance.  Rather than have to make these calls for every test, and possibly in cases where outgoing http calls aren't ideal, we've used [nock](https://github.com/nock/nock) to mock out the http calls to the github api, so that the actual calls needn't be made - nock instead returns our precanned replies.  Creating mocks can be time consuming, though, so we've also opted to use the recording feature of nock which allows us to run the tests in 'record' mode which will make the real calls out to Github, and record the results so they can be used for future calls.

## Contribute

PRs accepted.

If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

[MIT License](LICENSE.md) © 2024 Digital Credentials Consortium.
