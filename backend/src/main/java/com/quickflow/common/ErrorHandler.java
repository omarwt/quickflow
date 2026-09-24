package com.quickflow.common;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/** Every error is problem+json; field-level problems are listed in {@code errors: [{field, message}]}. */
@RestControllerAdvice
public class ErrorHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ErrorHandler.class);

    public record FieldError(String field, String message) {
    }

    @ExceptionHandler(NotFoundException.class)
    ProblemDetail notFound(NotFoundException e) {
        return problem(HttpStatus.NOT_FOUND, e.getMessage(), null);
    }

    @ExceptionHandler(ApiException.class)
    ProblemDetail api(ApiException e) {
        return problem(e.status(), e.getMessage(), e.field() == null ? null : List.of(new FieldError(e.field(), e.getMessage())));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ProblemDetail badParam(MethodArgumentTypeMismatchException e) {
        String msg = "Invalid value '" + e.getValue() + "'" + allowed(e.getRequiredType());
        return problem(HttpStatus.BAD_REQUEST, msg, List.of(new FieldError(e.getName(), msg)));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail integrity(DataIntegrityViolationException e) {
        log.warn("integrity violation: {}", e.getMostSpecificCause().getMessage());
        return problem(HttpStatus.CONFLICT, "The request conflicts with existing data", null);
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail unexpected(Exception e) {
        log.error("unhandled error", e);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error", null);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException e, HttpHeaders h,
            HttpStatusCode s, WebRequest r) {
        List<FieldError> errors = e.getBindingResult().getFieldErrors().stream()
                .map(f -> new FieldError(f.getField(), f.getDefaultMessage())).toList();
        return ResponseEntity.badRequest().body(problem(HttpStatus.BAD_REQUEST, "Validation failed", errors));
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException e, HttpHeaders h,
            HttpStatusCode s, WebRequest r) {
        if (e.getCause() instanceof MismatchedInputException m && !m.getPath().isEmpty()) {
            String field = m.getPath().stream().map(p -> p.getFieldName() != null ? p.getFieldName() : "[" + p.getIndex() + "]")
                    .collect(Collectors.joining("."));
            Object value = m instanceof InvalidFormatException f ? f.getValue() : null;
            String msg = (value == null ? "Invalid value" : "Invalid value '" + value + "'") + allowed(m.getTargetType());
            return ResponseEntity.badRequest().body(problem(HttpStatus.BAD_REQUEST, msg, List.of(new FieldError(field, msg))));
        }
        return ResponseEntity.badRequest().body(problem(HttpStatus.BAD_REQUEST, "Malformed JSON request body", null));
    }

    private static String allowed(Class<?> type) {
        return type != null && type.isEnum()
                ? "; allowed values: " + Arrays.stream(type.getEnumConstants()).map(Object::toString).collect(Collectors.joining(", "))
                : "";
    }

    private static ProblemDetail problem(HttpStatus status, String detail, List<FieldError> errors) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(status, detail);
        if (errors != null) {
            p.setProperties(Map.of("errors", errors));
        }
        return p;
    }
}
