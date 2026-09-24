package com.quickflow.common;

import org.springframework.http.HttpStatus;

/** A business-rule failure: 400 for invalid input, 409 for a conflict with current state. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String field;

    private ApiException(HttpStatus status, String field, String message) {
        super(message);
        this.status = status;
        this.field = field;
    }

    public static ApiException badRequest(String field, String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, field, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, null, message);
    }

    public HttpStatus status() {
        return status;
    }

    public String field() {
        return field;
    }
}
