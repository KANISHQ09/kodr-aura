/**
 * Api Response Utility
 * Purpose: Provide a consistent response envelope for VidAsk APIs.
 * SRS Reference: Section 4.2 API Interfaces
 */
class ApiResponse {
    static success(data, message = 'Success', statusCode = 200) {
        return {
            success: true,
            statusCode,
            message,
            data,
        };
    }

    static error(message = 'Something went wrong', statusCode = 500) {
        return {
            success: false,
            statusCode,
            message,
        };
    }
}

export default ApiResponse;
