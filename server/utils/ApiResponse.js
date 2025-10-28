class ApiResponse {
  constructor(statusCode, data, message = "Success", redirectTo= null) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    this.redirectTo = redirectTo;
  }
}
export { ApiResponse };
