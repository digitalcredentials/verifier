export default function VerificationException(code, message, stack) {
  this.code = code
  this.message = message
  this.stack = stack
}
